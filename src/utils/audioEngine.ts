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
  private tagAudio: HTMLAudioElement | null = null
  private tagTimer: number | null = null

  // Cached buffers for zero latency and precise envelope control
  private tagBuffer: AudioBuffer | null = null
  private glitchBuffer: AudioBuffer | null = null

  private initContext() {
    if (!this.ctx) {
      const AudioCtx = window.AudioContext || (window as unknown as { webkitAudioContext: typeof AudioContext }).webkitAudioContext
      this.ctx = new AudioCtx()
      this.analyser = this.ctx.createAnalyser()
      this.analyser.fftSize = 512
      this.analyser.smoothingTimeConstant = 0.8

      this.masterGain = this.ctx.createGain()
      this.masterGain.gain.value = 0.85

      this.analyser.connect(this.masterGain)
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

      fetch('/audio/skilly-tag.wav')
        .then((res) => res.arrayBuffer())
        .then((buf) => this.ctx!.decodeAudioData(buf))
        .then((decoded) => {
          this.tagBuffer = decoded
        })
        .catch(() => {})
    } catch {}
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

  public setLoop(loop: boolean) {
    this.isLooping = loop
    if (this.htmlAudio) {
      this.htmlAudio.loop = loop
    }
  }

  // Play a beat: if audioUrl exists, loads it. Otherwise generates procedural trap loop!
  public async playBeat(beat: Beat, onEnded?: () => void) {
    this.initContext()
    // 1. Fully stop any current sound
    this.stop()

    this.currentBeatId = beat.id
    this.onEndedCallback = onEnded || null
    this.isPlaying = true
    this.startTime = this.ctx!.currentTime

    // Check if an external audio file exists
    const audioUrl = beat.audioUrl || `/audio/${beat.id}.mp3`
    const audioAvailable = await this.checkAudioExists(audioUrl)

    if (audioAvailable) {
      this.playHtmlAudio(audioUrl)
    } else {
      this.playProceduralDarkTrap(beat)
    }
  }

  private async checkAudioExists(url: string): Promise<boolean> {
    try {
      const res = await fetch(url, { method: 'HEAD' })
      return res.ok
    } catch {
      return false
    }
  }

  private playHtmlAudio(url: string) {
    this.htmlAudio = new Audio(url)
    this.htmlAudio.crossOrigin = 'anonymous'
    this.htmlAudio.loop = this.isLooping

    if (this.ctx && this.analyser) {
      try {
        const source = this.ctx.createMediaElementSource(this.htmlAudio)
        source.connect(this.analyser)
      } catch {
        // Fallback if already connected
      }
    }

    this.htmlAudio.play().catch(() => {
      // If blocked, fallback to synth
      this.playProceduralDarkTrap({ bpm: 140, key: 'Fm' } as Beat)
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

      // Schedule next loop or end after 15s preview (unless loop is active)
      const elapsed = this.ctx.currentTime - this.startTime
      if (this.isLooping || elapsed < 14.5) {
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

  // Cinematic TV Turn-On: Glitch sound (60% vol) + Voice Tag (50% max, fade-in/out) played strictly after glitch
  public playTurnOnSequence() {
    this.initContext()
    if (!this.ctx || !this.analyser) return
    const now = this.ctx.currentTime

    // Exact glitch duration is 1.44s
    const glitchDuration = this.glitchBuffer ? this.glitchBuffer.duration : 1.44

    // 1. Play Glitch from public/audio/glitch.mp3 at exactly 60% volume
    if (this.glitchBuffer) {
      const glitchSource = this.ctx.createBufferSource()
      glitchSource.buffer = this.glitchBuffer
      const glitchGain = this.ctx.createGain()
      glitchGain.gain.setValueAtTime(0.60, now)
      glitchSource.connect(glitchGain)
      glitchGain.connect(this.analyser)
      glitchSource.start(now)
      this.activeNodes.push(glitchSource)
    } else {
      const audio = new Audio('/audio/glitch.mp3')
      audio.volume = 0.60
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

  // Cinematic TV Turn-Off: Turn-off glitch sound + cutoff
  public playTurnOffSequence() {
    this.initContext()
    this.stop()
    if (!this.ctx || !this.analyser) return
    const now = this.ctx.currentTime

    if (this.glitchBuffer) {
      const glitchSource = this.ctx.createBufferSource()
      glitchSource.buffer = this.glitchBuffer
      const glitchGain = this.ctx.createGain()
      glitchGain.gain.setValueAtTime(0.55, now)
      glitchGain.gain.exponentialRampToValueAtTime(0.001, now + 0.75)
      glitchSource.connect(glitchGain)
      glitchGain.connect(this.analyser)
      glitchSource.start(now)
      glitchSource.stop(now + 0.8)
    } else {
      const audio = new Audio('/audio/glitch.mp3')
      audio.volume = 0.5
      audio.play().catch(() => {})
      setTimeout(() => {
        try { audio.pause() } catch {}
      }, 750)
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

    // 2. Disconnect and silence synthGain immediately
    if (this.synthGain && this.ctx) {
      try {
        this.synthGain.gain.setValueAtTime(0, this.ctx.currentTime)
        this.synthGain.disconnect()
      } catch {}
      this.synthGain = null
    }

    // 3. Stop and disconnect all queued scheduled nodes
    for (const node of this.activeNodes) {
      try {
        node.stop()
        node.disconnect()
      } catch {}
    }
    this.activeNodes = []

    // 4. Stop HTML audio
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
