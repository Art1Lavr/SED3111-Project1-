import { DRUM_STEPS, MIN_NOTE, STEPS, uid } from './model.js'

export function transformSelection(notes, ids, dx = 0, dy = 0, resize = false) {
  const chosen = notes.filter((note) => ids.includes(note.id))
  if (!chosen.length) return notes
  const x = resize
    ? Math.max(...chosen.map((note) => MIN_NOTE - note.length), Math.min(dx, ...chosen.map((note) => STEPS - note.start - note.length)))
    : Math.max(-Math.min(...chosen.map((note) => note.start)), Math.min(dx, ...chosen.map((note) => STEPS - note.start - note.length)))
  const y = Math.max(-12 - Math.min(...chosen.map((note) => note.pitch)), Math.min(dy, 12 - Math.max(...chosen.map((note) => note.pitch))))
  return notes.map((note) => !ids.includes(note.id) ? note : resize ? { ...note, length: note.length + x } : { ...note, start: note.start + x, pitch: note.pitch + y })
}

export function duplicateSelection(notes, ids) {
  const chosen = notes.filter((note) => ids.includes(note.id))
  if (!chosen.length) return { notes, ids }
  const end = Math.max(...chosen.map((note) => note.start + note.length))
  const offset = end - Math.min(...chosen.map((note) => note.start))
  if (end + offset > STEPS) return { notes, ids }
  const copies = chosen.map((note) => ({ ...note, id: uid(), start: note.start + offset }))
  return { notes: [...notes, ...copies], ids: copies.map((note) => note.id) }
}

export function fillSteps(every) {
  if (![1, 2, 4, 8].includes(every)) return []
  return Array.from({ length: DRUM_STEPS / every }, (_, i) => ({ id: uid(), start: i * every / 2, length: 0.5, pitch: 0 }))
}

export function copySelection(notes, ids) {
  return notes.filter((note) => ids.includes(note.id)).map(({ start, length, pitch }) => ({ start, length, pitch }))
}

export function pasteNotes(notes, clipboard, position) {
  if (!clipboard.length) return { notes, ids: [] }
  const first = Math.min(...clipboard.map((note) => note.start))
  const span = Math.max(...clipboard.map((note) => note.start + note.length)) - first
  const start = Math.max(0, Math.min(STEPS - span, position ?? first))
  const copies = clipboard.map((note) => ({ ...note, id: uid(), start: start + note.start - first }))
  return { notes: [...notes, ...copies], ids: copies.map((note) => note.id) }
}
