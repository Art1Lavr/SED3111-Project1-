import { useEffect, useRef, useState } from 'react'
import Brand from '../components/Brand'
import Icon from '../components/Icon'
import Knob from '../components/Knob'
import StepSequencer from '../components/StepSequencer'
import PianoRoll from '../components/PianoRoll'
import MelodySelector from '../components/MelodySelector'
import Queue from '../components/Queue'
import { getInstrument, getSample, loopSeconds, MELODY_CATEGORIES, MELODY_PRESETS, MIN_NOTE, STEPS } from '../game/model'

export default function StudioPage({ game, isBeginner = false, selected, selectedId, setSelectedId, playing, playhead, listenProgress, remaining, masterVolume,
  onVolume, onBpm, onPlay, onStop, onExit, onFinish, editable, changeTrack, preview, previewPattern, onSelectPreset, onRemovePreset, onStarterBeatChange, setSettings, setContext, onAdd, onChangeSound, onUndo, onRetryListen }) {
  const changeNotes = (notes) => changeTrack(selected.id, { notes })
  const [noteClipboard, setNoteClipboard] = useState([])
  const [categoryId, setCategoryId] = useState(MELODY_CATEGORIES[0].id)
  const [addInstrumentOpen, setAddInstrumentOpen] = useState(true)
  const [activeTrackIds, setActiveTrackIds] = useState([])
  const lastPlaybackStep = useRef(-1)
  const activityTimer = useRef(null)
  const currentOwnerId = game.players[game.current].id
  const addedGroups = Object.values(game.tracks.reduce((groups, track) => {
    if (track.presetInstanceId && track.ownerId === currentOwnerId) {
      groups[track.presetInstanceId] ??= { id: track.presetInstanceId, tracks: [] }
      groups[track.presetInstanceId].tracks.push(track)
    }
    return groups
  }, {}))
  const addedPresetIds = new Set(addedGroups.map((group) => group.tracks[0].presetId))
  useEffect(() => () => clearTimeout(activityTimer.current), [])
  useEffect(() => {
    if (!playing) {
      clearTimeout(activityTimer.current)
      lastPlaybackStep.current = -1
      activityTimer.current = setTimeout(() => setActiveTrackIds([]), 0)
      return
    }
    const ticksPerLoop = STEPS / MIN_NOTE
    const stepIndex = Math.floor((playhead + MIN_NOTE * 0.45) / MIN_NOTE) % ticksPerLoop
    if (stepIndex === lastPlaybackStep.current) return
    lastPlaybackStep.current = stepIndex
    const position = stepIndex * MIN_NOTE
    const hasSoloTracks = game.tracks.some((track) => track.solo)
    const activeIds = game.tracks.filter((track) => !track.muted && (!hasSoloTracks || track.solo) && track.notes.some((note) => note.start === position)).map((track) => track.id)
    if (activeIds.length) {
      clearTimeout(activityTimer.current)
      activityTimer.current = setTimeout(() => {
        setActiveTrackIds(activeIds)
        activityTimer.current = setTimeout(() => setActiveTrackIds([]), 220)
      }, 0)
    }
  }, [game.tracks, playhead, playing])
  const transportBar = <header className={`transport-bar ${isBeginner ? 'beginner-transport' : ''}`}><Brand small onClick={onExit} />{isBeginner && <><span className="beginner-mode-badge">🔰 BEGINNER MODE</span><label className="starter-beat-control"><input type="checkbox" checked={game.starterBeatOn} disabled={game.phase !== 'edit'} onChange={(event) => onStarterBeatChange(event.target.checked)} /><span className="starter-beat-switch" /><span>Starter Beat <strong>{game.starterBeatOn ? 'On' : 'Off'}</strong></span></label></>}<span className="toolbar-divider" />
    <div className="transport-buttons"><button className={`transport-play ${playing ? 'active' : ''}`} disabled={game.phase === 'listen'} onClick={onPlay} aria-label={playing ? 'Pause playback' : 'Play'}><Icon name={playing ? 'pause' : 'play'} /></button><button className="icon-button" disabled={game.phase === 'listen'} onClick={onStop} aria-label="Stop"><Icon name="stop" size={16} /></button></div>
    <label className="bpm-control"><input type="number" aria-label="BPM" min="60" max="180" value={game.bpm} disabled={game.phase !== 'edit'} onChange={(event) => onBpm(Math.max(60, Math.min(180, Number(event.target.value) || 120)))} /><span>BPM</span></label>
    <div className="transport-position"><strong>{String(Math.floor(playhead / 8) + 1).padStart(2, '0')}<i>:</i>{String(Math.floor(playhead % 8 / 2) + 1).padStart(2, '0')}</strong><span>2 BARS · {loopSeconds(game.bpm).toFixed(1)} SEC</span></div>
    <div className="transport-spacer" /><div className="master-volume"><Icon name="volume" size={16} /><input aria-label="Master volume" type="range" min="0" max="100" value={masterVolume} onChange={(event) => onVolume(Number(event.target.value))} /></div>
    <button className="button primary pass-button" disabled={game.phase !== 'edit'} onClick={onFinish}>{game.phase === 'listen' ? 'Listening…' : game.current === game.players.length - 1 ? 'Finish session' : 'Pass the beat'}<Icon name="arrow" size={16} /></button>
  </header>
  if (isBeginner) return <>{transportBar}
    <div className="beginner-mode-banner">🔰 BEGINNER MODE — Build with the grid or add a ready-made segment.</div>
    <div className="workspace beginner-workspace">
      <aside className="beginner-instrument-sidebar">
        <div className="beginner-sidebar-title"><span>ACTIVE CHANNELS</span><span>{game.tracks.length}</span></div>
        <div className="beginner-active-channels">{game.tracks.map((track) => {
          const instrument = getInstrument(track.instrumentId)
          const categoryIdForTrack = track.presetCategory ?? (track.instrumentId === 'bass' ? 'bass' : ['kick', 'snare', 'hat', 'clap'].includes(track.instrumentId) ? 'drums' : 'keys')
          const category = MELODY_CATEGORIES.find((item) => item.id === categoryIdForTrack)
          return <div className={`beginner-channel-item ${selected.id === track.id ? 'active' : ''} ${activeTrackIds.includes(track.id) ? 'sound-active' : ''}`} key={track.id}>
            <button className="beginner-channel-select" onClick={() => setSelectedId(track.id)} aria-pressed={selected.id === track.id}>
              <span aria-hidden="true">{category?.icon}</span><strong>{track.presetStyle ?? instrument.name}</strong><small>{getSample(track).name} · {track.notes.length} notes</small>
            </button>
            <div className="beginner-channel-toggles">
              <button className="track-quick-toggle" aria-label={track.muted ? `Unmute ${instrument.name}` : `Mute ${instrument.name}`} aria-pressed={track.muted} onClick={() => changeTrack(track.id, { muted: !track.muted })}>M</button>
              <button className="track-quick-toggle" aria-label={track.solo ? `Unsolo ${instrument.name}` : `Solo ${instrument.name}`} aria-pressed={!!track.solo} onClick={() => changeTrack(track.id, { solo: !track.solo })}>S</button>
            </div>
            {track.presetInstanceId && <button className="beginner-channel-remove" aria-label={`Remove ${track.presetStyle}`} onClick={() => onRemovePreset(track.presetInstanceId)}>×</button>}
          </div>
        })}</div>
        <button className="beginner-add-instrument-toggle" aria-expanded={addInstrumentOpen} onClick={() => setAddInstrumentOpen((open) => !open)}><Icon name="plus" size={16} />Add Instrument</button>
        {addInstrumentOpen && <nav className="beginner-category-list" aria-label="Add instrument category">
          {MELODY_CATEGORIES.map((category) => <button key={category.id} className={categoryId === category.id ? 'active' : ''} aria-current={categoryId === category.id ? 'page' : undefined} disabled={game.phase !== 'edit'} onClick={() => setCategoryId(category.id)}>
            <span aria-hidden="true">{category.icon}</span><strong>{category.title}</strong><small>{MELODY_PRESETS.filter((preset) => preset.category === category.id).length} segments</small>
          </button>)}
        </nav>}
      </aside>
      <main className="editor-main beginner-library-main">
        <section className="arrangement beginner-arrangement"><div className="section-topline"><span>YOUR ARRANGEMENT</span><span>{game.tracks.reduce((sum, track) => sum + track.notes.length, 0)} notes · 2 bars</span></div>
          <div className="arrangement-scroll"><div className="arrangement-ruler"><span /><div>{Array.from({ length: 16 }, (_, i) => <span key={i}>{i % 2 === 0 ? i / 2 + 1 : '·'}</span>)}</div></div>
            {game.tracks.map((track) => <div key={track.id} className={`arrangement-row ${selected.id === track.id ? 'selected' : ''}`} style={{ '--track-color': getInstrument(track.instrumentId).color }}>
              <button className="arrangement-label" onClick={() => setSelectedId(track.id)}><span className="color-dot" />{track.presetStyle ?? getInstrument(track.instrumentId).name}</button>
              {track.mode === 'steps'
                ? <StepSequencer track={track} locked={game.phase !== 'edit'} playhead={playhead} playing={playing} onSelect={() => setSelectedId(track.id)} onChange={(notes) => changeTrack(track.id, { notes })} isBeginner />
                : <button className="mini-roll" aria-label={`Edit ${track.presetStyle ?? getInstrument(track.instrumentId).name} in piano roll`} onClick={() => setSelectedId(track.id)}>{track.notes.map((note) => <i key={note.id} style={{ left: `${note.start / 16 * 100}%`, width: `${note.length / 16 * 100}%`, top: `${(12 - note.pitch) / 24 * 75}%` }} />)}{!track.notes.length && <span>Click to edit notes</span>}{playing && <b style={{ left: `${playhead / 16 * 100}%` }} />}</button>}
            </div>)}
          </div>
        </section>
        <section className="active-editor beginner-active-editor" style={{ '--track-color': getInstrument(selected.instrumentId).color }}>
          <header className="editor-heading"><div><span className="color-dot" /><h2>{selected.presetStyle ?? getInstrument(selected.instrumentId).name}</h2><span className="editor-sample">/ {getSample(selected).name}</span></div><div className="editor-tools"><button className="icon-button" disabled={!game.history.length || game.phase !== 'edit'} onClick={onUndo} title="Undo · Ctrl+Z" aria-label="Undo"><Icon name="undo" size={15} /></button><button className="icon-button" disabled={!selected.notes.length || game.phase !== 'edit'} onClick={() => changeNotes([])} title="Clear track" aria-label="Clear track"><Icon name="trash" size={15} /></button></div></header>
          {selected.mode === 'piano'
            ? <PianoRoll track={selected} onChange={changeNotes} onPreview={(pitch) => preview(selected, pitch)} onCutSelf={(cutSelf) => changeTrack(selected.id, { cutSelf })} locked={game.phase !== 'edit'} playhead={playhead} playing={playing} isBeginner />
            : <div className="large-steps"><div className="steps-label"><Icon name="steps" size={19} />Drum grid <span>2 bars</span></div><StepSequencer track={selected} locked={game.phase !== 'edit'} playhead={playhead} playing={playing} onChange={changeNotes} onPreview={() => preview(selected)} expanded isBeginner /></div>}
        </section>
        <section className="beginner-segment-section"><MelodySelector categoryId={categoryId} locked={game.phase !== 'edit'} addedPresetIds={addedPresetIds} onSelect={onSelectPreset} onPreview={previewPattern} /></section>
      </main>
    </div>
    <Queue game={game} remaining={remaining} listenProgress={listenProgress} />
    {game.phase === 'listen' && <div className="listen-banner"><Icon name="headphones" />{game.players[game.current].name}, listen to the beat<span>{Math.ceil(game.listenSeconds * (1 - listenProgress))}s</span>{!playing && <button className="text-button" onClick={onRetryListen}>Retry</button>}</div>}
  </>
  return <>{transportBar}
  {isBeginner && <div className="beginner-mode-banner">🔰 BEGINNER MODE — Pick a melody pattern to add to the beat!</div>}
  {isBeginner && game.phase === 'edit' && <section className="beginner-mix-summary" aria-label="Your added sounds">
    <header><strong>Your Added Sounds</strong><span>{addedGroups.length} {addedGroups.length === 1 ? 'sequence' : 'sequences'}</span></header>
    {addedGroups.length ? <div className="beginner-mix-list">{addedGroups.map((group) => {
      const firstTrack = group.tracks[0]
      const preset = MELODY_PRESETS.find((item) => item.id === firstTrack.presetId)
      const category = MELODY_CATEGORIES.find((item) => item.id === preset?.category)
      const instruments = [...new Set(group.tracks.map((track) => getInstrument(track.instrumentId).name))].join(' + ')
      return <div className="beginner-mix-item" key={group.id}><span>{category?.icon} {instruments} — {firstTrack.presetStyle}</span><button className="text-button" onClick={() => onRemovePreset(group.id)} aria-label={`Remove ${firstTrack.presetStyle}`}><Icon name="trash" size={13} />Remove</button></div>
    })}</div> : <p>Nothing added yet. Choose a sequence below to start layering your song.</p>}
  </section>}
  <div className="workspace"><aside className="track-sidebar"><div className="sidebar-heading"><span>CHANNELS</span><span>{game.tracks.length.toString().padStart(2, '0')}</span></div>
    <div className="track-list">{game.tracks.map((track, index) => {
      const instrument = getInstrument(track.instrumentId), locked = !editable(track)
      return <div key={track.id} className={`track-card ${selectedId === track.id ? 'selected' : ''} ${locked ? 'locked' : ''} ${activeTrackIds.includes(track.id) ? 'sound-active' : ''}`} style={{ '--track-color': instrument.color }}
        role="button" tabIndex={0} aria-label={`${instrument.name}: ${getSample(track).name}${locked ? ', locked contribution' : ''}`} aria-pressed={selectedId === track.id}
        onClick={() => setSelectedId(track.id)} onDoubleClick={() => { if (!isBeginner) setSettings(track.id) }}
        onKeyDown={(event) => { if (event.target !== event.currentTarget) return; if (event.key === 'Enter' || event.key === ' ') { event.preventDefault(); setSelectedId(track.id) } if (!isBeginner && event.key === 'F2') setSettings(track.id) }}
        onContextMenu={(event) => { event.preventDefault(); if (!isBeginner) { setSelectedId(track.id); setContext({ id: track.id, x: Math.max(0, Math.min(event.clientX, window.innerWidth - 220)), y: Math.max(0, Math.min(event.clientY, window.innerHeight - 180)) }) } }}>
        <div className="track-card-heading"><span className="track-index">{String(index + 1).padStart(2, '0')}</span><span className="track-name">{instrument.name}</span>{!isBeginner && <><button className={`track-quick-toggle ${track.muted ? 'active' : ''}`} disabled={locked} aria-label={track.muted ? `Unmute ${instrument.name}` : `Mute ${instrument.name}`} aria-pressed={track.muted} onClick={(event) => { event.stopPropagation(); changeTrack(track.id, { muted: !track.muted }) }}>M</button><button className={`track-quick-toggle ${track.solo ? 'active' : ''}`} disabled={locked} aria-label={track.solo ? `Unsolo ${instrument.name}` : `Solo ${instrument.name}`} aria-pressed={!!track.solo} onClick={(event) => { event.stopPropagation(); changeTrack(track.id, { solo: !track.solo }) }}>S</button>{locked ? <Icon name="lock" size={12} /> : <button className="icon-button tiny" aria-label={`Configure ${instrument.name}`} onClick={(event) => { event.stopPropagation(); setSettings(track.id) }}><Icon name="more" size={15} /></button>}</>}</div>
        <div className="track-card-main"><button className="track-symbol" aria-label={`Preview ${getSample(track).name}`} onClick={(event) => { event.stopPropagation(); preview(track) }}><Icon name={instrument.pitched ? 'piano' : 'steps'} size={27} /></button>{!isBeginner && <Knob label={`Volume ${instrument.name}, track ${index + 1}`} value={track.volume} disabled={locked} onChange={(volume) => changeTrack(track.id, { volume })} />}</div>
        <span className="sample-name">{getSample(track).name}</span>{!isBeginner && <div className="track-bottom"><div className="mini-mode"><button aria-label={`Steps: track ${index + 1}`} aria-pressed={track.mode === 'steps'} disabled={locked} onClick={(event) => { event.stopPropagation(); changeTrack(track.id, { mode: 'steps' }); setSelectedId(track.id) }}><Icon name="steps" size={12} /></button><button aria-label={`Piano roll: track ${index + 1}`} aria-pressed={track.mode === 'piano'} disabled={locked} onClick={(event) => { event.stopPropagation(); changeTrack(track.id, { mode: 'piano' }); setSelectedId(track.id) }}><Icon name="piano" size={12} /></button></div></div>}
      </div>
    })}</div><button className="add-track" disabled={game.phase !== 'edit' || game.tracks.length >= 16} onClick={onAdd}><Icon name="plus" size={16} />{isBeginner ? 'Add instrument' : 'Add sound'}</button>
  </aside><main className="editor-main">
    <section className="arrangement"><div className="section-topline"><span>THE SHARED BEAT</span><span>{game.tracks.reduce((sum, track) => sum + track.notes.length, 0)} notes<span className="faint"> / 2 bars</span></span></div>
      <div className="arrangement-scroll"><div className="arrangement-ruler"><span /><div>{Array.from({ length: 16 }, (_, i) => <span key={i}>{i % 2 === 0 ? i / 2 + 1 : '·'}</span>)}</div></div>
        {game.tracks.map((track) => <div key={track.id} className={`arrangement-row ${selected.id === track.id ? 'selected' : ''}`} style={{ '--track-color': getInstrument(track.instrumentId).color }}>
          <button className="arrangement-label" onClick={() => setSelectedId(track.id)}><span className="color-dot" />{getInstrument(track.instrumentId).name}{!editable(track) && <Icon name="lock" size={10} />}</button>
          {track.mode === 'steps' ? <StepSequencer track={track} locked={!editable(track)} playhead={playhead} playing={playing} onSelect={() => setSelectedId(track.id)} onChange={(notes) => changeTrack(track.id, { notes })} isBeginner={isBeginner} />
            : <button className="mini-roll" aria-label={`Open piano roll ${getInstrument(track.instrumentId).name}`} onClick={() => setSelectedId(track.id)}>{track.notes.map((note) => <i key={note.id} style={{ left: `${note.start / 16 * 100}%`, width: `${note.length / 16 * 100}%`, top: `${(12 - note.pitch) / 24 * 75}%` }} />)}{!track.notes.length && <span>+ Add notes</span>}{playing && <b style={{ left: `${playhead / 16 * 100}%` }} />}</button>}
        </div>)}
      </div>
    </section>
    <section className="active-editor" style={{ '--track-color': getInstrument(selected.instrumentId).color }}>
      <header className="editor-heading"><div><span className="color-dot" /><h2>{getInstrument(selected.instrumentId).name}</h2><span className="editor-sample">/ {getSample(selected).name}</span>{!editable(selected) && <span className="locked-tag"><Icon name="lock" size={11} />Locked</span>}</div><div className="editor-tools">{isBeginner && <button className="text-button change-sound-button" disabled={!editable(selected)} onClick={onChangeSound}><Icon name="music" size={14} />Change sound</button>}<button className="icon-button" disabled={!editable(selected) || !game.history.length} onClick={onUndo} title="Undo · Ctrl+Z" aria-label="Undo"><Icon name="undo" size={15} /></button><button className="icon-button" disabled={!editable(selected) || !selected.notes.length} onClick={() => changeNotes([])} title="Clear track" aria-label="Clear track"><Icon name="trash" size={15} /></button>{!isBeginner && <div className="mode-switch"><button className={selected.mode === 'steps' ? 'active' : ''} onClick={() => changeTrack(selected.id, { mode: 'steps' })} disabled={!editable(selected)}>Steps</button><button className={selected.mode === 'piano' ? 'active' : ''} onClick={() => changeTrack(selected.id, { mode: 'piano' })} disabled={!editable(selected)}>Piano roll</button></div>}</div></header>
      {selected.mode === 'piano' && isBeginner ? <MelodySelector locked={!editable(selected)} addedPresetIds={addedPresetIds} onSelect={onSelectPreset} onPreview={previewPattern} />
        : selected.mode === 'piano' ? <PianoRoll noteClipboard={noteClipboard} onCopy={setNoteClipboard} root={game.root} scale={game.scale} isBeginner={isBeginner} key={selected.id} track={selected} onChange={changeNotes} onCutSelf={(cutSelf) => changeTrack(selected.id, { cutSelf })} onPreview={(pitch) => preview(selected, pitch)} locked={!editable(selected)} playhead={playhead} playing={playing} />
        : <div className="large-steps"><div className="steps-label"><Icon name="steps" size={19} />Step sequencer <span>{isBeginner ? 'Simple mode' : '1/16 grid'}</span></div><StepSequencer expanded track={selected} locked={!editable(selected)} playhead={playhead} playing={playing} onChange={changeNotes} onPreview={() => preview(selected)} isBeginner={isBeginner} /></div>}

      <div className="editor-bottom"><span>{isBeginner ? 'Build a melody with the highlighted C, D, E, G, and A notes.' : selected.mode === 'piano' ? 'Click to add · Drag to move · Drag the right edge to resize · Hold right-click and sweep to erase' : 'Click to toggle · Hold right-click and sweep to erase · Space to play / pause'}</span><span>SPACE · PLAY / PAUSE</span></div>
    </section>
  </main></div><Queue game={game} remaining={remaining} listenProgress={listenProgress} />
  {game.phase === 'listen' && <div className="listen-banner"><Icon name="headphones" />{game.players[game.current].name}, listen to the beat<span>{Math.ceil(game.listenSeconds * (1 - listenProgress))}s</span>{!playing && <button className="text-button" onClick={onRetryListen}>Retry</button>}</div>}
  </>
}
