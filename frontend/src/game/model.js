import { instruments } from '../audio/instruments.js'

export const STEPS = 16
export const MIN_NOTE = 0.125 // One sixty-fourth note; internal units are eighth notes.
export const DRUM_STEPS = 32
export const PLAYER_COLORS = ['#b4b9dc', '#b8a6ce', '#ccb28c', '#98b9c9', '#c7a2b5']
export const PITCHES = Array.from({ length: 25 }, (_, index) => 12 - index)
export const uid = () => crypto.randomUUID()
export const stepSeconds = (bpm) => 30 / bpm
export const loopSeconds = (bpm) => STEPS * stepSeconds(bpm)
export const getInstrument = (id) => instruments.find((instrument) => instrument.id === id)
export const getSample = (track) => getInstrument(track.instrumentId).samples.find((sample) => sample.id === track.sampleId)
export const pitchName = (pitch) => {
  const midi = 60 + pitch
  return `${['C', 'C♯', 'D', 'D♯', 'E', 'F', 'F♯', 'G', 'G♯', 'A', 'A♯', 'B'][midi % 12]}${Math.floor(midi / 12)}`
}

export function createTrack(instrumentId, ownerId, sampleId) {
  const instrument = getInstrument(instrumentId)
  return {
    id: uid(), instrumentId, ownerId, sampleId: sampleId ?? instrument.samples[0].id,
    volume: 0.75, muted: false, mode: instrument.pitched ? 'piano' : 'steps',
    cutSelf: !!instrument.pitched, transpose: 0, notes: [],
  }
}

export function initialTracks(ownerId) {
  return ['melody', 'bass', 'kick', 'hat', 'snare', 'clap'].map((id) => createTrack(id, ownerId))
}

export function constrainNote(note) {
  const quantize = (value) => Math.round(value / MIN_NOTE) * MIN_NOTE
  const start = Math.max(0, Math.min(STEPS - MIN_NOTE, quantize(Number(note.start) || 0)))
  return { ...note, start, length: Math.max(MIN_NOTE, Math.min(STEPS - start, quantize(Number(note.length) || MIN_NOTE))), pitch: Math.max(-12, Math.min(12, Math.round(Number(note.pitch) || 0))) }
}

export function toggleStep(notes, start) {
  if (notes.some((note) => note.start === start)) return notes.filter((note) => note.start !== start)
  return [...notes, { id: uid(), start, length: 0.5, pitch: 0 }]
}

export function createGame(room, now = Date.now()) {
  return {
    players: room.players.map((player) => ({ ...player })), tracks: initialTracks(room.players[0].id),
    code: room.code, bpm: room.bpm, root: room.root ?? 0, scale: room.scale ?? 'major', turnSeconds: room.turnSeconds, listenSeconds: room.listenSeconds ?? 8, current: 0, phase: 'edit',
    deadline: now + room.turnSeconds * 1000, history: [],
  }
}

export function finishTurn(game) {
  if (game.phase !== 'edit') return game
  const current = game.current + 1
  if (current >= game.players.length) return { ...game, phase: 'reveal', deadline: null, history: [] }
  return { ...game, current, phase: 'listen', deadline: null, history: [] }
}

export function beginTurn(game, now = Date.now()) {
  if (game.phase !== 'listen') return game
  return { ...game, phase: 'edit', deadline: now + game.turnSeconds * 1000 }
}

export function updateTrack(game, trackId, update) {
  if (game.phase !== 'edit') return game
  if (!game.tracks.some((track) => track.id === trackId)) return game
  return {
    ...game, history: [...game.history.slice(-39), game.tracks],
    tracks: game.tracks.map((track) => track.id === trackId ? { ...track, ...update } : track),
  }
}
