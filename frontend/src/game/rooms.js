export const roomKey = (code) => `pass-the-beat:room:${code}`
export const TURN_LENGTHS = [15, 30, 45, 60, 90, 120, 180, 240, 300]
export const LISTEN_LENGTHS = [4, 8, 15, 30, 45, 60]
export function normalizeRoom(value) {
  if (!value || !/^[A-Z2-9]{6}$/.test(value.code) || !Array.isArray(value.players) || value.players.length < 1 || value.players.length > 5) return null
  if (value.players.some((player) => typeof player.id !== 'string' || typeof player.name !== 'string')) return null
  if (new Set(value.players.map((player) => player.id)).size !== value.players.length) return null
  return { ...value, bpm: Math.max(60, Math.min(180, Number(value.bpm) || 120)),
    root: Number.isInteger(value.root) && value.root >= 0 && value.root < 12 ? value.root : 0,
    scale: value.scale === 'minor' ? 'minor' : 'major',
    turnSeconds: TURN_LENGTHS.includes(value.turnSeconds) ? value.turnSeconds : 30,
    listenSeconds: LISTEN_LENGTHS.includes(value.listenSeconds) ? value.listenSeconds : 8 }
}
export function readRoom(code) {
  try { return normalizeRoom(JSON.parse(localStorage.getItem(roomKey(code)))) } catch { return null }
}
export function formatTime(seconds) {
  const value = Math.max(0, Math.ceil(seconds))
  return `${Math.floor(value / 60)}:${String(value % 60).padStart(2, '0')}`
}
