import { useEffect, useRef, useState } from 'react'
import useRightErase from '../hooks/useRightErase'
import { constrainNote, PITCHES, pitchName, STEPS, uid } from '../game/model'
import { inScale, NOTE_NAMES } from '../game/harmony'

import { transformSelection, duplicateSelection, copySelection, pasteNotes } from '../game/editing'

const ROW = 17
export default function PianoRoll({ track, onChange, onPreview, onCutSelf, locked, playhead, playing, root = 0, scale = 'major', noteClipboard = [], onCopy }) {
  const grid = useRef(null)
  const gesture = useRef(null)
  const draftRef = useRef(null)
  const [selected, setSelected] = useState([])
  const [draft, setDraft] = useState(null)
  const [snap, setSnap] = useState(0.5)
  const [zoom, setZoom] = useState(1)
  const [tool, setTool] = useState('draw')
  const [box, setBox] = useState(null)
  const shownNotes = draft ?? track.notes
  const quantize = (value) => Math.round(value / snap) * snap
  const erase = useRightErase(track.notes, onChange, locked)

  useEffect(() => {
    function shortcut(event) {
      if (!(event.ctrlKey || event.metaKey) || event.code !== 'KeyD' || event.target.closest('input,select,textarea,[contenteditable="true"]') || document.querySelector('dialog[open]')) return
      event.preventDefault()
      if (locked || event.repeat) return
      const next = duplicateSelection(track.notes, selected)
      if (next.notes !== track.notes) { onChange(next.notes); setSelected(next.ids) }
    }
    window.addEventListener('keydown', shortcut)
    return () => window.removeEventListener('keydown', shortcut)
  }, [locked, track.notes, selected, onChange])

  function beginDrag(event, note, resize) {
    event.stopPropagation()
    if (erase(event, (item) => item.id === note.id)) return
    if (event.button !== 0 || locked) return
    if (event.ctrlKey || event.metaKey) {
      setSelected((ids) => ids.includes(note.id) ? ids.filter((id) => id !== note.id) : [...ids, note.id]); return
    }
    const ids = selected.includes(note.id) ? selected : [note.id]
    setSelected(ids)
    event.currentTarget.closest('[role="button"]')?.focus()
    gesture.current = { x: event.clientX, y: event.clientY, ids, resize, stepWidth: grid.current.getBoundingClientRect().width / STEPS }
    event.currentTarget.setPointerCapture(event.pointerId)
    draftRef.current = track.notes; setDraft(track.notes)
  }
  function move(event) {
    const drag = gesture.current
    if (!drag) return
    if (drag.box) {
      const rect = grid.current.getBoundingClientRect()
      const x = Math.max(0, Math.min(rect.width, event.clientX - rect.left)), y = Math.max(0, Math.min(ROW * PITCHES.length, event.clientY - rect.top))
      const next = { left: Math.min(drag.x, x), top: Math.min(drag.y, y), width: Math.abs(x - drag.x), height: Math.abs(y - drag.y) }
      setBox(next)
      const ids = track.notes.filter((note) => note.start / STEPS * rect.width < next.left + next.width && (note.start + note.length) / STEPS * rect.width > next.left && (12 - note.pitch) * ROW < next.top + next.height && (13 - note.pitch) * ROW > next.top).map((note) => note.id)
      setSelected([...new Set([...drag.keep, ...ids])]); return
    }
    const dx = quantize((event.clientX - drag.x) / drag.stepWidth)
    const dy = -Math.round((event.clientY - drag.y) / ROW)
    const next = transformSelection(track.notes, drag.ids, dx, dy, drag.resize)
    draftRef.current = next; setDraft(next)
  }
  function commit() {
    if (gesture.current && !gesture.current.box && draftRef.current && JSON.stringify(draftRef.current) !== JSON.stringify(track.notes)) onChange(draftRef.current)
    gesture.current = null; draftRef.current = null; setDraft(null); setBox(null)
  }
  function remove(id) {
    if (locked) return
    const ids = id ? [id] : selected
    onChange(track.notes.filter((note) => !ids.includes(note.id))); setSelected((current) => current.filter((item) => !ids.includes(item)))
  }
  function duplicate() {
    if (locked) return
    const next = duplicateSelection(track.notes, selected)
    if (next.notes !== track.notes) { onChange(next.notes); setSelected(next.ids) }
  }
  function add(candidate) {
    if (locked) return
    const note = constrainNote({ ...candidate, id: uid() })
    onChange([...track.notes, note]); setSelected([note.id]); onPreview(note.pitch)
  }
  function copy() {
    const notes = copySelection(track.notes, selected)
    if (notes.length) onCopy?.(notes)
  }
  function paste() {
    if (locked || !noteClipboard.length) return
    const chosen = track.notes.filter((note) => selected.includes(note.id))
    const position = chosen.length ? Math.max(...chosen.map((note) => note.start + note.length)) : undefined
    const next = pasteNotes(track.notes, noteClipboard, position)
    onChange(next.notes); setSelected(next.ids); grid.current?.focus()
  }
  function handleKey(event) {
    if (locked || event.target.closest('input,select')) return
    const mod = event.ctrlKey || event.metaKey
    if (mod && event.code === 'KeyC') { event.preventDefault(); event.stopPropagation(); copy(); return }
    if (mod && event.code === 'KeyV') { event.preventDefault(); event.stopPropagation(); paste(); return }
    if (mod && event.key.toLowerCase() === 'a') { event.preventDefault(); event.stopPropagation(); setSelected(track.notes.map((note) => note.id)); return }
    if (mod && event.code === 'KeyD') return // Window shortcut also works when focus is outside the roll.
    if (event.key === 'Escape') { setSelected([]); return }
    if (!selected.length) return
    if (event.key === 'Delete' || event.key === 'Backspace') { event.preventDefault(); event.stopPropagation(); remove(); return }
    const dx = event.key === 'ArrowRight' ? snap : event.key === 'ArrowLeft' ? -snap : 0
    const dy = event.key === 'ArrowUp' ? 1 : event.key === 'ArrowDown' ? -1 : 0
    if (dx || dy) { event.preventDefault(); event.stopPropagation(); onChange(transformSelection(track.notes, selected, dx, dy, event.shiftKey && !!dx)) }
  }
  const noteStyle = (note) => ({ left: `${note.start / STEPS * 100}%`, width: `calc(${note.length / STEPS * 100}% - 1px)`, top: (12 - note.pitch) * ROW + 1 })

  return <div className="piano-editor" onKeyDown={handleKey} onContextMenu={(event) => event.preventDefault()}>
    <div className="piano-toolbar">
      <label>Snap<select value={snap} onChange={(event) => setSnap(Number(event.target.value))}>{[[1, '1/8'], [0.5, '1/16'], [0.25, '1/32'], [0.125, '1/64']].map(([value, label]) => <option key={value} value={value}>{label}</option>)}</select></label>
      <label>Zoom<select value={zoom} onChange={(event) => setZoom(Number(event.target.value))}>{[1, 1.5, 2, 3].map((value) => <option key={value} value={value}>{value * 100}%</option>)}</select></label>
      <span className="toolbar-divider" />
      <div className="mode-switch"><button aria-pressed={tool === 'draw'} className={tool === 'draw' ? 'active' : ''} onClick={() => setTool('draw')}>Draw</button><button aria-pressed={tool === 'select'} className={tool === 'select' ? 'active' : ''} onClick={() => setTool('select')}>Select</button></div>
      <button className="text-button" disabled={locked || !track.notes.length} onClick={() => setSelected(track.notes.map((note) => note.id))}>Select all</button>
      <button className="text-button" disabled={locked || !selected.length} onClick={duplicate}>Duplicate</button>
      <button className="text-button" disabled={locked || !selected.length} onClick={copy} title="Ctrl+C / Cmd+C">Copy</button>
      <button className="text-button" disabled={locked || !noteClipboard.length} onClick={paste} title="Ctrl+V / Cmd+V">Paste</button>
      <button className="text-button" disabled={locked || !selected.length} onClick={() => remove()}>Delete selected</button>
      <label className="polyphony-toggle"><input type="checkbox" checked={!track.cutSelf} disabled={locked} onChange={(event) => onCutSelf(!event.target.checked)} />Allow chords</label>
    </div>
    <div className="guide-caption"><strong>{NOTE_NAMES[root]} {scale === 'minor' ? 'minor' : 'major'}</strong><span>Highlighted rows belong to your lobby key. The root note has a stronger marker.</span><span>{selected.length} selected</span></div>
    <div className="guide-caption">{tool === 'draw' ? 'Click to draw. Ctrl + drag empty space to select a group.' : 'Drag empty space to select a group. Drag selected notes to move them together.'} Ctrl + click: toggle selection · Ctrl + C / V: copy / paste · Ctrl + D: duplicate · Delete: remove. Drag pasted notes to move the group. Enable Allow chords to hear simultaneous notes.</div>
    <div className="piano-scroll">
      <div className="piano-canvas" style={{ minWidth: `${Math.max(768, 768 * zoom)}px`, width: `${zoom * 100}%` }}>
        <div className="piano-ruler"><span>KEY</span><div>{Array.from({ length: STEPS }, (_, i) => <span key={i}>{i % 2 === 0 ? `${Math.floor(i / 8) + 1}.${Math.floor(i % 8 / 2) + 1}` : '·'}</span>)}</div></div>
        <div className="piano-body">
          <div className="piano-keys">{PITCHES.map((pitch) => <button key={pitch} className={pitchName(pitch).includes('♯') ? 'black-key' : ''} onClick={() => onPreview(pitch)} aria-label={`Preview ${pitchName(pitch)}`}>{pitchName(pitch).includes('♯') ? '' : pitchName(pitch)}</button>)}</div>
          <div className={`note-grid ${locked ? 'locked-grid' : ''}`} ref={grid} tabIndex={0} onPointerMove={move} onPointerUp={commit} onPointerCancel={() => { gesture.current = null; draftRef.current = null; setDraft(null); setBox(null) }} style={{ height: PITCHES.length * ROW }}
            aria-label="Piano roll. Click to add a note; drag to move; drag the right edge to resize."
            onPointerDown={(event) => {
              if (locked || event.button !== 0 || event.target !== event.currentTarget) return
              event.currentTarget.focus()
              const rect = grid.current.getBoundingClientRect()
              if (tool === 'select' || event.ctrlKey || event.metaKey) {
                const x = event.clientX - rect.left, y = event.clientY - rect.top
                gesture.current = { box: true, x, y, keep: event.shiftKey ? selected : [] }
                if (!event.shiftKey) setSelected([])
                setBox({ left: x, top: y, width: 0, height: 0 })
                event.currentTarget.setPointerCapture(event.pointerId); return
              }
              const start = Math.max(0, Math.min(STEPS - snap, Math.floor((event.clientX - rect.left) / (rect.width / STEPS) / snap) * snap))
              const pitch = PITCHES[Math.max(0, Math.min(24, Math.floor((event.clientY - rect.top) / ROW)))]
              add({ start, pitch, length: snap })
            }}>
            {PITCHES.map((pitch, i) => <div key={pitch} className={`pitch-band ${pitchName(pitch).includes('♯') ? 'sharp' : ''} ${pitch % 12 === 0 ? 'octave' : ''} ${inScale(pitch, root, scale) ? 'in-scale' : ''} ${((pitch - root) % 12 + 12) % 12 === 0 ? 'root-note' : ''}`} style={{ top: i * ROW }} />)}
            {Array.from({ length: STEPS / snap + 1 }, (_, i) => <div key={i} className={`beat-line ${i * snap % 2 === 0 ? 'strong' : ''} ${i * snap % 8 === 0 ? 'bar-line' : ''}`} style={{ left: `${i * snap / STEPS * 100}%` }} />)}
            {shownNotes.map((note) => <div key={note.id} role="button" tabIndex={0}
              aria-label={`${pitchName(note.pitch)}, position ${note.start + 1}, length ${note.length}. Arrow keys move; Shift and arrows resize; Delete removes.`}
              aria-disabled={locked} className={`piano-note ${selected.includes(note.id) ? 'selected' : ''}`} style={noteStyle(note)}
              onFocus={() => setSelected((ids) => ids.includes(note.id) ? ids : [note.id])} onPointerDown={(event) => beginDrag(event, note, false)}
              onPointerEnter={(event) => erase(event, (item) => item.id === note.id)}
              onPointerMove={(event) => erase(event, (item) => item.id === note.id)}
              onPointerCancel={() => { gesture.current = null; draftRef.current = null; setDraft(null) }}
              onDoubleClick={() => remove(note.id)} onContextMenu={(event) => { event.preventDefault(); remove(note.id) }}
              >
              <span>{pitchName(note.pitch)}</span>
              {!locked && <span className="note-resize" onPointerDown={(event) => beginDrag(event, note, true)} title="Drag to resize" />}
            </div>)}
            {box && <div className="selection-box" style={box} />}
            {playing && <div className="playhead" style={{ left: `${playhead / STEPS * 100}%` }} />}
          </div>
        </div>
      </div>
    </div>
  </div>
}
