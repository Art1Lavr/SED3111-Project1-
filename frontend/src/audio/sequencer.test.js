import test from 'node:test'
import assert from 'node:assert/strict'
import { startSequence } from './sequencer.js'

function fixture() {
  let now = 0, id = 0, stops = 0
  const intervals = new Map(), frames = new Map(), events = []
  const scheduler = {
    setInterval(fn) { intervals.set(++id, fn); return id }, clearInterval(key) { intervals.delete(key) },
    requestAnimationFrame(fn) { frames.set(++id, fn); return id }, cancelAnimationFrame(key) { frames.delete(key) },
  }
  const engine = { clock: () => now, schedule: (...args) => events.push(args), stop: () => { stops++ } }
  function advance(time) {
    now = time
    for (const fn of [...intervals.values()]) fn()
    const pending = [...frames.values()]; frames.clear()
    for (const fn of pending) fn()
  }
  return { scheduler, engine, events, advance, get stops() { return stops } }
}
const track = { id: 't', instrumentId: 'melody', sampleId: 'keyboard', muted: false, volume: 0.7, transpose: 0, cutSelf: true,
  notes: [{ start: 0, length: 2, pitch: 4 }, { start: 8, length: 1, pitch: 7 }] }

test('Resuming starts at the paused position instead of replaying the first note', () => {
  const setup = fixture()
  const stop = startSequence(setup.engine, () => [track], 120, { startPosition: 8, scheduler: setup.scheduler })
  assert.equal(setup.events.length, 1)
  assert.equal(setup.events[0][2].semitones, 7)
  assert.ok(Math.abs(setup.events[0][2].time - 0.08) < 0.000001)
  stop()
})

test('Listen pass schedules notes on the audio clock and finishes after one complete loop', () => {
  const setup = fixture()
  let ended = 0
  startSequence(setup.engine, () => [track], 120, { loop: false, scheduler: setup.scheduler, onEnd: () => ended++ })
  assert.equal(setup.events[0][2].time, 0.08)
  assert.equal(setup.events[0][2].noteDuration, 0.5)
  assert.equal(ended, 0)
  for (let i = 1; i <= 40; i++) setup.advance(i / 10)
  assert.equal(ended, 0, 'Next timer must not start before listening finishes')
  setup.advance(4.1)
  assert.equal(ended, 1)
  assert.equal(setup.events.length, 2)
  assert.equal(setup.events[1][2].time, 2.08)
  setup.advance(5)
  assert.equal(ended, 1)
})

test('Loop uses live edited patterns, skips muted tracks, and stops scheduling when stopped', () => {
  const setup = fixture()
  let tracks = [{ ...track, muted: true }]
  const stop = startSequence(setup.engine, () => tracks, 120, { scheduler: setup.scheduler })
  assert.equal(setup.events.length, 0)
  tracks = [track]
  for (let i = 1; i <= 45; i++) setup.advance(i / 10)
  assert.equal(setup.events.length, 2)
  assert.equal(setup.events[1][2].time, 4.08)
  stop()
  setup.advance(10)
  assert.equal(setup.events.length, 2)
})

test('A sixty-fourth note is scheduled at its exact fractional position and duration', () => {
  const setup = fixture()
  const short = { ...track, notes: [{ start: 0.125, length: 0.125, pitch: 2 }] }
  const stop = startSequence(setup.engine, () => [short], 120, { scheduler: setup.scheduler })
  assert.equal(setup.events.length, 1)
  assert.equal(setup.events[0][2].time, 0.11125)
  assert.equal(setup.events[0][2].noteDuration, 0.03125)
  stop()
})

test('Configured listening repeats across loops and ends at the same duration at different BPM', () => {
  for (const bpm of [60, 120, 180]) {
    const setup = fixture()
    let ended = 0, progress = 0
    startSequence(setup.engine, () => [track], bpm, { loop: false, durationSeconds: 15,
      onEnd: () => ended++, onProgress: (value) => { progress = value }, scheduler: setup.scheduler })
    for (let i = 1; i <= 1500; i++) setup.advance(i / 100)
    assert.equal(ended, 0)
    assert.ok(progress > 0.99 && progress < 1)
    assert.ok(setup.events.filter((event) => event[2].semitones === 4).length > 1)
    assert.ok(setup.events.every((event) => event[2].time < 15.08))
    setup.advance(15.09)
    assert.equal(ended, 1)
    assert.equal(progress, 1)
    setup.advance(20)
    assert.equal(ended, 1)
  }
})
