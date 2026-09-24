import test from 'node:test'
import assert from 'node:assert/strict'
import { beginTurn, constrainNote, createGame, finishTurn, loopSeconds, toggleStep, updateTrack } from './model.js'

const room = { players: [{ id: 'a', name: 'Alex' }, { id: 'b', name: 'Sam' }, { id: 'c', name: 'Max' }], bpm: 120, turnSeconds: 30 }

test('Full game shares contributions across players, listens before starting the next timer, and reveals', () => {
  let game = createGame(room, 1000)
  assert.equal(game.deadline, 31000)
  const firstTrack = game.tracks[0]
  game = updateTrack(game, firstTrack.id, { notes: [{ id: 'n1', start: 0, length: 2, pitch: 4 }] })
  game = finishTurn(game)
  assert.equal(game.phase, 'listen')
  assert.equal(game.current, 1)
  assert.equal(game.deadline, null)
  assert.equal(updateTrack(game, firstTrack.id, { notes: [] }), game)
  assert.equal(finishTurn(game), game, 'Duplicate timer/button finish must not skip a player')
  game = beginTurn(game, 50000)
  assert.equal(game.deadline, 80000)
  assert.notEqual(updateTrack(game, firstTrack.id, { notes: [] }), game, 'Next player can edit previous work')
  const secondTrack = game.tracks[1]
  game = updateTrack(game, secondTrack.id, { notes: [{ id: 'n2', start: 4, length: 1, pitch: 0 }] })
  game = beginTurn(finishTurn(game), 90000)
  assert.equal(game.current, 2)
  game = finishTurn(game)
  assert.equal(game.phase, 'reveal')
  assert.equal(game.tracks.find((track) => track.id === firstTrack.id).notes[0].id, 'n1')
  assert.equal(game.tracks.find((track) => track.id === secondTrack.id).notes[0].id, 'n2')
})

test('Turn changes preserve the same shared tracks even when all are used', () => {
  let game = createGame(room)
  game = { ...game, tracks: game.tracks.map((track) => ({ ...track, notes: [{ id: track.id, start: 0, length: 1, pitch: 0 }] })) }
  const next = finishTurn(game)
  assert.equal(next.tracks.length, 6)
  assert.equal(next.tracks, game.tracks)
})

test('Notes stay on the two-bar grid and step toggling preserves other notes', () => {
  assert.deepEqual(constrainNote({ id: 'a', start: 20, length: 9, pitch: 30 }), { id: 'a', start: 15.875, length: 0.125, pitch: 12 })
  let notes = toggleStep([], 3)
  notes = toggleStep(notes, 6)
  assert.equal(notes.length, 2)
  notes = toggleStep(notes, 3)
  assert.equal(notes.length, 1)
  assert.equal(notes[0].start, 6)
  assert.equal(loopSeconds(120), 4)
  assert.equal(loopSeconds(60), 8)
})

test('Notes can be moved and shortened to a sixty-fourth without rounding to eighths', () => {
  const note = constrainNote({ id: 'short', start: 7.375, length: 0.125, pitch: -4 })
  assert.equal(note.start, 7.375)
  assert.equal(note.length, 0.125)
  assert.equal(constrainNote({ ...note, length: -1 }).length, 0.125)
  assert.equal(constrainNote({ ...note, start: -1 }).start, 0)
})
