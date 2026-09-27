import { ToneAudioBuffer, ToneBufferSource, Limiter, Gain, now, start } from 'tone'
import { instruments } from './instruments.js'
import { applySampleGain, sustainChannels } from './sampleProcessing.js'

const browserAudio = { ToneAudioBuffer, ToneBufferSource, Limiter, Gain, now, start }

export function createAudioEngine({ audio = browserAudio, baseUrl = import.meta.env?.BASE_URL ?? '/' } = {}) {
  const buffers = new Map()
  const sustained = new Map()
  const voices = new Set()
  const channels = new Map()
  let gain, limiter
  let loading = null
  let ready = false
  let disposed = false
  let volume = 0.65
  let playbackVersion = 0

  function releaseNodes() {
    voices.forEach(({ source }) => source.dispose())
    voices.clear()
    buffers.forEach((buffer) => buffer.dispose())
    buffers.clear()
    sustained.forEach((buffer) => buffer.dispose()); sustained.clear()
    channels.forEach((channel) => channel.dispose())
    channels.clear()
    gain?.dispose()
    limiter?.dispose()
    gain = limiter = undefined
    ready = false
  }

  async function load() {
    limiter = new audio.Limiter(-1).toDestination()
    gain = new audio.Gain(volume).connect(limiter)
    const results = await Promise.allSettled(instruments.flatMap((instrument) => instrument.samples.map(async (sample) => {
      const buffer = new audio.ToneAudioBuffer()
      buffers.set(sample.id, buffer)
      try {
        await buffer.load(`${baseUrl}sounds/${sample.file.split('/').map(encodeURIComponent).join('/')}`)
        const decoded = buffer.get?.()
        if (decoded) {
          applySampleGain(decoded, sample.gain ?? 1)
          if (sample.sustain) sustained.set(sample.id, new audio.ToneAudioBuffer().fromArray(sustainChannels(decoded, sample.sustain)))
        }
      } catch {
        throw new Error(`Could not load ${sample.name}. Refresh and try again.`)
      }
    })))
    if (disposed) throw new Error('Audio engine closed.')
    const failure = results.find((result) => result.status === 'rejected')
    if (failure) throw failure.reason
    ready = true
  }

  function cutVoices(predicate, time, force = false) {
    voices.forEach((voice) => {
      if ((force || !voice.cutting) && predicate(voice)) {
        voice.cutting = true
        if (force && voice.time > time) {
          voice.source.dispose()
          voices.delete(voice)
        } else {
          voice.source.fadeOut = 0.005
          voice.source.stop(time)
        }
      }
    })
  }

  function scheduleVoice(instrumentId, sound, options = {}) {
    if (disposed || !ready) throw new Error('Enable audio before playing.')
    const { semitones = 0, duration = 0.5, cutItself = true, time = audio.now(), channelId = instrumentId,
      volume: channelVolume = 1, noteDuration: explicitDuration, monophonic, pitched = false, offsetSeconds = 0 } = options
    const instrument = instruments.find((item) => item.id === instrumentId)
    if (!instrument?.samples.some((sample) => sample.id === sound)) throw new Error('Unknown sound.')
    if (!Number.isFinite(semitones) || !Number.isFinite(duration) || duration <= 0 ||
      (explicitDuration !== undefined && (!Number.isFinite(explicitDuration) || explicitDuration <= 0))) {
      throw new Error('Invalid pitch or note length.')
    }
    const isBass = instrumentId === 'bass'
    const sample = instrument.samples.find((item) => item.id === sound)
    const shouldCut = monophonic ?? (isBass && cutItself)
    if (shouldCut) cutVoices((voice) => voice.channelId === channelId, time)
    const buffer = buffers.get(sound)
    // FL TIME = none: tempo never stretches samples. Pitch changes only playback rate.
    const rate = instrument.pitched || pitched ? 2 ** (Math.max(-24, Math.min(24, semitones)) / 12) : 1
    const naturalDuration = buffer.duration / rate
    const noteDuration = explicitDuration ?? (isBass ? duration : (instrument.noteDuration ?? naturalDuration))
    const sustain = !!sample.sustain && explicitDuration !== undefined && noteDuration + offsetSeconds > naturalDuration
    const playDuration = sustain ? noteDuration : Math.min(noteDuration, naturalDuration - offsetSeconds)
    if (playDuration <= 0) return
    let offset = offsetSeconds * rate
    if (sustain && offset >= sample.sustain.end) offset = sample.sustain.start + (offset - sample.sustain.start) % (sample.sustain.end - sample.sustain.start)
    const release = Math.min(isBass ? 0.005 : 0.01, playDuration)
    if (!channels.has(channelId)) channels.set(channelId, new audio.Gain(channelVolume).connect(gain))
    channels.get(channelId).gain.rampTo(channelVolume, 0.01)
    const source = new audio.ToneBufferSource({
      url: sustain ? (sustained.get(sound) ?? buffer) : buffer, playbackRate: rate,
      loop: sustain, loopStart: sustain ? sample.sustain.start : 0, loopEnd: sustain ? sample.sustain.end : 0,
      fadeIn: instrument.pitched ? Math.min(0.002, playDuration / 2) : 0,
      fadeOut: release, curve: 'linear',
    }).connect(channels.get(channelId))
    const voice = { source, instrumentId, channelId, time, cutting: false }
    source.onended = () => { voices.delete(voice); source.dispose() }
    voices.add(voice)
    try { source.start(time, offset, Math.max(0, playDuration - release), isBass ? 0.55 : 0.5) }
    catch (error) { voices.delete(voice); source.dispose(); throw error }
  }

  return {
    async start() {
      if (disposed) throw new Error('Audio engine closed.')
      await audio.start()
      if (disposed) throw new Error('Audio engine closed.')
      if (!loading) loading = load().catch((error) => { releaseNodes(); loading = null; throw error })
      await loading
    },
    async play(instrumentId, sound, options = {}) {
      if (disposed || !ready) throw new Error('Enable audio before playing.')
      const version = playbackVersion
      await audio.start()
      if (disposed || !ready || version !== playbackVersion) return
      scheduleVoice(instrumentId, sound, options)
    },
    schedule: scheduleVoice,
    click(time, accent = false) {
      if (disposed || !ready) return
      const id = accent ? 'metronome-high' : 'metronome-low'
      if (!buffers.has(id)) {
        const samples = new Float32Array(1544)
        const frequency = accent ? 1400 : 1000
        for (let i = 0; i < samples.length; i++) samples[i] = Math.sin(2 * Math.PI * frequency * i / 44100) * Math.exp(-i / 240) * Math.min(1, i / 30)
        buffers.set(id, new audio.ToneAudioBuffer().fromArray(samples))
      }
      const source = new audio.ToneBufferSource({ url: buffers.get(id), fadeIn: 0.001, fadeOut: 0.005 }).connect(gain)
      const voice = { source, channelId: 'metronome', time, cutting: false }
      source.onended = () => { voices.delete(voice); source.dispose() }
      voices.add(voice)
      source.start(time, 0, 0.03, accent ? 0.25 : 0.18)
    },
    clock: () => audio.now(),
    setVolume(value) {
      if (!Number.isFinite(value)) return
      volume = Math.max(0, Math.min(1, value))
      gain?.gain.rampTo(volume, 0.03)
    },
    setChannelVolume(id, value) { channels.get(id)?.gain.rampTo(Math.max(0, Math.min(1, value)), 0.03) },
    stopChannel(id) { if (ready && !disposed) cutVoices(voice => voice.channelId === id, audio.now(), true) },
    stop() {
      playbackVersion += 1
      if (!ready || disposed) return
      cutVoices(() => true, audio.now(), true)
    },
    dispose() { disposed = true; releaseNodes() },
  }
}
