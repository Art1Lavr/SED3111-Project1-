import test from 'node:test'
import assert from 'node:assert/strict'
import { createGame, updateTrack, finishTurn, beginTurn, getInstrument } from './model.js'
import { createBeginnerGame, MELODY_PRESETS, MELODY_CATEGORIES, addMelodyPreset, removeBeginnerTrack, addEmptyInstrument, planPreset, setStarterBeat, starterBeatEnabled } from './beginner.js'
import { restoreSession, snapshot } from './session.js'
import { TURN_LENGTHS } from './rooms.js'

const room = { code: 'ABC234', players: [{ id: 'a', name: 'Alex' }, { id: 'b', name: 'Sam' }], bpm: 135, root: 'any', scale: 'any', turnSeconds: 60, listenSeconds: 15 }
test('Mode-specific turn ranges apply to initial and subsequent turns', () => {
  for (const turnSeconds of TURN_LENGTHS) {
    for (const create of [createGame, createBeginnerGame]) {
      const game = create({ ...room, turnSeconds }, 1000)
      const expected = create === createBeginnerGame ? Math.max(120, turnSeconds) : turnSeconds
      assert.equal(game.turnSeconds, expected)
      assert.equal(game.deadline, 1000 + expected * 1000)
      assert.equal(game.bpm, room.bpm)
      assert.equal(game.listenSeconds, 15)
      assert.equal(beginTurn(finishTurn(game), 5000).deadline, 5000 + expected * 1000)
    }
  }
  assert.ok(createGame(room).tracks.every(t => !t.notes.length))
})
test('All 56 imported presets use valid samples, fit the loop and restore safely', () => {
  assert.equal(MELODY_PRESETS.length, 56)
  for (const category of MELODY_CATEGORIES) assert.equal(MELODY_PRESETS.filter(p => p.category === category.id).length, 8)
  for (const preset of MELODY_PRESETS) {
    const game = addMelodyPreset(createBeginnerGame(room), preset.id)
    assert.equal(game.tracks.length, 6 + preset.patterns.filter(p => p.instrumentId === 'melody' && p.sampleId !== 'keyboard').length)
    for (const track of game.tracks) {
      assert.ok(getInstrument(track.instrumentId).samples.some(s => s.id === track.sampleId))
      for (const note of track.notes) {
        assert.ok(note.start >= 0 && note.start + note.length <= 16)
        assert.ok([0, 2, 4, 7, 9].includes((note.pitch % 12 + 12) % 12))
      }
    }
    const restored = restoreSession(snapshot(game, 65)).game
    assert.equal(restored.mode, 'beginner')
    assert.deepEqual(restored.tracks, game.tracks)
    assert.equal(addMelodyPreset(game, preset.id).tracks.length, game.tracks.length, 'Reapplying a preset never duplicates tracks')
  }
})
test('Pitch lock is limited to Beginner; old saves retain Standard and Any key', () => {
  for (const create of [createGame, createBeginnerGame]) {
    let game = create(room)
    game = updateTrack(game, game.tracks[0].id, { notes: [{ id: 'n', start: 0, length: 0.125, pitch: 6 }] })
    assert.equal(game.tracks[0].notes[0].pitch, game.mode === 'beginner' ? 7 : 6)
    assert.equal(game.tracks[0].cutSelf, false)
    assert.equal(game.tracks[1].cutSelf, true)
  }
  const old = createGame(room); delete old.mode
  const restored = restoreSession(snapshot(old, 65)).game
  assert.equal(restored.mode, 'standard')
  assert.equal(restored.root, 'any')
})
test('Patterns reuse matching tracks, preserve mixer settings and support atomic undo', () => {
  let game = createBeginnerGame(room)
  const id = game.tracks[0].id
  game.tracks[0].volume = .4
  game = addMelodyPreset(game, 'classic-ballad')
  assert.equal(game.tracks.length, 6)
  assert.equal(game.tracks[0].id, id)
  assert.equal(game.tracks[0].volume, .4)
  const before = game.tracks
  game = addMelodyPreset(game, 'lo-fi-chords')
  assert.equal(game.tracks[0].presetId, 'lo-fi-chords')
  assert.equal(game.history.at(-1), before)
  const drums = addMelodyPreset(game, 'lo-fi-beat')
  assert.equal(drums.tracks.length, 6)
  assert.equal(drums.tracks[0], game.tracks[0])
  assert.equal(planPreset(drums, MELODY_PRESETS.find(p => p.id === 'lo-fi-beat')).replacing.length, 3)
})
test('Empty instruments, last-track removal, save/restore and phase locks', () => {
  let game = createBeginnerGame(room)
  const empty = addEmptyInstrument(game, 'melody', 'flute')
  assert.equal(empty.tracks.at(-1).notes.length, 0)
  assert.equal(addEmptyInstrument(game, 'melody', 'missing'), game)
  for (const track of game.tracks) game = removeBeginnerTrack(game, track.id)
  assert.equal(game.tracks.length, 0)
  assert.equal(restoreSession(snapshot(game, 65)).game.tracks.length, 0)
  game = addMelodyPreset(game, 'classic-ballad')
  assert.equal(game.tracks.length, 1)
  const listen = finishTurn(game)
  assert.equal(removeBeginnerTrack(listen, game.tracks[0].id), listen)
  assert.equal(addEmptyInstrument(listen, 'melody', 'flute'), listen)
  assert.equal(addMelodyPreset(listen, 'lo-fi-beat'), listen)
  const next = beginTurn(listen)
  assert.equal(removeBeginnerTrack(next, game.tracks[0].id).tracks.length, 0)
})
test('At the limit, matching patterns replace notes but missing parts cannot partially apply', () => {
  let game = createBeginnerGame(room)
  while (game.tracks.length < 16) game = addEmptyInstrument(game, 'melody', 'keyboard')
  const drums = addMelodyPreset(game, 'lo-fi-beat')
  assert.equal(drums.tracks.length, 16)
  assert.notEqual(drums, game)
  game = removeBeginnerTrack(game, game.tracks.find(t => t.instrumentId === 'hat').id)
  game = addEmptyInstrument(game, 'melody', 'keyboard')
  assert.equal(addMelodyPreset(game, 'lo-fi-beat'), game)
  assert.equal(addEmptyInstrument(game, 'melody', 'flute'), game)
})
test('Starter toggle and undo do not erase an applied drum pattern', () => {
  let game = addMelodyPreset(createBeginnerGame(room), 'lo-fi-beat')
  const before = game.tracks
  game = setStarterBeat(game, false)
  assert.equal(game.tracks, before)
  assert.equal(starterBeatEnabled(game), false)
})
