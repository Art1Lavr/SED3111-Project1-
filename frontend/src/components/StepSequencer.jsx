import { DRUM_STEPS, toggleStep } from '../game/model'
import { fillSteps } from '../game/editing'
import useRightErase from '../hooks/useRightErase'

export default function StepSequencer({ track, locked, playhead, playing, onChange, onSelect, onPreview, expanded = false }) {
  const erase = useRightErase(track.notes, onChange, locked)
  return <div className={expanded ? 'drum-sequencer' : 'step-row'} onContextMenu={(event) => event.preventDefault()}>
    {expanded && <div className="fill-tools"><span>Quick fill</span>{[1, 2, 4, 8].map((every) => <button key={every} disabled={locked} onClick={() => onChange(fillSteps(every))}>Every {every} {every === 1 ? 'step' : 'steps'}</button>)}<small>Replaces this pattern · Undo to restore</small></div>}
    {expanded && <div className="drum-ruler">{Array.from({ length: 8 }, (_, i) => <span key={i}>BAR {Math.floor(i / 4) + 1} · {i % 4 + 1}</span>)}</div>}
    <div className="step-buttons">{Array.from({ length: DRUM_STEPS }, (_, index) => {
      const start = index / 2
      const active = track.notes.some((note) => note.start >= start && note.start < start + 0.5)
      return <button key={index} className={`${active ? 'on' : ''} ${Math.floor(index / 4) % 2 ? 'alternate' : ''} ${playing && Math.floor(playhead * 2) === index ? 'at-playhead' : ''}`}
        disabled={locked} aria-label={`Step ${index + 1}, bar ${Math.floor(index / 16) + 1}`} aria-pressed={active}
        onPointerDown={(event) => erase(event, (note) => note.start >= start && note.start < start + 0.5)}
        onPointerEnter={(event) => erase(event, (note) => note.start >= start && note.start < start + 0.5)}
        onPointerMove={(event) => erase(event, (note) => note.start >= start && note.start < start + 0.5)}
        onClick={() => {
          onSelect?.()
          onChange(active ? track.notes.filter((note) => note.start < start || note.start >= start + 0.5) : toggleStep(track.notes, start))
          if (!active) onPreview?.()
        }}>{expanded && <><i /><span>{index % 4 + 1}</span></>}</button>
    })}</div>
    {expanded && <p className="small-note">32 sixteenth-note steps · 2 bars. Switch to Piano roll for pitch and note length.</p>}
  </div>
}
