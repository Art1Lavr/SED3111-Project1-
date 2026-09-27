import { useState } from 'react'
import { instruments } from '../audio/instruments'
import Modal from '../components/Modal'
import Brand from '../components/Brand'
import Icon from '../components/Icon'
import StepSequencer from '../components/StepSequencer'
import PianoRoll from '../components/PianoRoll'
import MelodySelector from '../components/MelodySelector'
import Queue from '../components/Queue'
import ArrangementTimeline from '../components/ArrangementTimeline'
import { audibleTracks, getInstrument, getSample, loopSeconds } from '../game/model'
import { MELODY_CATEGORIES, MELODY_PRESETS, planPreset, starterBeatEnabled } from '../game/beginner'

export default function BeginnerStudioPage({ game, selected, setSelectedId, playing, playhead, listenProgress, remaining, masterVolume,
  onMetronome, onVolume, onBpm, onPlay, startPosition, onSeek, onExit, onFinish, changeTrack, preview, previewPattern, onStopPreview, onSelectPreset, onRemovePreset, onAddEmpty, onStarterBeatChange, onUndo, onRetryListen }) {
  const changeNotes = notes => changeTrack(selected.id, { notes })
  const [noteClipboard, setNoteClipboard] = useState([])
  const [noteLength, setNoteLength] = useState(null)
  const [categoryId, setCategoryId] = useState(MELODY_CATEGORIES[0].id)
  const [addInstrumentOpen, setAddInstrumentOpen] = useState(false)
  const [libraryTab, setLibraryTab] = useState('patterns')
  const [pendingPreset, setPendingPreset] = useState(null)
  function choosePattern(pattern) {
    onStopPreview()
    if (planPreset(game, pattern, selected?.id).replacing.length) { setPendingPreset(pattern); return }
    onSelectPreset(pattern); setAddInstrumentOpen(false)
  }
  const transportBar = <header className="transport-bar beginner-transport"><Brand small onClick={onExit} /><span className="beginner-mode-badge">Beginner</span><label className="starter-beat-control"><input type="checkbox" checked={starterBeatEnabled(game)} disabled={game.phase !== 'edit'} onChange={event => onStarterBeatChange(event.target.checked)} />Starter Beat</label><span className="toolbar-divider" />
    <div className="transport-buttons"><button className={`transport-play ${playing ? 'active' : ''}`} disabled={game.phase === 'listen'} onClick={onPlay} aria-label={playing ? 'Pause playback' : 'Play'}><Icon name={playing ? 'pause' : 'play'} /><span>{playing ? 'Pause' : 'Play'}</span></button></div>
    <button className="metronome-toggle" aria-pressed={!!game.metronome} disabled={game.phase !== "edit"} onClick={onMetronome} title="Click on each beat during editing">Metronome</button>
    <label className="bpm-control"><input type="number" aria-label="BPM" min="60" max="180" key={game.bpm} defaultValue={game.bpm} disabled={game.phase !== 'edit'} onBlur={(event) => onBpm(Math.max(60, Math.min(180, Number(event.target.value) || 120)))} /><span>Tempo · BPM</span></label>
    <div className="transport-position"><strong>{String(Math.floor(playhead / 8) + 1).padStart(2, '0')}<i>:</i>{String(Math.floor(playhead % 8 / 2) + 1).padStart(2, '0')}</strong><span>2 BARS · {loopSeconds(game.bpm).toFixed(1)} SEC</span></div>
    <div className="transport-spacer" /><div className="master-volume"><span>Volume</span><Icon name="volume" size={16} /><input aria-label="Master volume" type="range" min="0" max="100" value={masterVolume} onChange={(event) => onVolume(Number(event.target.value))} /></div>
    <button className="button primary pass-button" disabled={game.phase !== 'edit'} onClick={onFinish}>{game.phase === 'listen' ? 'Listening…' : game.current === game.players.length - 1 ? 'Finish session' : 'Pass the beat'}<Icon name="arrow" size={16} /></button>
  </header>
  return <>{transportBar}
    <div className="beginner-mode-banner">🔰 BEGINNER MODE — Build with the grid or add a ready-made segment.</div>
    <div className="workspace beginner-workspace">
      <aside className="beginner-instrument-sidebar">
        <div className="beginner-sidebar-title"><span>Your tracks</span><span>{game.tracks.length} / 16</span></div>
        <p className="beginner-sidebar-hint">Choose a track to edit its notes.</p>
        <div className="beginner-active-channels">{game.tracks.map((track) => {
          const instrument = getInstrument(track.instrumentId)
          const categoryIdForTrack = track.presetCategory ?? (track.instrumentId === 'bass' ? 'bass' : ['kick', 'snare', 'hat', 'clap'].includes(track.instrumentId) ? 'drums' : 'keys')
          const category = MELODY_CATEGORIES.find((item) => item.id === categoryIdForTrack)
          return <div className={`beginner-channel-item ${selected?.id === track.id ? 'active' : ''} ${playing && audibleTracks(game.tracks, game.phase === 'edit').some(t => t.id === track.id) && track.notes.some(note => playhead >= note.start && playhead < note.start + Math.min(note.length, 0.5)) ? 'sound-active' : ''}`} key={track.id} style={{ '--track-color': getInstrument(track.instrumentId).color }}>
            <button className="beginner-channel-select" onClick={() => setSelectedId(track.id)} aria-pressed={selected?.id === track.id}>
              <span aria-hidden="true">{category?.icon}</span><strong>{track.presetStyle ?? instrument.name}</strong><small>{getSample(track).name} · {track.notes.length} notes</small>
            </button>
            <div className="beginner-channel-toggles">
              <button className="track-quick-toggle" disabled={game.phase !== 'edit'} aria-label={track.muted ? `Unmute ${instrument.name}` : `Mute ${instrument.name}`} aria-pressed={track.muted} onClick={() => changeTrack(track.id, { muted: !track.muted })} title="Silence this track">{track.muted ? 'Unmute' : 'Mute'}</button>
              <button className="track-quick-toggle" disabled={game.phase !== 'edit'} aria-label={track.solo ? `Unsolo ${instrument.name}` : `Solo ${instrument.name}`} aria-pressed={!!track.solo} onClick={() => changeTrack(track.id, { solo: !track.solo })} title="Listen to this track on its own">Solo</button>
            </div>
            {<button className="beginner-channel-remove" disabled={game.phase !== 'edit'} aria-label={`Remove track ${getSample(track).name}`} title="Remove this track. Undo restores it." onClick={() => onRemovePreset(track.id)}><Icon name="trash" size={14} /></button>}
          </div>
        })}</div>
        <div className="beginner-sidebar-footer"><button className="button primary beginner-add-instrument" disabled={game.phase !== 'edit'} aria-haspopup="dialog" onClick={() => { setPendingPreset(null); setAddInstrumentOpen(true) }}><Icon name="plus" size={16} />Add instrument</button><small>Use a pattern or start with empty notes.</small></div>
      </aside>
      <main className="editor-main beginner-library-main">
        <section className="arrangement beginner-arrangement"><div className="section-topline"><span>YOUR ARRANGEMENT</span><span>{game.tracks.reduce((sum, track) => sum + track.notes.length, 0)} notes · 2 bars</span></div>
          <div className="arrangement-scroll"><div className="arrangement-content"><ArrangementTimeline position={playhead} startPosition={startPosition} onSeek={onSeek} disabled={game.phase !== 'edit'} />
            {game.tracks.map((track) => <div key={track.id} className={`arrangement-row ${selected?.id === track.id ? 'selected' : ''}`} style={{ '--track-color': getInstrument(track.instrumentId).color }}>
              <button className="arrangement-label" onClick={() => setSelectedId(track.id)}><span className="color-dot" />{track.presetStyle ?? getInstrument(track.instrumentId).name}</button>
              {track.mode === 'steps'
                ? <StepSequencer track={track} locked={game.phase !== 'edit'} playhead={playhead} playing={playing} onSelect={() => setSelectedId(track.id)} onChange={(notes) => changeTrack(track.id, { notes })} isBeginner />
                : <button className="mini-roll" aria-label={`Edit ${track.presetStyle ?? getInstrument(track.instrumentId).name} in piano roll`} onClick={() => setSelectedId(track.id)}>{track.notes.map((note) => <i key={note.id} style={{ left: `${note.start / 16 * 100}%`, width: `${note.length / 16 * 100}%`, top: `${(12 - note.pitch) / 24 * 75}%` }} />)}{!track.notes.length && <span>Click to edit notes</span>}{playing && <b style={{ left: `${playhead / 16 * 100}%` }} />}</button>}
            </div>)}
          </div></div>
        </section>
        {selected ? <section className="active-editor beginner-active-editor" style={{ '--track-color': getInstrument(selected.instrumentId).color }}>
          <header className="editor-heading"><div><span className="color-dot" /><h2>{selected.presetStyle ?? getInstrument(selected.instrumentId).name}</h2><span className="editor-sample">/ {getSample(selected).name}</span></div><div className="editor-tools"><button className="icon-button" disabled={!game.history.length || game.phase !== 'edit'} onClick={onUndo} title="Undo · Ctrl+Z" aria-label="Undo"><Icon name="undo" size={15} /></button><button className="icon-button" disabled={!selected.notes.length || game.phase !== 'edit'} onClick={() => changeNotes([])} title="Clear track" aria-label="Clear track"><Icon name="trash" size={15} /></button></div></header>
          {selected.mode === 'piano'
            ? <PianoRoll key={selected.id} noteClipboard={noteClipboard} onCopy={setNoteClipboard} noteLength={noteLength} onNoteLengthChange={setNoteLength} track={selected} onChange={changeNotes} onPreview={(pitch) => preview(selected, pitch)} onCutSelf={(cutSelf) => changeTrack(selected.id, { cutSelf })} locked={game.phase !== 'edit'} playhead={playhead} playing={playing} isBeginner />
            : <div className="large-steps"><div className="steps-label"><Icon name="steps" size={19} />Drum grid <span>2 bars</span></div><StepSequencer track={selected} locked={game.phase !== 'edit'} playhead={playhead} playing={playing} onChange={changeNotes} onPreview={() => preview(selected)} expanded isBeginner /></div>}
        </section> : <div className="beginner-empty-state"><h2>Your beat starts here</h2><p>Add a ready-made pattern or an empty instrument.</p><button className="button primary" onClick={() => setAddInstrumentOpen(true)} disabled={game.phase !== 'edit'}>Add instrument</button></div>}
        <button className="text-button" disabled={game.phase !== 'edit' || !game.history.length} onClick={onUndo}>Undo last change</button>
      </main>
    </div>
    {addInstrumentOpen && game.phase === 'edit' && <Modal wide className="instrument-library-modal" title="Add an instrument" onClose={() => { setAddInstrumentOpen(false); onStopPreview() }}>
      <div className="library-tabs"><button aria-pressed={libraryTab === 'patterns'} onClick={() => { onStopPreview(); setPendingPreset(null); setLibraryTab('patterns') }}>Ready-made patterns</button><button aria-pressed={libraryTab === 'empty'} onClick={() => { onStopPreview(); setPendingPreset(null); setLibraryTab('empty') }}>Empty instrument</button></div>
      <p className="modal-copy">{libraryTab === 'patterns' ? 'Patterns fill matching tracks. Existing notes are replaced only after you confirm.' : 'Add a blank track and draw your own notes.'}</p>
      {pendingPreset && <div className="pattern-replace-notice" role="alert"><strong>Replace notes on {planPreset(game, pendingPreset, selected?.id).replacing.map(t => getSample(t).name).join(', ')}?</strong><span>Other tracks stay unchanged. Undo restores these notes.</span><div><button className="button secondary" onClick={() => setPendingPreset(null)}>Cancel</button><button className="button primary" onClick={() => { onSelectPreset(pendingPreset); setPendingPreset(null); setAddInstrumentOpen(false) }}>Replace notes</button></div></div>}
      {libraryTab === 'empty' ? <div className="empty-instrument-grid">{instruments.flatMap(instrument => (instrument.id === 'melody' ? instrument.samples : instrument.samples.slice(0, 1)).map(sample => <button className="empty-instrument-option" key={sample.id} disabled={game.tracks.length >= 16} onClick={() => { onAddEmpty(instrument.id, sample.id); setAddInstrumentOpen(false) }}><Icon name={instrument.pitched ? 'piano' : 'steps'} /><strong>{instrument.id === 'melody' ? sample.name.split('\u00b7')[0].trim() : instrument.name}</strong><span>{instrument.id === 'melody' ? 'Melody' : sample.name}</span><small>+ Add empty track</small></button>))}</div> :
      <div className="beginner-library-dialog">
        <nav className="beginner-category-list" aria-label="Add instrument category">
          {MELODY_CATEGORIES.map((category) => <button key={category.id} className={categoryId === category.id ? 'active' : ''} aria-current={categoryId === category.id ? 'page' : undefined} disabled={game.phase !== 'edit'} onClick={() => { onStopPreview(); setPendingPreset(null); setCategoryId(category.id) }}>
            <span aria-hidden="true">{category.icon}</span><strong>{category.title}</strong><small>{MELODY_PRESETS.filter((preset) => preset.category === category.id).length} patterns</small>
          </button>)}
        </nav>
        <MelodySelector key={categoryId} game={game} selectedId={selected?.id} categoryId={categoryId} locked={false} onSelect={choosePattern} onPreview={previewPattern} />
      </div>}
    </Modal>}
    <p className="beginner-turn-prompt">{game.players[game.current].name}: {game.phase === 'edit' ? 'Build on the shared beat or add a melodic loop.' : 'Listen to the shared beat.'}</p>
    <Queue game={game} remaining={remaining} listenProgress={listenProgress} />
    {game.phase === 'listen' && <div className="listen-banner"><Icon name="headphones" />{game.players[game.current].name}, listen to the beat<span>{Math.ceil(game.listenSeconds * (1 - listenProgress))}s</span>{!playing && <button className="text-button" onClick={onRetryListen}>Retry</button>}</div>}
  </>
}
