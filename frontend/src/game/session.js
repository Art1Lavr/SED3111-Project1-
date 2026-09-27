import { constrainNote, getInstrument } from './model.js'
import { normalizeRoom } from './rooms.js'

export const sessionKey = (code) => `pass-the-beat:session:${code}`
const latestKey = 'pass-the-beat:last-session'
export function snapshot(game, masterVolume, now = Date.now()) {
  return { version: 1, game: { ...game, history: [], deadline: null,
    pausedSeconds: game.phase === 'edit' && game.deadline != null ? Math.max(0, (game.deadline - now) / 1000) : (game.pausedSeconds ?? game.turnSeconds) }, masterVolume }
}
export function restoreSession(value) {
  if (value?.version !== 1) return null
  const game = value.game, room = normalizeRoom(game)
  if (!room || !['edit', 'listen', 'reveal'].includes(game.phase) || !Number.isInteger(game.current) || game.current < 0 || game.current >= room.players.length || !Array.isArray(game.tracks) || (!game.tracks.length && game.mode !== 'beginner') || game.tracks.length > 16) return null
  const ids = new Set()
  for (const track of game.tracks) {
    if (!track || typeof track.id !== 'string' || ids.has(track.id) || !getInstrument(track.instrumentId)?.samples.some(s => s.id === track.sampleId) || !Array.isArray(track.notes) || track.notes.length > 10000) return null
    ids.add(track.id)
    if (track.notes.some(n => !n || typeof n.id !== 'string' || ![n.start, n.pitch, n.length].every(Number.isFinite))) return null
  }
  return { game: { ...room, mode: game.mode === 'beginner' ? 'beginner' : 'standard', phase: game.phase, current: game.current, history: [], deadline: null,
    pausedSeconds: Math.max(0, Math.min(room.turnSeconds, Number(game.pausedSeconds) || 0)), metronome: !!game.metronome,
    tracks: game.tracks.map(t => ({ ...t, volume: Math.max(0, Math.min(1, Number(t.volume) || 0)), transpose: Math.max(-24, Math.min(24, Number(t.transpose) || 0)), muted: !!t.muted, solo: !!t.solo, cutSelf: !!t.cutSelf, notes: t.notes.map(note => constrainNote(note, game.mode)) })) },
    masterVolume: Math.max(0, Math.min(100, Number.isFinite(value.masterVolume) ? value.masterVolume : 65)) }
}
export function readSession(code) {
  try { return restoreSession(JSON.parse(localStorage.getItem(sessionKey(code)))) } catch { return null }
}
export function lastSessionCode() {
  try { const code = localStorage.getItem(latestKey); return readSession(code)?.game.code ?? null } catch { return null }
}
export function saveSession(game, volume) {
  localStorage.setItem(sessionKey(game.code), JSON.stringify(snapshot(game, volume)))
  localStorage.setItem(latestKey, game.code)
}
export function clearSession(code) {
  localStorage.removeItem(sessionKey(code))
  if (localStorage.getItem(latestKey) === code) localStorage.removeItem(latestKey)
}
