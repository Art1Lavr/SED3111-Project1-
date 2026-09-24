import { useState } from 'react'
import { getInstrument, getSample } from '../game/model'
import Modal from './Modal'
import Icon from './Icon'

export function SamplePicker({ onClose, onChoose, title }) {
  const [category, setCategory] = useState('melody')
  const instrument = getInstrument(category)
  return <Modal title={title} onClose={onClose} wide><div className="sound-picker">
    <nav aria-label="Sound categories">{['melody', 'bass', 'kick', 'hat', 'snare', 'clap'].map((id) => {
      const item = getInstrument(id)
      return <button key={id} className={category === id ? 'active' : ''} style={{ '--track-color': item.color }} onClick={() => setCategory(id)}><span className="color-dot" />{item.name}<span>{item.samples.length}</span></button>
    })}</nav>
    <div className="sample-options">{instrument.samples.map((sample, index) => <button key={sample.id} onClick={() => onChoose(instrument.id, sample.id)}><span className="sample-number">0{index + 1}</span><span>{sample.name}<small>{instrument.pitched ? 'One-shot' : 'Drum hit'}</small></span><Icon name="plus" /></button>)}</div>
  </div></Modal>
}

export function SoundSettings({ track, locked, onClose, onChange, onPreview, onChooseSound }) {
  const instrument = getInstrument(track.instrumentId)
  return <Modal title={getSample(track).name} onClose={onClose}><div className="sound-settings" style={{ '--track-color': instrument.color }}>
    <div className="settings-top"><span className="sound-tile"><Icon name={instrument.pitched ? 'piano' : 'steps'} size={32} /></span><div><strong>{instrument.name}</strong><p>{locked ? 'Previous player’s contribution' : 'Track settings'}</p></div><button className="icon-button" onClick={onPreview} aria-label="Preview sound"><Icon name="play" /></button></div>
    <label>Volume <span>{Math.round(track.volume * 100)}%</span><input type="range" min="0" max="1" step="0.01" value={track.volume} disabled={locked} onChange={(event) => onChange({ volume: Number(event.target.value) })} /></label>
    <label>Transpose <span>{track.transpose > 0 ? '+' : ''}{track.transpose} semitones</span><input type="range" min="-12" max="12" value={track.transpose} disabled={locked} onChange={(event) => onChange({ transpose: Number(event.target.value) })} /></label>
    <label className="check-setting"><input type="checkbox" checked={track.cutSelf} disabled={locked} onChange={(event) => onChange({ cutSelf: event.target.checked })} /><span>Cut itself<small>Each new note stops the previous one</small></span></label>
    <div className="settings-readout"><span>RESAMPLE</span><span>TIME: NONE</span><span>LOOP: OFF</span></div>
    <button className="button secondary" disabled={locked} onClick={onChooseSound}>Change sound<Icon name="arrow" size={16} /></button>
  </div></Modal>
}
