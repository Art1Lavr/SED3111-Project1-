import Icon from './Icon'
import { MELODY_CATEGORIES, MELODY_PRESETS } from '../game/model'

export default function MelodySelector({ categoryId, locked, addedPresetIds = new Set(), onSelect, onPreview }) {
  const category = MELODY_CATEGORIES.find((item) => item.id === categoryId) ?? MELODY_CATEGORIES[0]
  const presets = MELODY_PRESETS.filter((preset) => preset.category === category.id)
  return <div className="melody-selector" aria-label="All beginner sequences">
    <header className="melody-selector-heading"><div><span>BEGINNER SEQUENCES</span><h3>{category.icon} {category.title}</h3></div><p>Preview a loop, then add it to your track.</p></header>
    <div className="melody-pattern-grid">
      {presets.map((pattern) => <article className="melody-pattern-card" key={pattern.id}>
        {addedPresetIds.has(pattern.id) && <span className="melody-added-tag">✓ Selected</span>}
        <div className="melody-pattern-art" aria-hidden="true">
          {pattern.patterns.flatMap((part, partIndex) => part.notes.map(([start, pitch, length], index) => <i key={`${part.instrumentId}-${start}-${pitch}-${index}`} style={{ left: `${start / 16 * 100}%`, width: `${Math.max(4, length / 16 * 100)}%`, bottom: `${14 + partIndex * 14 + (pitch + 12) * 1.7}%` }} />))}
        </div>
        <h5>{category.icon} {pattern.instrumentName} — {pattern.style}</h5>
        <span className="melody-vibe-tag">{pattern.vibe}</span>
        <p>{pattern.description}</p>
        <div className="melody-pattern-actions">
          <button className="button preview-pattern-button" disabled={locked} onClick={() => onPreview(pattern)}><Icon name="play" size={13} />Preview</button>
          {addedPresetIds.has(pattern.id)
            ? <button className="button added-pattern-button" disabled><Icon name="check" size={14} />Selected ✓</button>
            : <button className="button primary" disabled={locked} onClick={() => onSelect(pattern)}><Icon name="check" size={14} />Add to Track</button>}
        </div>
      </article>)}
    </div>
  </div>
}
