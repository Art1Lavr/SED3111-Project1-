import test from 'node:test'
import assert from 'node:assert/strict'
import { inScale } from './harmony.js'

test('B natural minor highlights B, C sharp, D, E, F sharp, G and A in every octave', () => {
  const expected = [1, 2, 4, 6, 7, 9, 11]
  for (let pitch = -12; pitch <= 12; pitch++) assert.equal(inScale(pitch, 11, 'minor'), expected.includes(((pitch % 12) + 12) % 12))
})
test('C major highlights its seven natural notes', () => {
  for (let pitch = 0; pitch < 12; pitch++) assert.equal(inScale(pitch, 0, 'major'), [0, 2, 4, 5, 7, 9, 11].includes(pitch))
})
