import test from 'node:test'
import assert from 'node:assert/strict'
import { createGame, audibleTracks } from './model.js'
import { snapshot, restoreSession } from './session.js'
const room = { code: 'ABC234', players: [{ id: 'a', name: 'Alex' }, { id: 'b', name: 'Sam' }], bpm: 120, root: 'any', scale: 'any', turnSeconds: 60, listenSeconds: 8 }

test('Autosave restores notes, sounds, mixer and remaining time without running a timer', () => {
  const game = createGame(room, 1000)
  Object.assign(game.tracks[0], { volume: .42, solo: true, notes: [{ id: 'n', start: 2, length: 1.5, pitch: 7 }] })
  game.metronome = true
  const result = restoreSession(JSON.parse(JSON.stringify(snapshot(game, 78, 12000))))
  assert.equal(result.game.deadline, null)
  assert.equal(result.game.pausedSeconds, 49)
  assert.equal(result.game.root, 'any')
  assert.equal(result.game.metronome, true)
  assert.equal(result.masterVolume, 78)
  assert.deepEqual(result.game.tracks, game.tracks)
  assert.deepEqual(result.game.history, [])
})
test('Saved listen and result phases survive; corrupt sound references are rejected', () => {
  for (const phase of ['listen', 'reveal']) {
    const game = { ...createGame(room), phase, current: 1, deadline: null }
    assert.equal(restoreSession(snapshot(game, 65)).game.phase, phase)
    game.tracks[0].sampleId = 'missing'
    assert.equal(restoreSession(snapshot(game, 65)), null)
  }
  assert.equal(restoreSession({}), null)
})
test('Solo supports multiple tracks, respects mute, and can be ignored for shared listening', () => {
  const tracks = [{ id: 'a', solo: true }, { id: 'b', solo: true, muted: true }, { id: 'c' }]
  assert.deepEqual(audibleTracks(tracks).map(t => t.id), ['a'])
  assert.deepEqual(audibleTracks(tracks, false).map(t => t.id), ['a', 'c'])
  tracks[0].solo = false; tracks[1].solo = false
  assert.deepEqual(audibleTracks(tracks).map(t => t.id), ['a', 'c'])
})
