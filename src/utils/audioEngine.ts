import type { Beat } from '../types/beat'

class AudioEngine {
  private ctx: AudioContext | null = null
  private analyser: AnalyserNode | null = null
  private masterGain: GainNode | null = null
  private synthGain: GainNode | null = null
  private activeNodes: Array<AudioScheduledSourceNode> = []
  private htmlAudio: HTMLAudioElement | null = null
  private loopTimer: number | null = null
  private isSynthesizing = false
  private isPlaying = false
  private isLooping = false
  private currentBeatId: string | null = null
  private startTime = 0
  private onEndedCallback: (() => void) | null = null
  private onDurationCallback: ((duration: number) => void) | null = null
  private trackDuration = 0
  private tagAudio: HTMLAudioElement | null = null
  private tagTimer: number | null = null

  // Cached buffers for zero latency and precise envelope control
  private tagBuffer: AudioBuffer | null = null
  private glitchBuffer: AudioBuffer | null = null
  private tvShutdownBuffer: AudioBuffer | null = null

  // Web Audio beat playback state for sample-accurate gapless looping
  private beatSource: AudioBufferSourceNode | null = null
  private beatBuffer: AudioBuffer | null = null
  private beatBufferCache = new Map<string, AudioBuffer>()
  private beatLoadingPromises = new Map<string, Promise<AudioBuffer | null>>()
  private trackStartTime = 0
  private pauseOffset = 0
  private isBeatPlaying = false

  // Killer Features: Half-Time, Pitch Transpose, CRT Lo-Fi Speaker Filter
  private isHalfTime = false
  private pitchSemitones = 0 // -2 to +2 semitones (-200 to +200 cents)
  private isLofi = false
  private cleanGain: GainNode | null = null
  private lofiGain: GainNode | null = null
  private lofiHp: BiquadFilterNode | null = null
  private lofiLp: BiquadFilterNode | null = null
  private lofiMid: BiquadFilterNode | null = null

  private initContext() {
    if (!this.ctx) {
      const AudioCtx = window.AudioContext || (window as unknown as { webkitAudioContext: typeof AudioContext }).webkitAudioContext
      this.ctx = new AudioCtx()
      this.analyser = this.ctx.createAnalyser()
      this.analyser.fftSize = 512
      this.analyser.smoothingTimeConstant = 0.8

      this.masterGain = this.ctx.createGain()
      this.masterGain.gain.value = 0.85

      // Clean signal path
      this.cleanGain = this.ctx.createGain()
      this.cleanGain.gain.value = this.isLofi ? 0.0 : 1.0

      // Lo-Fi CRT TV speaker bandpass filter chain (cuts sub-bass <320Hz, highs >4.2kHz, boosts boxy mids at 1.4kHz)
      this.lofiGain = this.ctx.createGain()
      this.lofiGain.gain.value = this.isLofi ? 1.0 : 0.0

      this.lofiHp = this.ctx.createBiquadFilter()
      this.lofiHp.type = 'highpass'
      this.lofiHp.frequency.value = 320
      this.lofiHp.Q.value = 0.7

      this.lofiLp = this.ctx.createBiquadFilter()
      this.lofiLp.type = 'lowpass'
      this.lofiLp.frequency.value = 4200
      this.lofiLp.Q.value = 0.8

      this.lofiMid = this.ctx.createBiquadFilter()
      this.lofiMid.type = 'peaking'
      this.lofiMid.frequency.value = 1400
      this.lofiMid.gain.value = 3.5

      // Connect clean path: analyser -> cleanGain -> masterGain
      this.analyser.connect(this.cleanGain)
      this.cleanGain.connect(this.masterGain)

      // Connect Lo-Fi path: analyser -> HP -> LP -> Mid -> lofiGain -> masterGain
      this.analyser.connect(this.lofiHp)
      this.lofiHp.connect(this.lofiLp)
      this.lofiLp.connect(this.lofiMid)
      this.lofiMid.connect(this.lofiGain)
      this.lofiGain.connect(this.masterGain)

      this.masterGain.connect(this.ctx.destination)

      // Preload buffers
      this.preloadAudioBuffers()
    }

    if (this.ctx.state === 'suspended') {
      this.ctx.resume()
    }
  }

  private async preloadAudioBuffers() {
    if (!this.ctx) return
    try {
      fetch('/audio/glitch.mp3')
        .then((res) => res.arrayBuffer())
        .then((buf) => this.ctx!.decodeAudioData(buf))
        .then((decoded) => {
          this.glitchBuffer = decoded
        })
        .catch(() => {})

      fetch('/audio/tv_shutdown.mp3')
        .then((res) => res.arrayBuffer())
        .then((buf) => this.ctx!.decodeAudioData(buf))
        .then((decoded) => {
          this.tvShutdownBuffer = decoded
        })
        .catch(() => {})

      fetch('/audio/skilly-tag.wav')
        .then((res) => res.arrayBuffer())
        .then((buf) => this.ctx!.decodeAudioData(buf))
        .then((decoded) => {
          this.tagBuffer = decoded
        })
        .catch(() => {})
    } catch {}
  }

  public preloadBeats(urls: string[]) {
    this.initContext()
    for (const url of urls) {
      if (!this.beatBufferCache.has(url) && !this.beatLoadingPromises.has(url)) {
        this.loadBeatBuffer(url).catch(() => {})
      }
    }
  }

  public getAnalyser(): AnalyserNode | null {
    this.initContext()
    return this.analyser
  }

  public getIsPlaying(): boolean {
    return this.isPlaying
  }

  public getCurrentBeatId(): string | null {
    return this.currentBeatId
  }

  public getIsLooping(): boolean {
    return this.isLooping
  }

  public getCurrentTime(): number {
    const rate = this.isHalfTime ? 0.5 : 1.0
    if (this.isBeatPlaying && this.ctx && this.trackDuration > 0) {
      const elapsed = (this.ctx.currentTime - this.trackStartTime) * rate
      if (this.isLooping) {
        return ((elapsed % this.trackDuration) + this.trackDuration) % this.trackDuration
      }
      return Math.min(Math.max(0, elapsed), this.trackDuration)
    }
    if (this.htmlAudio && !isNaN(this.htmlAudio.currentTime)) {
      return this.htmlAudio.currentTime
    }
    if (this.isPlaying && this.ctx) {
      const elapsed = (this.ctx.currentTime - this.startTime) * rate
      if (this.trackDuration > 0) {
        return this.isLooping
          ? ((elapsed % this.trackDuration) + this.trackDuration) % this.trackDuration
          : Math.min(elapsed, this.trackDuration)
      }
      return elapsed
    }
    if (this.pauseOffset > 0) {
      return this.pauseOffset
    }
    return 0
  }

  public getDuration(): number {
    if (this.trackDuration > 0) {
      return this.trackDuration
    }
    if (this.htmlAudio && !isNaN(this.htmlAudio.duration) && this.htmlAudio.duration > 0) {
      return this.htmlAudio.duration
    }
    return 0
  }

  public setLoop(loop: boolean) {
    this.isLooping = loop
    if (this.beatSource) {
      this.beatSource.loop = loop
      if (loop && this.beatBuffer) {
        this.beatSource.loopStart = 0
        this.beatSource.loopEnd = this.beatBuffer.duration
      }
    }
    if (this.htmlAudio) {
      this.htmlAudio.loop = loop
    }
  }

  // --- FX Controls: Half-Time (0.5x), Pitch Transpose, Lo-Fi Speaker Filter ---

  public getIsHalfTime(): boolean {
    return this.isHalfTime
  }

  public setHalfTime(enable: boolean): boolean {
    this.initContext()
    if (this.isHalfTime === enable) return this.isHalfTime

    const prevVirtual = this.getCurrentTime()
    this.isHalfTime = enable
    const newRate = enable ? 0.5 : 1.0

    if (this.ctx && this.beatSource) {
      const now = this.ctx.currentTime
      this.beatSource.playbackRate.setValueAtTime(newRate, now)
      this.trackStartTime = now - (prevVirtual / newRate)
    }

    if (this.htmlAudio) {
      this.htmlAudio.playbackRate = newRate
    }

    return this.isHalfTime
  }

  public toggleHalfTime(): boolean {
    return this.setHalfTime(!this.isHalfTime)
  }

  public getPitchSemitones(): number {
    return this.pitchSemitones
  }

  public setPitchSemitones(semitones: number): number {
    this.initContext()
    const clamped = Math.max(-2, Math.min(2, Math.round(semitones)))
    this.pitchSemitones = clamped

    if (this.ctx && this.beatSource) {
      this.beatSource.detune.setValueAtTime(this.pitchSemitones * 100, this.ctx.currentTime)
    }
    return this.pitchSemitones
  }

  public stepPitch(delta: number): number {
    return this.setPitchSemitones(this.pitchSemitones + delta)
  }

  public getIsLofi(): boolean {
    return this.isLofi
  }

  public setLofi(enable: boolean): boolean {
    this.initContext()
    this.isLofi = enable

    if (this.ctx && this.cleanGain && this.lofiGain) {
      const now = this.ctx.currentTime
      this.cleanGain.gain.cancelScheduledValues(now)
      this.lofiGain.gain.cancelScheduledValues(now)
      if (enable) {
        this.cleanGain.gain.setValueAtTime(this.cleanGain.gain.value, now)
        this.cleanGain.gain.linearRampToValueAtTime(0, now + 0.04)
        this.lofiGain.gain.setValueAtTime(this.lofiGain.gain.value, now)
        this.lofiGain.gain.linearRampToValueAtTime(1.0, now + 0.04)
      } else {
        this.lofiGain.gain.setValueAtTime(this.lofiGain.gain.value, now)
        this.lofiGain.gain.linearRampToValueAtTime(0, now + 0.04)
        this.cleanGain.gain.setValueAtTime(this.cleanGain.gain.value, now)
        this.cleanGain.gain.linearRampToValueAtTime(1.0, now + 0.04)
      }
    }
    return this.isLofi
  }

  public toggleLofi(): boolean {
    return this.setLofi(!this.isLofi)
  }

  public resetFx() {
    this.setHalfTime(false)
    this.setPitchSemitones(0)
    this.setLofi(false)
  }

  // Play a beat: loads real audio file into Web Audio buffer for zero-latency sample-accurate looping
  public async playBeat(beat: Beat, onEnded?: () => void, onDuration?: (duration: number) => void) {
    this.initContext()
    if (this.ctx && this.ctx.state === 'suspended') {
      try {
        await this.ctx.resume()
      } catch {}
    }

    const isSameBeat = this.currentBeatId === beat.id
    const resumeOffset = isSameBeat && this.pauseOffset > 0 ? this.pauseOffset : 0

    // Stop active audio sources without blowing away resume offset if switching beats
    this.stopPlayback()

    this.currentBeatId = beat.id
    this.onEndedCallback = onEnded || null
    this.onDurationCallback = onDuration || null
    this.trackDuration = beat.duration || 0
    this.isPlaying = true
    this.isBeatPlaying = true
    this.startTime = this.ctx!.currentTime

    const audioUrl = beat.audioUrl || `/beats/${encodeURIComponent(beat.title)}.mp3`

    // Try sample-accurate Web Audio decoding first
    try {
      const buffer = await this.loadBeatBuffer(audioUrl)
      // Check if user changed track or stopped during asynchronous fetch/decode
      if (!this.isPlaying || this.currentBeatId !== beat.id) {
        return
      }

      if (buffer) {
        this.playBeatBuffer(buffer, resumeOffset)
        return
      }
    } catch (e) {
      console.warn('[AudioEngine] Web Audio buffer decode failed, falling back to HTMLAudio:', e)
    }

    // Fallback to HTMLAudio if Web Audio buffer decode fails
    if (this.isPlaying && this.currentBeatId === beat.id) {
      this.playHtmlAudio(audioUrl, beat)
    }
  }

  private async loadBeatBuffer(url: string): Promise<AudioBuffer | null> {
    if (this.beatBufferCache.has(url)) {
      return this.beatBufferCache.get(url)!
    }

    if (this.beatLoadingPromises.has(url)) {
      return this.beatLoadingPromises.get(url)!
    }

    const promise = (async () => {
      try {
        const res = await fetch(url)
        if (!res.ok) throw new Error(`HTTP ${res.status}`)
        const arrayBuffer = await res.arrayBuffer()
        const decoded = await this.ctx!.decodeAudioData(arrayBuffer)
        this.beatBufferCache.set(url, decoded)
        return decoded
      } catch (err) {
        console.warn(`[AudioEngine] Failed to load buffer from ${url}:`, err)
        return null
      } finally {
        this.beatLoadingPromises.delete(url)
      }
    })()

    this.beatLoadingPromises.set(url, promise)
    return promise
  }

  private playBeatBuffer(buffer: AudioBuffer, offset = 0) {
    if (!this.ctx || !this.analyser) return

    this.cleanupBeatSource()

    this.beatBuffer = buffer
    this.trackDuration = buffer.duration
    if (this.onDurationCallback) {
      this.onDurationCallback(buffer.duration)
    }

    const source = this.ctx.createBufferSource()
    source.buffer = buffer
    source.loop = this.isLooping
    // Explicit sample-accurate loop bounds: wraps instantaneously at end with 0ms gap
    source.loopStart = 0
    source.loopEnd = buffer.duration

    const now = this.ctx.currentTime
    const rate = this.isHalfTime ? 0.5 : 1.0
    source.playbackRate.setValueAtTime(rate, now)
    source.detune.setValueAtTime(this.pitchSemitones * 100, now)

    const safeOffset = Math.max(0, Math.min(offset, Math.max(0, buffer.duration - 0.05)))
    this.trackStartTime = now - (safeOffset / rate)

    source.connect(this.analyser)
    source.start(now, safeOffset)

    source.onended = () => {
      if (!this.isPlaying || source !== this.beatSource) return
      if (!this.isLooping) {
        this.cleanupBeatSource()
        this.isPlaying = false
        this.isBeatPlaying = false
        this.currentBeatId = null
        this.pauseOffset = 0
        if (this.onEndedCallback) {
          this.onEndedCallback()
        }
      }
    }

    this.beatSource = source
    this.isBeatPlaying = true
    this.isPlaying = true
  }

  private cleanupBeatSource() {
    if (this.beatSource) {
      try {
        this.beatSource.onended = null
        this.beatSource.stop()
        this.beatSource.disconnect()
      } catch {}
      this.beatSource = null
    }
  }

  private stopPlayback() {
    this.cleanupBeatSource()
    this.isBeatPlaying = false

    if (this.synthGain && this.ctx) {
      try {
        this.synthGain.gain.setValueAtTime(0, this.ctx.currentTime)
        this.synthGain.disconnect()
      } catch {}
      this.synthGain = null
    }

    if (this.htmlAudio) {
      try {
        this.htmlAudio.pause()
        this.htmlAudio.currentTime = 0
        this.htmlAudio.src = ''
      } catch {}
      this.htmlAudio = null
    }

    this.isSynthesizing = false
  }

  public pause() {
    if (this.isBeatPlaying && this.beatSource && this.ctx) {
      this.pauseOffset = this.getCurrentTime()
      this.cleanupBeatSource()
      this.isBeatPlaying = false
      this.isPlaying = false
    } else if (this.htmlAudio) {
      this.pauseOffset = this.htmlAudio.currentTime
      this.htmlAudio.pause()
      this.isPlaying = false
    } else {
      this.stop()
    }
  }

  private playHtmlAudio(url: string, beat: Beat) {
    this.htmlAudio = new Audio(url)
    this.htmlAudio.crossOrigin = 'anonymous'
    this.htmlAudio.loop = this.isLooping
    this.htmlAudio.playbackRate = this.isHalfTime ? 0.5 : 1.0

    const syncDuration = () => {
      if (this.htmlAudio && Number.isFinite(this.htmlAudio.duration) && this.htmlAudio.duration > 0) {
        this.trackDuration = this.htmlAudio.duration
        if (this.onDurationCallback) {
          this.onDurationCallback(this.htmlAudio.duration)
        }
      }
    }

    this.htmlAudio.onloadedmetadata = syncDuration
    this.htmlAudio.ondurationchange = syncDuration

    if (this.ctx && this.analyser) {
      try {
        const source = this.ctx.createMediaElementSource(this.htmlAudio)
        source.connect(this.analyser)
      } catch {
        // Fallback if already connected
      }
    }

    this.htmlAudio.play().catch(() => {
      // If blocked or missing, fallback to synth
      this.playProceduralDarkTrap(beat)
    })

    this.htmlAudio.onended = () => {
      if (!this.isLooping) {
        this.stop()
        if (this.onEndedCallback) this.onEndedCallback()
      }
    }
  }

  // Procedural Dark Trap / Drill Audio Generator
  private playProceduralDarkTrap(beat: Beat) {
    if (!this.ctx || !this.analyser) return
    this.isSynthesizing = true

    // Create a dedicated synth gain node connected to analyser
    this.synthGain = this.ctx.createGain()
    this.synthGain.gain.setValueAtTime(1, this.ctx.currentTime)
    this.synthGain.connect(this.analyser)

    const bpm = beat.bpm || 140
    const beatDuration = 60 / bpm
    const stepDuration = beatDuration / 4 // 16th notes
    const totalBars = 4
    const totalSteps = totalBars * 16
    const totalLoopDuration = totalSteps * stepDuration

    // Root notes frequencies for keys
    const noteFrequencies: Record<string, number> = {
      'D#m': 77.78,
      'Fm': 87.31,
      'Em': 82.41,
      'G#m': 103.83,
      'Cm': 65.41,
      'Am': 110.0,
    }
    const rootFreq = noteFrequencies[beat.key] || 73.42 // D2 default
    const scheduledTime = this.ctx.currentTime

    const schedulePattern = (startTime: number) => {
      if (!this.isPlaying || !this.isSynthesizing || !this.ctx || !this.synthGain) return

      for (let step = 0; step < totalSteps; step++) {
        const time = startTime + step * stepDuration

        // 1. Kick & Heavy 808
        const is808Step = step === 0 || step === 10 || step === 16 || step === 22 || step === 26 || step === 36 || step === 48
        if (is808Step) {
          this.trigger808(time, rootFreq, stepDuration * 3)
          this.triggerKick(time)
        }

        // 2. Snare (on 3rd beat of each bar: step 8, 24, 40, 56)
        if (step % 16 === 8) {
          this.triggerSnare(time)
        }

        // 3. Drill / Trap Hi-Hats (with rolls)
        if (step % 2 === 0 || (step >= 28 && step <= 31) || (step >= 60 && step <= 63)) {
          this.triggerHiHat(time, step % 4 === 0)
        }

        // 4. Dark Minor Melodic Bells / Synth
        if (step % 8 === 0 || step === 14 || step === 30 || step === 46) {
          const pitchMultiplier = step % 16 === 0 ? 1 : step % 16 === 14 ? 1.189 : 1.334
          this.triggerDarkPluck(time, rootFreq * 4 * pitchMultiplier)
        }
      }

      // Schedule next loop or end after track duration (unless loop is active)
      const targetDuration = beat.duration > 0 ? beat.duration : 15
      const elapsed = this.ctx.currentTime - this.startTime
      if (this.isLooping || elapsed < targetDuration - 0.5) {
        this.loopTimer = window.setTimeout(() => {
          if (this.isPlaying && this.isSynthesizing) {
            schedulePattern(this.ctx!.currentTime + 0.05)
          }
        }, (totalLoopDuration - 0.2) * 1000)
      } else {
        this.stop()
        if (this.onEndedCallback) this.onEndedCallback()
      }
    }

    schedulePattern(scheduledTime + 0.05)
  }

  // 808 Sub Bass
  private trigger808(time: number, freq: number, duration: number) {
    if (!this.ctx || !this.synthGain) return
    const osc = this.ctx.createOscillator()
    const gain = this.ctx.createGain()

    osc.type = 'sine'
    osc.frequency.setValueAtTime(freq * 1.5, time)
    osc.frequency.exponentialRampToValueAtTime(freq, time + 0.08)

    gain.gain.setValueAtTime(0.7, time)
    gain.gain.exponentialRampToValueAtTime(0.001, time + duration)

    osc.connect(gain)
    gain.connect(this.synthGain)

    this.activeNodes.push(osc)
    osc.start(time)
    osc.stop(time + duration)
  }

  // Punchy Kick
  private triggerKick(time: number) {
    if (!this.ctx || !this.synthGain) return
    const osc = this.ctx.createOscillator()
    const gain = this.ctx.createGain()

    osc.frequency.setValueAtTime(140, time)
    osc.frequency.exponentialRampToValueAtTime(45, time + 0.07)

    gain.gain.setValueAtTime(0.8, time)
    gain.gain.exponentialRampToValueAtTime(0.001, time + 0.12)

    osc.connect(gain)
    gain.connect(this.synthGain)

    this.activeNodes.push(osc)
    osc.start(time)
    osc.stop(time + 0.12)
  }

  // Snappy Trap Snare
  private triggerSnare(time: number) {
    if (!this.ctx || !this.synthGain) return
    const bufferSize = Math.floor(this.ctx.sampleRate * 0.15)
    const buffer = this.ctx.createBuffer(1, bufferSize, this.ctx.sampleRate)
    const data = buffer.getChannelData(0)
    for (let i = 0; i < bufferSize; i++) {
      data[i] = (Math.random() * 2 - 1) * 0.5
    }

    const noise = this.ctx.createBufferSource()
    noise.buffer = buffer

    const filter = this.ctx.createBiquadFilter()
    filter.type = 'highpass'
    filter.frequency.setValueAtTime(1200, time)

    const gain = this.ctx.createGain()
    gain.gain.setValueAtTime(0.5, time)
    gain.gain.exponentialRampToValueAtTime(0.01, time + 0.15)

    noise.connect(filter)
    filter.connect(gain)
    gain.connect(this.synthGain)

    this.activeNodes.push(noise)
    noise.start(time)
  }

  // Drill Hi-Hat
  private triggerHiHat(time: number, accent: boolean) {
    if (!this.ctx || !this.synthGain) return
    const bufferSize = Math.floor(this.ctx.sampleRate * 0.04)
    const buffer = this.ctx.createBuffer(1, bufferSize, this.ctx.sampleRate)
    const data = buffer.getChannelData(0)
    for (let i = 0; i < bufferSize; i++) {
      data[i] = (Math.random() * 2 - 1) * 0.3
    }

    const noise = this.ctx.createBufferSource()
    noise.buffer = buffer

    const filter = this.ctx.createBiquadFilter()
    filter.type = 'bandpass'
    filter.frequency.setValueAtTime(9500, time)

    const gain = this.ctx.createGain()
    gain.gain.setValueAtTime(accent ? 0.35 : 0.18, time)
    gain.gain.exponentialRampToValueAtTime(0.005, time + 0.04)

    noise.connect(filter)
    filter.connect(gain)
    gain.connect(this.synthGain)

    this.activeNodes.push(noise)
    noise.start(time)
  }

  // Dark Bell / Pluck
  private triggerDarkPluck(time: number, freq: number) {
    if (!this.ctx || !this.synthGain) return
    const osc = this.ctx.createOscillator()
    const gain = this.ctx.createGain()

    osc.type = 'triangle'
    osc.frequency.setValueAtTime(freq, time)

    gain.gain.setValueAtTime(0.2, time)
    gain.gain.exponentialRampToValueAtTime(0.001, time + 0.45)

    osc.connect(gain)
    gain.connect(this.synthGain)

    this.activeNodes.push(osc)
    osc.start(time)
    osc.stop(time + 0.45)
  }

  // Soft analogue TV channel switch click (quiet, tactile)
  public playSwitchClick() {
    this.initContext()
    if (!this.ctx || !this.masterGain) return
    const now = this.ctx.currentTime
    const osc = this.ctx.createOscillator()
    const gain = this.ctx.createGain()
    const filter = this.ctx.createBiquadFilter()

    osc.type = 'triangle'
    osc.frequency.setValueAtTime(260, now)
    osc.frequency.exponentialRampToValueAtTime(50, now + 0.02)

    filter.type = 'lowpass'
    filter.frequency.setValueAtTime(900, now)

    gain.gain.setValueAtTime(0.07, now)
    gain.gain.exponentialRampToValueAtTime(0.001, now + 0.025)

    osc.connect(filter)
    filter.connect(gain)
    gain.connect(this.masterGain)

    osc.start(now)
    osc.stop(now + 0.03)
  }

  // Cinematic TV Turn-On: Glitch sound (50% vol) + Voice Tag (50% max, fade-in/out) played strictly after glitch
  public playTurnOnSequence() {
    this.initContext()
    if (!this.ctx || !this.analyser) return
    const now = this.ctx.currentTime

    // Exact glitch duration is 1.44s
    const glitchDuration = this.glitchBuffer ? this.glitchBuffer.duration : 1.44

    // 1. Play Glitch from public/audio/glitch.mp3 at exactly 50% volume
    if (this.glitchBuffer) {
      const glitchSource = this.ctx.createBufferSource()
      glitchSource.buffer = this.glitchBuffer
      const glitchGain = this.ctx.createGain()
      glitchGain.gain.setValueAtTime(0.50, now)
      glitchSource.connect(glitchGain)
      glitchGain.connect(this.analyser)
      glitchSource.start(now)
      this.activeNodes.push(glitchSource)
    } else {
      const audio = new Audio('/audio/glitch.mp3')
      audio.volume = 0.50
      audio.play().catch(() => {})
    }

    // 2. Play Voice Tag strictly AFTER glitch finishes (starts at now + glitchDuration)
    const tagStartTime = now + glitchDuration

    if (this.tagBuffer) {
      const tagSource = this.ctx.createBufferSource()
      tagSource.buffer = this.tagBuffer
      const duration = this.tagBuffer.duration

      const tagGain = this.ctx.createGain()
      // Fade in from 0 to 0.5 over 0.35s
      tagGain.gain.setValueAtTime(0, tagStartTime)
      tagGain.gain.linearRampToValueAtTime(0.5, tagStartTime + 0.35)
      // Sustain at 50%
      const fadeOutStart = Math.max(tagStartTime + 0.4, tagStartTime + duration - 0.45)
      tagGain.gain.setValueAtTime(0.5, fadeOutStart)
      // Fade out from 0.5 to 0 over 0.45s
      tagGain.gain.linearRampToValueAtTime(0, tagStartTime + duration)

      tagSource.connect(tagGain)
      tagGain.connect(this.analyser)
      tagSource.start(tagStartTime)
      this.activeNodes.push(tagSource)
    } else {
      if (this.tagTimer) {
        clearTimeout(this.tagTimer)
      }
      this.tagTimer = window.setTimeout(() => {
        const audio = new Audio('/audio/skilly-tag.wav')
        audio.volume = 0.5
        audio.play().catch(() => {})
      }, Math.round(glitchDuration * 1000))
    }
  }

  // Cinematic TV Turn-Off: Authentic tv_shutdown sound (50% vol) + cutoff
  public playTurnOffSequence() {
    this.initContext()
    this.stop()
    if (!this.ctx || !this.analyser) return
    const now = this.ctx.currentTime

    if (this.tvShutdownBuffer) {
      const shutdownSource = this.ctx.createBufferSource()
      shutdownSource.buffer = this.tvShutdownBuffer
      const shutdownGain = this.ctx.createGain()
      shutdownGain.gain.setValueAtTime(0.50, now)
      shutdownSource.connect(shutdownGain)
      shutdownGain.connect(this.analyser)
      shutdownSource.start(now)
      this.activeNodes.push(shutdownSource)
    } else {
      const audio = new Audio('/audio/tv_shutdown.mp3')
      audio.volume = 0.50
      audio.play().catch(() => {})
    }
  }

  // Authentic User Voice Tag ("skilly tag.wav") with 50% volume + smooth fade
  public playVoiceTag() {
    this.initContext()
    if (!this.ctx || !this.analyser) return
    const now = this.ctx.currentTime

    if (this.tagBuffer) {
      const tagSource = this.ctx.createBufferSource()
      tagSource.buffer = this.tagBuffer
      const duration = this.tagBuffer.duration

      const tagGain = this.ctx.createGain()
      // Fade in to 50%
      tagGain.gain.setValueAtTime(0, now)
      tagGain.gain.linearRampToValueAtTime(0.5, now + 0.3)
      const fadeOutStart = Math.max(now + 0.35, now + duration - 0.4)
      tagGain.gain.setValueAtTime(0.5, fadeOutStart)
      // Fade out to 0
      tagGain.gain.linearRampToValueAtTime(0, now + duration)

      tagSource.connect(tagGain)
      tagGain.connect(this.analyser)
      tagSource.start(now)
    } else {
      if (this.tagAudio) {
        this.tagAudio.pause()
        this.tagAudio = null
      }
      this.tagAudio = new Audio('/audio/skilly-tag.wav')
      this.tagAudio.volume = 0.5
      this.tagAudio.play().catch(() => {})
    }
  }

  // Instant full stop of ALL audio sources
  public stop() {
    // 1. Clear loop & tag timeouts
    if (this.loopTimer) {
      clearTimeout(this.loopTimer)
      this.loopTimer = null
    }
    if (this.tagTimer) {
      clearTimeout(this.tagTimer)
      this.tagTimer = null
    }

    // 2. Stop Web Audio beat playback
    this.cleanupBeatSource()
    this.isBeatPlaying = false
    this.pauseOffset = 0

    // 3. Disconnect and silence synthGain immediately
    if (this.synthGain && this.ctx) {
      try {
        this.synthGain.gain.setValueAtTime(0, this.ctx.currentTime)
        this.synthGain.disconnect()
      } catch {}
      this.synthGain = null
    }

    // 4. Stop and disconnect all queued scheduled nodes
    for (const node of this.activeNodes) {
      try {
        node.stop()
        node.disconnect()
      } catch {}
    }
    this.activeNodes = []

    // 5. Stop HTML audio
    if (this.htmlAudio) {
      try {
        this.htmlAudio.pause()
        this.htmlAudio.currentTime = 0
        this.htmlAudio.src = ''
      } catch {}
      this.htmlAudio = null
    }

    this.isSynthesizing = false
    this.isPlaying = false
    this.currentBeatId = null
  }

  public setVolume(volume: number) {
    if (this.masterGain && this.ctx) {
      this.masterGain.gain.setValueAtTime(Math.max(0, Math.min(1, volume)), this.ctx.currentTime)
    }
  }
}

export const audioEngine = new AudioEngine()
