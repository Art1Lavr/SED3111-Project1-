import test from 'node:test'
import assert from 'node:assert/strict'
import { createAudioEngine } from './audioEngine.js'

function fixture() {
  const sources = []
  const buffers = []
  let resume = async () => {}
  let failNextLoad = false
  class Node {
    connect() { return this }
    toDestination() { return this }
    dispose() { this.disposed = true }
  }
  class Gain extends Node {
    gain = { rampTo() {} }
  }
  class Buffer extends Node {
    duration = 4
    constructor() { super(); buffers.push(this) }
    async load(url) {
      this.url = url
      if (failNextLoad) { failNextLoad = false; throw new Error('Missing sample') }
    }
  }
  class Source extends Node {
    constructor(options) { super(); Object.assign(this, options); sources.push(this); this.stops = [] }
    start(time, offset, duration, gain) { this.started = { time, offset, duration, gain } }
    stop(time) { this.stops.push(time) }
  }
  const audio = { Limiter: Node, Gain, ToneAudioBuffer: Buffer, ToneBufferSource: Source, now: () => 10, start: () => resume() }
  const engine = createAudioEngine({ audio, baseUrl: '/' })
  return { engine, sources, buffers, deferResume(fn) { resume = fn }, failLoad() { failNextLoad = true } }
}

test('Cut itself cuts older bass voices across sample changes, leaving drums playing', async () => {
  const { engine, sources } = fixture()
  await engine.start()
  await engine.play('kick', 'kick-learn')
  await engine.play('bass', 'bass-hiroshima')
  await engine.play('bass', 'bass-low')
  assert.deepEqual(sources[0].stops, [])
  assert.deepEqual(sources[1].stops, [10])
  assert.equal(sources[1].fadeOut, 0.005)
  assert.deepEqual(sources[2].stops, [])
  // Finishing an old note must not stop a newer note.
  sources[1].onended()
  assert.equal(sources[1].disposed, true)
  assert.deepEqual(sources[2].stops, [])
  engine.dispose()
})

test('Cut itself off permits overlap; Stop all still cuts every voice', async () => {
  const { engine, sources } = fixture()
  await engine.start()
  await engine.play('bass', 'bass-low', { cutItself: false })
  await engine.play('bass', 'bass-mira', { cutItself: false })
  assert.ok(sources.every((source) => source.stops.length === 0))
  engine.stop()
  assert.ok(sources.every((source) => source.stops.length === 1))
  engine.dispose()
})

test('Pitch changes playback rate; bass envelope obeys duration and source length', async () => {
  const { engine, sources } = fixture()
  await engine.start()
  await engine.play('bass', 'bass-low', { duration: 0.5, semitones: 12 })
  assert.equal(sources[0].playbackRate, 2)
  assert.equal(sources[0].started.duration + sources[0].fadeOut, 0.5)
  await engine.play('bass', 'bass-low', { duration: 8, semitones: 12 })
  assert.equal(sources[1].started.duration + sources[1].fadeOut, 2)
  await engine.play('melody', 'keyboard', { semitones: -12 })
  assert.equal(sources[2].playbackRate, 0.5)
  assert.equal(sources[2].started.duration + sources[2].fadeOut, 0.25)
  engine.dispose()
})

test('TIME none: root key keeps original speed for every bass and every note length', async () => {
  const { engine, sources } = fixture()
  await engine.start()
  for (const sound of ['bass-hiroshima', 'bass-low', 'bass-mira']) {
    for (const duration of [0.125, 0.5, 2, 8]) {
      await engine.play('bass', sound, { semitones: 0, duration })
      const voice = sources.at(-1)
      assert.equal(voice.playbackRate, 1, 'Note length must not stretch or retune the sample')
      assert.equal(voice.loop, false, 'Embedded sample loop points must not repeat the bass')
      assert.equal(voice.started.offset, 0)
      assert.equal(voice.started.duration + voice.fadeOut, Math.min(duration, 4))
    }
  }
  engine.dispose()
})

test('All four instruments use short notes regardless of file length, pitch or bass duration', async () => {
  const { engine, sources, buffers } = fixture()
  await engine.start()
  const melodicBuffers = buffers.filter((buffer) => buffer.url.includes('/instrument/'))
  melodicBuffers.forEach((buffer, index) => { buffer.duration = [0.8, 1.5, 6, 3][index] })
  for (const sound of ['keyboard', 'sax', 'flute', 'guitar']) {
    for (const semitones of [-12, 0, 12]) {
      await engine.play('melody', sound, { semitones, duration: 2, cutItself: false })
      const voice = sources.at(-1)
      assert.equal(voice.started.duration + voice.fadeOut, 0.25)
      assert.equal(voice.playbackRate, 2 ** (semitones / 12))
    }
  }
  // A very short source is allowed to end naturally; it is not stretched or looped.
  melodicBuffers[0].duration = 0.1
  await engine.play('melody', 'keyboard', { semitones: 12 })
  assert.equal(sources.at(-1).started.duration + sources.at(-1).fadeOut, 0.05)
  assert.equal(sources.at(-1).loop, false)
  engine.dispose()
})

test('A new instrument note cuts the previous note across pitches and samples, not bass or drums', async () => {
  const { engine, sources } = fixture()
  await engine.start()
  await engine.play('bass', 'bass-low')
  await engine.play('kick', 'kick-learn')
  await engine.play('melody', 'keyboard')
  await engine.play('melody', 'keyboard', { semitones: 7, cutItself: false })
  assert.deepEqual(sources[2].stops, [10])
  await engine.play('melody', 'flute')
  assert.deepEqual(sources[3].stops, [10])
  assert.deepEqual(sources[0].stops, [])
  assert.deepEqual(sources[1].stops, [])
  sources[2].onended()
  sources[3].onended()
  assert.deepEqual(sources[4].stops, [], 'An old note ending must not cut its replacement')
  engine.dispose()
})

test('Stop cancels playback still waiting for browser audio activation', async () => {
  const setup = fixture()
  await setup.engine.start()
  let resume
  setup.deferResume(() => new Promise((resolve) => { resume = resolve }))
  const pending = setup.engine.play('bass', 'bass-low')
  setup.engine.stop()
  resume()
  await pending
  assert.equal(setup.sources.length, 0)
  setup.engine.dispose()
})

test('Failed loading can retry; disposal releases all sample buffers and voices', async () => {
  const setup = fixture()
  setup.failLoad()
  await assert.rejects(setup.engine.start(), /Could not load/)
  assert.ok(setup.buffers.every((buffer) => buffer.disposed))
  await setup.engine.start()
  await setup.engine.play('melody', 'flute')
  setup.engine.dispose()
  assert.ok(setup.buffers.every((buffer) => buffer.disposed))
  assert.ok(setup.sources.every((source) => source.disposed))
  await assert.rejects(setup.engine.play('bass', 'bass-low'), /Enable audio/)
})

test('Sequencer honours drawn note lengths and Cut itself remains independent per track', async () => {
  const { engine, sources } = fixture()
  await engine.start()
  engine.schedule('melody', 'keyboard', { channelId: 'track-a', time: 11, noteDuration: 1 })
  assert.equal(sources[0].started.duration + sources[0].fadeOut, 1)
  engine.schedule('melody', 'flute', { channelId: 'track-b', time: 11, noteDuration: 0.5 })
  assert.deepEqual(sources[0].stops, [])
  engine.schedule('melody', 'keyboard', { channelId: 'track-a', time: 11.5, noteDuration: 0.25 })
  assert.deepEqual(sources[0].stops, [11.5])
  assert.deepEqual(sources[1].stops, [])
  engine.stop()
  assert.ok(sources.every((source) => source.disposed), 'Stop must cancel future scheduled audio too')
  engine.dispose()
})
