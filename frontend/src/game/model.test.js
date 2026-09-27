import test from 'node:test'
import assert from 'node:assert/strict'
import { addMelodyPreset, beginTurn, constrainNote, createGame, createMelodyNotes, finishTurn, getInstrument, loopSeconds, MELODY_CATEGORIES, MELODY_PRESETS, removeAddedMelodyPreset, setStarterBeat, toggleStep, updateTrack } from './model.js'

const room = { players: [{ id: 'a', name: 'Alex' }, { id: 'b', name: 'Sam' }, { id: 'c', name: 'Max' }], bpm: 120, turnSeconds: 30 }

test('Full game shares contributions across players, listens before starting the next timer, and reveals', () => {
  let game = createGame(room, {}, 1000)
  assert.equal(game.deadline, 31000)
  const firstTrack = game.tracks[0]
  game = updateTrack(game, firstTrack.id, { notes: [{ id: 'n1', start: 0, length: 2, pitch: 4 }] })
  game = finishTurn(game)
  assert.equal(game.phase, 'listen')
  assert.equal(game.current, 1)
  assert.equal(game.deadline, null)
  assert.equal(game.history.length, 0, 'The next player cannot undo the previous player turn')
  assert.equal(game.historyTurn, game.current)
  assert.equal(updateTrack(game, firstTrack.id, { notes: [] }), game)
  assert.equal(finishTurn(game), game, 'Duplicate timer/button finish must not skip a player')
  game = beginTurn(game, 50000)
  assert.equal(game.deadline, 80000)
  assert.equal(game.history.length, 0)
  assert.equal(game.historyTurn, game.current)
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
  assert.equal(constrainNote({ id: 'free', start: 0, length: 1, pitch: 6 }).pitch, 6)
  let notes = toggleStep([], 3)
  notes = toggleStep(notes, 6)
  assert.equal(notes.length, 2)
  notes = toggleStep(notes, 3)
  assert.equal(notes.length, 1)
  assert.equal(notes[0].start, 6)
  assert.equal(loopSeconds(120), 4)
  assert.equal(loopSeconds(60), 8)
})

test('Game difficulty defaults to beginner and constrains notes only in beginner mode', () => {
  const defaultBeginner = createGame(room)
  assert.equal(defaultBeginner.mode, 'beginner')
  assert.equal(createGame({ ...room, turnSeconds: 60 }).turnSeconds, 120)
  assert.equal(createGame({ ...room, turnSeconds: 60, turnSecondsCustom: true }).turnSeconds, 60)
  assert.deepEqual(defaultBeginner.tracks.find((track) => track.instrumentId === 'kick').notes.map((note) => note.start), [0, 2, 4, 6, 8, 10, 12, 14])
  assert.deepEqual(defaultBeginner.tracks.find((track) => track.instrumentId === 'snare').notes.map((note) => note.start), [1, 3, 5, 7, 9, 11, 13, 15])
  const beginner = createGame(room, { mode: 'beginner' })
  const beginnerTrack = beginner.tracks[0]
  const beginnerUpdate = updateTrack(beginner, beginnerTrack.id, { notes: [
    { id: 'near-e', start: 0, length: 1, pitch: 5 },
    { id: 'near-g', start: 2, length: 1, pitch: 6 },
    { id: 'a', start: 4, length: 1, pitch: 9 },
  ] })
  assert.equal(beginnerUpdate.mode, 'beginner')
  assert.deepEqual(beginnerUpdate.tracks[0].notes.map((note) => note.pitch), [4, 7, 9])

  const standard = createGame(room, { mode: 'standard' })
  assert.equal(createGame({ ...room, turnSeconds: 60 }, { mode: 'standard' }).turnSeconds, 60)
  assert.equal(createGame({ ...room, turnSeconds: 60 }, { mode: 'beginner', turnSeconds: 90 }).turnSeconds, 90)
  assert.equal(addMelodyPreset(standard, 'bright-pop'), standard)
  assert.deepEqual(standard.tracks.find((track) => track.instrumentId === 'kick').notes, [])
  assert.deepEqual(standard.tracks.find((track) => track.instrumentId === 'snare').notes, [])
  const standardUpdate = updateTrack(standard, standard.tracks[0].id, {
    notes: [{ id: 'sharp', start: 0, length: 1, pitch: 6 }],
  })
  assert.equal(standard.mode, 'standard')
  assert.equal(standardUpdate.tracks[0].notes[0].pitch, 6)
})

test('Starter beat can be cleared and restored without changing added tracks or the turn deadline', () => {
  const beginner = createGame(room, { mode: 'beginner' }, 1000)
  assert.equal(beginner.starterBeatOn, true)
  const layered = addMelodyPreset(beginner, 'lo-fi-beat')
  const deadline = layered.deadline
  const addedNotes = layered.tracks.filter((track) => track.presetInstanceId).map((track) => track.notes)
  const off = setStarterBeat(layered, false)
  assert.equal(off.starterBeatOn, false)
  assert.deepEqual(off.tracks.filter((track) => track.starterBeatPart).map((track) => track.notes), [[], []])
  assert.deepEqual(off.tracks.filter((track) => track.presetInstanceId).map((track) => track.notes), addedNotes)
  assert.equal(off.deadline, deadline)
  const on = setStarterBeat(off, true)
  assert.equal(on.starterBeatOn, true)
  assert.deepEqual(on.tracks.filter((track) => track.starterBeatPart).map((track) => track.notes.length), [8, 8])
  assert.equal(on.deadline, deadline)
  const fromScratch = createGame(room, { mode: 'beginner', starterBeatOn: false })
  assert.equal(fromScratch.starterBeatOn, false)
  assert.deepEqual(fromScratch.tracks.filter((track) => track.starterBeatPart).map((track) => track.notes), [[], []])
})

test('Melody presets create fresh notes that fit the two-bar pentatonic grid', () => {
  assert.equal(MELODY_CATEGORIES.length, 7)
  assert.equal(MELODY_PRESETS.length, 56)
  assert.deepEqual(MELODY_CATEGORIES.map(({ id }) => MELODY_PRESETS.filter((preset) => preset.category === id).length), [8, 8, 8, 8, 8, 8, 8])
  for (const style of ['Intro Chords', 'Syncopated Riff', 'Arp Lead', 'Chorus Hook', 'Breathy Ad-Lib', 'Horn Stabs', 'Vocal Chop', 'Breakbeat Bounce']) {
    assert.ok(MELODY_PRESETS.some((preset) => preset.style === style), `${style} preset exists`)
  }
  assert.ok(MELODY_PRESETS.every((preset) => preset.instrumentName && preset.vibe && preset.patterns.length))
  for (const preset of MELODY_PRESETS) for (const pattern of preset.patterns) {
    assert.ok(getInstrument(pattern.instrumentId)?.samples.some((sample) => sample.id === pattern.sampleId), `${preset.style} uses an installed sample`)
  }
  const first = createMelodyNotes('bright-pop')
  const second = createMelodyNotes('bright-pop')
  assert.equal(first.length, 8)
  assert.notEqual(first[0].id, second[0].id)
  assert.ok(first.every((note) => note.start >= 0 && note.start + note.length <= 16))
  assert.deepEqual(createMelodyNotes('classic-ballad').filter((note) => note.start === 0).map((note) => note.pitch), [0, 4, 7])
  assert.deepEqual(createMelodyNotes('unknown'), [])

  const game = createGame(room, { mode: 'beginner' })
  const selected = addMelodyPreset(game, 'four-floor')
  const addedTracks = selected.tracks.filter((track) => track.presetId === 'four-floor')
  assert.equal(addedTracks.length, 3)
  assert.deepEqual(addedTracks.map((track) => track.instrumentId), ['kick', 'clap', 'hat'])
  assert.ok(addedTracks.every((track) => track.ownerId === game.players[game.current].id))
  const instanceId = addedTracks[0].presetInstanceId
  assert.ok(addedTracks.every((track) => track.presetInstanceId === instanceId))
  assert.equal(selected.phase, 'edit', 'Adding a sequence keeps the current turn active')
  assert.equal(selected.current, game.current)
  const removed = removeAddedMelodyPreset(selected, instanceId)
  assert.equal(removed.tracks.some((track) => track.presetInstanceId === instanceId), false)
  assert.equal(removed.tracks.filter((track) => !track.presetInstanceId).length, game.tracks.length)
})

test('Notes can be moved and shortened to a sixty-fourth without rounding to eighths', () => {
  const note = constrainNote({ id: 'short', start: 7.375, length: 0.125, pitch: -4 })
  assert.equal(note.start, 7.375)
  assert.equal(note.length, 0.125)
  assert.equal(constrainNote({ ...note, length: -1 }).length, 0.125)
  assert.equal(constrainNote({ ...note, start: -1 }).start, 0)
})
