import { useRef } from 'react'

export default function Knob({ value, onChange, disabled, label }) {
  const drag = useRef(null)
  return <div className="knob-control" onDoubleClick={(event) => event.stopPropagation()}>
    <div className="knob" role="slider" tabIndex={disabled ? -1 : 0} aria-label={label}
      aria-valuemin={0} aria-valuemax={100} aria-valuenow={Math.round(value * 100)} aria-disabled={disabled}
      style={{ '--rotation': `${-135 + value * 270}deg`, '--amount': `${value * 270}deg` }}
      onPointerDown={(event) => {
        event.stopPropagation()
        if (disabled) return
        drag.current = { y: event.clientY, value }
        event.currentTarget.setPointerCapture(event.pointerId)
      }}
      onPointerMove={(event) => {
        if (!drag.current || disabled) return
        onChange(Math.max(0, Math.min(1, drag.current.value + (drag.current.y - event.clientY) / 130)))
      }}
      onPointerUp={() => { drag.current = null }} onPointerCancel={() => { drag.current = null }}
      onKeyDown={(event) => {
        if (disabled) return
        const values = { ArrowUp: value + 0.05, ArrowRight: value + 0.05, ArrowDown: value - 0.05, ArrowLeft: value - 0.05, Home: 0, End: 1 }
        if (event.key in values) { event.preventDefault(); event.stopPropagation(); onChange(Math.max(0, Math.min(1, values[event.key]))) }
      }}><i /></div>
    <span>{Math.round(value * 100)}%</span>
  </div>
}
