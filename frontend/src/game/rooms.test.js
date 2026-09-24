import test from 'node:test'
import assert from 'node:assert/strict'
import { normalizeRoom, formatTime } from './rooms.js'
import { createGame } from './model.js'

test('Room settings retain a five-minute turn and a separate listening duration', () => {
  const room = normalizeRoom({ code: 'ABC234', players: [{ id: 'a', name: 'Alex' }, { id: 'b', name: 'Sam' }], bpm: 90, turnSeconds: 300, listenSeconds: 15 })
  const game = createGame(room, 1000)
  assert.equal(game.deadline, 301000)
  assert.equal(game.listenSeconds, 15)
  assert.equal(formatTime(300), '5:00')
  assert.equal(formatTime(59.1), '1:00')
  assert.equal(formatTime(0), '0:00')
})

test('Stored rooms validate players and migrate older settings', () => {
  assert.equal(normalizeRoom(null), null)
  assert.equal(normalizeRoom({ code: 'broken', players: [] }), null)
  assert.equal(normalizeRoom({ code: 'ABC234', players: [{ id: 'a', name: 'Alex' }, { id: 'a', name: 'Sam' }] }), null)
  const room = normalizeRoom({ code: 'ABC234', players: [{ id: 'a', name: 'Alex' }], bpm: 999, turnSeconds: 999 })
  assert.equal(room.bpm, 180)
  assert.equal(room.turnSeconds, 30)
  assert.equal(room.listenSeconds, 8)
})
