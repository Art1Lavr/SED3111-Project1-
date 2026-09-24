import { useEffect, useRef } from 'react'
import Icon from './Icon'

export default function Modal({ title, children, onClose, wide = false }) {
  const ref = useRef(null)
  useEffect(() => {
    const previous = document.activeElement
    ref.current.showModal()
    return () => { previous?.focus?.() }
  }, [])
  return <dialog ref={ref} className={`modal ${wide ? 'wide' : ''}`} onCancel={onClose}
    onClick={(event) => { if (event.target === ref.current) onClose() }}>
    <header><h2>{title}</h2><button className="icon-button" onClick={onClose} aria-label="Close"><Icon name="close" /></button></header>
    {children}
  </dialog>
}
