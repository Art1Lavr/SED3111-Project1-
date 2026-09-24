import { useState } from 'react'
import Brand from '../components/Brand'
import Icon from '../components/Icon'
import Knob from '../components/Knob'
import StepSequencer from '../components/StepSequencer'
import PianoRoll from '../components/PianoRoll'
import Queue from '../components/Queue'
import { getInstrument, getSample, loopSeconds } from '../game/model'

export default function StudioPage({ game, selected, selectedId, setSelectedId, playing, playhead, listenProgress, remaining, masterVolume,
  onVolume, onBpm, onPlay, onStop, onExit, onFinish, editable, changeTrack, preview, setSettings, setContext, onAdd, onUndo, onRetryListen }) {
  const changeNotes = (notes) => changeTrack(selected.id, { notes })
  const [noteClipboard, setNoteClipboard] = useState([])
  return <><header className="transport-bar"><Brand small onClick={onExit} /><span className="toolbar-divider" />
    <div className="transport-buttons"><button className={`transport-play ${playing ? 'active' : ''}`} disabled={game.phase === 'listen'} onClick={onPlay} aria-label={playing ? 'Pause playback' : 'Play'}><Icon name={playing ? 'pause' : 'play'} /></button><button className="icon-button" disabled={game.phase === 'listen'} onClick={onStop} aria-label="Stop"><Icon name="stop" size={16} /></button></div>
    <label className="bpm-control"><input type="number" aria-label="BPM" min="60" max="180" value={game.bpm} disabled={game.phase !== 'edit'} onChange={(event) => onBpm(Math.max(60, Math.min(180, Number(event.target.value) || 120)))} /><span>BPM</span></label>
    <div className="transport-position"><strong>{String(Math.floor(playhead / 8) + 1).padStart(2, '0')}<i>:</i>{String(Math.floor(playhead % 8 / 2) + 1).padStart(2, '0')}</strong><span>2 BARS · {loopSeconds(game.bpm).toFixed(1)} SEC</span></div>
    <div className="transport-spacer" /><div className="master-volume"><Icon name="volume" size={16} /><input aria-label="Master volume" type="range" min="0" max="100" value={masterVolume} onChange={(event) => onVolume(Number(event.target.value))} /></div>
    <button className="button primary pass-button" disabled={game.phase !== 'edit'} onClick={onFinish}>{game.phase === 'listen' ? 'Listening…' : game.current === game.players.length - 1 ? 'Finish session' : 'Pass the beat'}<Icon name="arrow" size={16} /></button>
  </header>
  <div className="workspace"><aside className="track-sidebar"><div className="sidebar-heading"><span>CHANNELS</span><span>{game.tracks.length.toString().padStart(2, '0')}</span></div>
    <div className="track-list">{game.tracks.map((track, index) => {
      const instrument = getInstrument(track.instrumentId), locked = !editable(track)
      return <div key={track.id} className={`track-card ${selectedId === track.id ? 'selected' : ''} ${locked ? 'locked' : ''}`} style={{ '--track-color': instrument.color }}
        role="button" tabIndex={0} aria-label={`${instrument.name}: ${getSample(track).name}${locked ? ', locked contribution' : ''}`} aria-pressed={selectedId === track.id}
        onClick={() => setSelectedId(track.id)} onDoubleClick={() => setSettings(track.id)}
        onKeyDown={(event) => { if (event.target !== event.currentTarget) return; if (event.key === 'Enter' || event.key === ' ') { event.preventDefault(); setSelectedId(track.id) } if (event.key === 'F2') setSettings(track.id) }}
        onContextMenu={(event) => { event.preventDefault(); setSelectedId(track.id); setContext({ id: track.id, x: Math.max(0, Math.min(event.clientX, window.innerWidth - 220)), y: Math.max(0, Math.min(event.clientY, window.innerHeight - 180)) }) }}>
        <div className="track-card-heading"><span className="track-index">{String(index + 1).padStart(2, '0')}</span><span className="track-name">{instrument.name}</span>{locked ? <Icon name="lock" size={12} /> : <button className="icon-button tiny" aria-label={`Configure ${instrument.name}`} onClick={(event) => { event.stopPropagation(); setSettings(track.id) }}><Icon name="more" size={15} /></button>}</div>
        <div className="track-card-main"><button className="track-symbol" aria-label={`Preview ${getSample(track).name}`} onClick={(event) => { event.stopPropagation(); preview(track) }}><Icon name={instrument.pitched ? 'piano' : 'steps'} size={27} /></button><Knob label={`Volume ${instrument.name}, track ${index + 1}`} value={track.volume} disabled={locked} onChange={(volume) => changeTrack(track.id, { volume })} /></div>
        <span className="sample-name">{getSample(track).name}</span><div className="track-bottom"><div className="mini-mode"><button aria-label={`Steps: track ${index + 1}`} aria-pressed={track.mode === 'steps'} disabled={locked} onClick={(event) => { event.stopPropagation(); changeTrack(track.id, { mode: 'steps' }); setSelectedId(track.id) }}><Icon name="steps" size={12} /></button><button aria-label={`Piano roll: track ${index + 1}`} aria-pressed={track.mode === 'piano'} disabled={locked} onClick={(event) => { event.stopPropagation(); changeTrack(track.id, { mode: 'piano' }); setSelectedId(track.id) }}><Icon name="piano" size={12} /></button></div><button className={`icon-button tiny ${track.muted ? 'muted' : ''}`} disabled={locked} aria-label={track.muted ? 'Unmute track' : 'Mute track'} onClick={(event) => { event.stopPropagation(); changeTrack(track.id, { muted: !track.muted }) }}><Icon name={track.muted ? 'mute' : 'volume'} size={13} /></button></div>
      </div>
    })}</div><button className="add-track" disabled={game.phase !== 'edit' || game.tracks.length >= 16} onClick={onAdd}><Icon name="plus" size={16} />Add sound</button>
  </aside><main className="editor-main">
    <section className="arrangement"><div className="section-topline"><span>THE SHARED BEAT</span><span>{game.tracks.reduce((sum, track) => sum + track.notes.length, 0)} notes<span className="faint"> / 2 bars</span></span></div>
      <div className="arrangement-scroll"><div className="arrangement-ruler"><span /><div>{Array.from({ length: 16 }, (_, i) => <span key={i}>{i % 2 === 0 ? i / 2 + 1 : '·'}</span>)}</div></div>
        {game.tracks.map((track) => <div key={track.id} className={`arrangement-row ${selected.id === track.id ? 'selected' : ''}`} style={{ '--track-color': getInstrument(track.instrumentId).color }}>
          <button className="arrangement-label" onClick={() => setSelectedId(track.id)}><span className="color-dot" />{getInstrument(track.instrumentId).name}{!editable(track) && <Icon name="lock" size={10} />}</button>
          {track.mode === 'steps' ? <StepSequencer track={track} locked={!editable(track)} playhead={playhead} playing={playing} onSelect={() => setSelectedId(track.id)} onChange={(notes) => changeTrack(track.id, { notes })} />
            : <button className="mini-roll" aria-label={`Open piano roll ${getInstrument(track.instrumentId).name}`} onClick={() => setSelectedId(track.id)}>{track.notes.map((note) => <i key={note.id} style={{ left: `${note.start / 16 * 100}%`, width: `${note.length / 16 * 100}%`, top: `${(12 - note.pitch) / 24 * 75}%` }} />)}{!track.notes.length && <span>+ Add notes</span>}{playing && <b style={{ left: `${playhead / 16 * 100}%` }} />}</button>}
        </div>)}
      </div>
    </section>
    <section className="active-editor" style={{ '--track-color': getInstrument(selected.instrumentId).color }}>
      <header className="editor-heading"><div><span className="color-dot" /><h2>{getInstrument(selected.instrumentId).name}</h2><span className="editor-sample">/ {getSample(selected).name}</span>{!editable(selected) && <span className="locked-tag"><Icon name="lock" size={11} />Locked</span>}</div><div className="editor-tools"><button className="icon-button" disabled={!editable(selected) || !game.history.length} onClick={onUndo} title="Undo · Ctrl+Z" aria-label="Undo"><Icon name="undo" size={15} /></button><button className="icon-button" disabled={!editable(selected) || !selected.notes.length} onClick={() => changeNotes([])} title="Clear track" aria-label="Clear track"><Icon name="trash" size={15} /></button><div className="mode-switch"><button className={selected.mode === 'steps' ? 'active' : ''} onClick={() => changeTrack(selected.id, { mode: 'steps' })} disabled={!editable(selected)}>Steps</button><button className={selected.mode === 'piano' ? 'active' : ''} onClick={() => changeTrack(selected.id, { mode: 'piano' })} disabled={!editable(selected)}>Piano roll</button></div></div></header>
      {selected.mode === 'piano' ? <PianoRoll noteClipboard={noteClipboard} onCopy={setNoteClipboard} root={game.root} scale={game.scale} key={selected.id} track={selected} onChange={changeNotes} onCutSelf={(cutSelf) => changeTrack(selected.id, { cutSelf })} onPreview={(pitch) => preview(selected, pitch)} locked={!editable(selected)} playhead={playhead} playing={playing} />
        : <div className="large-steps"><div className="steps-label"><Icon name="steps" size={19} />Step sequencer <span>1/16 grid</span></div><StepSequencer expanded track={selected} locked={!editable(selected)} playhead={playhead} playing={playing} onChange={changeNotes} onPreview={() => preview(selected)} /></div>}

      <div className="editor-bottom"><span>{selected.mode === 'piano' ? 'Click to add · Drag to move · Drag the right edge to resize · Hold right-click and sweep to erase' : 'Click to toggle · Hold right-click and sweep to erase · Space to play / pause'}</span><span>SPACE · PLAY / PAUSE</span></div>
    </section>
  </main></div><Queue game={game} remaining={remaining} listenProgress={listenProgress} />
  {game.phase === 'listen' && <div className="listen-banner"><Icon name="headphones" />{game.players[game.current].name}, listen to the beat<span>{Math.ceil(game.listenSeconds * (1 - listenProgress))}s</span>{!playing && <button className="text-button" onClick={onRetryListen}>Retry</button>}</div>}
  </>
}
