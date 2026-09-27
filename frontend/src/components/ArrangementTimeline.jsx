import { useRef } from 'react'
import { STEPS } from '../game/model'

export default function ArrangementTimeline({ position, startPosition, onSeek, disabled }) {
  const track = useRef(null)
  const dragging = useRef(false)
  function seek(event) {
    const rect = track.current.getBoundingClientRect()
    if (rect.width) onSeek((event.clientX - rect.left) / rect.width * STEPS)
  }
  return <div className="arrangement-timeline"><span className="timeline-label">POSITION</span><div ref={track} className="timeline-track"
    role="slider" tabIndex={disabled ? -1 : 0} aria-label="Playback start position" aria-valuemin={0} aria-valuemax={15.875} aria-valuenow={startPosition} aria-disabled={disabled}
    onPointerDown={(event) => { if (disabled || event.button !== 0) return; event.preventDefault(); dragging.current = true; event.currentTarget.focus(); event.currentTarget.setPointerCapture(event.pointerId); seek(event) }}
    onPointerMove={(event) => { if (dragging.current && !disabled) seek(event) }}
    onPointerUp={() => { dragging.current = false }} onPointerCancel={() => { dragging.current = false }}
    onKeyDown={(event) => { if (disabled) return; const delta = event.key === 'ArrowRight' ? 0.5 : event.key === 'ArrowLeft' ? -0.5 : 0; if (delta || event.key === 'Home') { event.preventDefault(); onSeek(event.key === 'Home' ? 0 : startPosition + delta) } }}>
    <div className="timeline-ruler" title="Click or drag to set the playback start">{Array.from({ length: 8 }, (_, i) => <span key={i}>{Math.floor(i / 4) + 1}.{i % 4 + 1}</span>)}</div>
    {startPosition > 0 && <div className="timeline-start" style={{ left: `${startPosition / STEPS * 100}%` }} />}
    <div className="timeline-cursor" style={{ left: `${position / STEPS * 100}%` }} title="Drag to choose where playback starts"><i /></div>
  </div></div>
}
