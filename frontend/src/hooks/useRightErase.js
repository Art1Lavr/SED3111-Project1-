import { useEffect, useRef } from 'react'

// Keep the current stroke's notes so rapid pointer events cannot restore erased notes.
export default function useRightErase(notes, onChange, locked) {
  const stroke = useRef(null)
  useEffect(() => {
    const end = () => { stroke.current = null }
    window.addEventListener('pointerup', end)
    window.addEventListener('blur', end)
    return () => { window.removeEventListener('pointerup', end); window.removeEventListener('blur', end) }
  }, [])
  return (event, matches) => {
    if (locked || !(event.buttons & 2 || event.type === 'pointerdown' && event.button === 2)) return false
    event.preventDefault(); event.stopPropagation()
    if (event.type === 'pointerdown' || stroke.current === null) stroke.current = notes
    const next = stroke.current.filter((note) => !matches(note))
    if (next.length !== stroke.current.length) { stroke.current = next; onChange(next) }
    return true
  }
}
