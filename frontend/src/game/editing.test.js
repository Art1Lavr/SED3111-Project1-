import test from 'node:test'
import assert from 'node:assert/strict'
import { copySelection, pasteNotes, duplicateSelection, fillSteps, transformSelection } from './editing.js'

const notes = [{ id: 'a', start: 1, pitch: 0, length: 1 }, { id: 'b', start: 2, pitch: 4, length: 2 }, { id: 'c', start: 8, pitch: 7, length: 1 }]
test('Copy and paste preserve the group, create fresh IDs and fit the entire group at the edge', () => {
  const clipboard = copySelection(notes, ['a', 'b'])
  const result = pasteNotes(notes, clipboard, 15)
  assert.deepEqual(result.notes.slice(3).map(({ start, pitch, length }) => ({ start, pitch, length })), [
    { start: 13, pitch: 0, length: 1 }, { start: 14, pitch: 4, length: 2 },
  ])
  assert.equal(new Set(result.notes.map((note) => note.id)).size, 5)
  assert.notEqual(pasteNotes([], clipboard).ids[0], result.ids[0])
  assert.equal(clipboard[0].start, 1)
  assert.equal(pasteNotes(notes, []).notes, notes)
})
test('Moving a group preserves timing and pitch intervals at grid boundaries', () => {
  const next = transformSelection(notes, ['a', 'b'], -5, 20)
  assert.equal(next[0].start, 0)
  assert.equal(next[1].start, 1)
  assert.equal(next[1].pitch - next[0].pitch, 4)
  assert.equal(next[1].pitch, 12)
  assert.equal(next[2], notes[2])
  const resized = transformSelection(notes, ['a', 'b'], -10, 0, true)
  assert.equal(resized[0].length, 0.125)
  assert.equal(resized[1].length, 1.125)
})
test('Duplicate places a copy after the group and refuses out-of-bounds copies', () => {
  const result = duplicateSelection(notes, ['a', 'b'])
  assert.equal(result.notes.length, 5)
  assert.deepEqual(result.notes.slice(3).map((note) => note.start), [4, 5])
  assert.equal(new Set(result.notes.map((note) => note.id)).size, 5)
  const full = [{ id: 'x', start: 0, length: 16, pitch: 0 }]
  assert.equal(duplicateSelection(full, ['x']).notes, full)
})
test('Quick fills use sixteenth-note steps over exactly two bars', () => {
  for (const every of [1, 2, 4, 8]) {
    const pattern = fillSteps(every)
    assert.equal(pattern.length, 32 / every)
    assert.ok(pattern.every((note, index) => note.start === index * every / 2 && note.length === 0.5 && note.start + note.length <= 16))
  }
})
