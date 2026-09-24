import { useCallback, useEffect, useMemo, useRef, useState } from 'react'
import { Navigate, Route, Routes, useLocation, useNavigate } from 'react-router-dom'
import usePlayback from './hooks/usePlayback'
import { beginTurn, constrainNote, createGame, createTrack, finishTurn, getInstrument, uid, updateTrack } from './game/model'
import Icon from './components/Icon'
import Modal from './components/Modal'
import Home from './pages/HomePage'
import Lobby from './pages/LobbyPage'
import Result from './pages/ResultPage'
import { SamplePicker, SoundSettings } from './components/SoundDialogs'
import Studio from './pages/StudioPage'
import { normalizeRoom, readRoom, roomKey } from './game/rooms'
import './App.css'

export default function App({ engineFactory } = {}) {
  const location = useLocation()
  const navigate = useNavigate()
  const screen = location.pathname.split('/')[1] || 'home'
  const routeCode = location.pathname.split('/')[2]
  const setScreen = useCallback((next) => navigate(next === 'home' ? '/' : `/${next}/${routeCode}`), [navigate, routeCode])
  const [form, setForm] = useState(null)
  const [name, setName] = useState('')
  const [joinCode, setJoinCode] = useState('')
  const [roomState, setRoom] = useState(() => readRoom(routeCode))
  const storedRoom = useMemo(() => readRoom(routeCode), [routeCode])
  const room = roomState?.code === routeCode ? roomState : storedRoom
  const [game, setGame] = useState(null)
  const [selectedId, setSelectedId] = useState(null)
  const [picker, setPicker] = useState(null)
  const [settings, setSettings] = useState(null)
  const [context, setContext] = useState(null)
  const [error, setError] = useState('')
  const [audioStatus, setAudioStatus] = useState('idle')
  const [remaining, setRemaining] = useState(30)
  const [masterVolume, setMasterVolume] = useState(65)
  const [confirmExit, setConfirmExit] = useState(false)
  const { audio, gameRef, prepareAudio, stop, pause, play, playing, playhead, listenProgress } = usePlayback(game, setError, engineFactory)
  const starting = useRef(false)
  const phase = game?.phase
  const currentPlayer = game?.current
  const deadline = game?.deadline
  const roomCode = room?.code
  const previousPath = useRef(location.pathname)

  // Keep a session in memory when using browser Back. Audio stops and editing time pauses.
  useEffect(() => {
    if (previousPath.current === location.pathname) return
    const wasStudio = previousPath.current.startsWith('/studio/')
    previousPath.current = location.pathname
    stop()
    const frame = requestAnimationFrame(() => {
    setForm(null); setPicker(null); setSettings(null); setContext(null); setConfirmExit(false)
    if (wasStudio && screen !== 'studio') {
      setGame((previous) => previous?.phase === 'edit' && previous.deadline ? { ...previous, pausedSeconds: Math.max(0, (previous.deadline - Date.now()) / 1000), deadline: null } : previous)
    } else if (screen === 'studio') {
      setGame((previous) => previous?.phase === 'edit' && previous.deadline === null ? { ...previous, deadline: Date.now() + (previous.pausedSeconds ?? previous.turnSeconds) * 1000 } : previous)
    }
    })
    return () => cancelAnimationFrame(frame)
  }, [location.pathname, screen, stop])

  useEffect(() => {
    if (phase !== 'edit' || screen !== 'studio' || deadline === null) return
    function tick() {
      const left = Math.max(0, (deadline - Date.now()) / 1000)
      setRemaining(left)
      if (left === 0) { stop(); setSelectedId(null); setGame((previous) => finishTurn(previous)) }
    }
    tick()
    const timer = setInterval(tick, 100)
    return () => clearInterval(timer)
  }, [phase, deadline, screen, stop])

  useEffect(() => {
    if (screen !== 'studio' || !phase) return
    const frame = requestAnimationFrame(() => {
      if (phase === 'listen') {
        setPicker(null); setSettings(null); setContext(null)
        play(false, () => setGame((previous) => beginTurn(previous)))
      } else if (phase === 'reveal') {
        stop(); setPicker(null); setSettings(null); setContext(null); setScreen('result')
      }
    })
    return () => { cancelAnimationFrame(frame); if (phase === 'listen') stop() }
  }, [phase, currentPlayer, screen, play, stop, setScreen])

  useEffect(() => {
    if (!context) return
    const close = () => setContext(null)
    const escape = (event) => { if (event.key === 'Escape') close() }
    window.addEventListener('pointerdown', close); window.addEventListener('keydown', escape)
    return () => { window.removeEventListener('pointerdown', close); window.removeEventListener('keydown', escape) }
  }, [context])

  const undo = useCallback(() => {
    setGame((previous) => previous?.phase === 'edit' && previous.history.length ? { ...previous, tracks: previous.history.at(-1), history: previous.history.slice(0, -1) } : previous)
  }, [])

  useEffect(() => {
    function handleKey(event) {
      if (screen !== 'studio' || phase !== 'edit' || form || picker || settings || confirmExit) return
      if (event.target.closest('input:not([type=checkbox]):not([type=range]), select, textarea, [contenteditable="true"]')) return
      if (event.code === 'Space') { event.preventDefault(); event.stopPropagation(); if (!event.repeat) { if (playing) pause(); else play() } }
      if ((event.ctrlKey || event.metaKey) && event.code === 'KeyD') event.preventDefault()
      if ((event.ctrlKey || event.metaKey) && event.code === 'KeyZ') { event.preventDefault(); event.stopPropagation(); if (!event.repeat) undo() }
    }
    window.addEventListener('keydown', handleKey, true)
    return () => window.removeEventListener('keydown', handleKey, true)
  }, [screen, phase, playing, play, pause, form, picker, settings, confirmExit, undo])

  function saveRoom(next) {
    try { localStorage.setItem(roomKey(next.code), JSON.stringify(next)); setRoom(next) }
    catch { setError('Could not save this lobby in your browser.') }
  }
  useEffect(() => {
    if (screen !== 'lobby' || !roomCode) return
    const sync = (event) => {
      if (event.key === roomKey(roomCode) && event.newValue) {
        try { const next = normalizeRoom(JSON.parse(event.newValue)); if (next) setRoom(next) } catch { /* Invalid stored room. */ }
      }
    }
    window.addEventListener('storage', sync)
    return () => window.removeEventListener('storage', sync)
  }, [screen, roomCode])

  function createRoom(event) {
    event.preventDefault()
    const alphabet = 'ABCDEFGHJKLMNPQRSTUVWXYZ23456789'
    const next = { code: Array.from(crypto.getRandomValues(new Uint8Array(6)), (n) => alphabet[n % alphabet.length]).join(''),
      players: [{ id: uid(), name: name.trim() || 'Player 1' }, { id: uid(), name: 'Player 2' }], bpm: 120, turnSeconds: 60, listenSeconds: 8 }
    try { localStorage.setItem(roomKey(next.code), JSON.stringify(next)) }
    catch { setError('Enable browser storage to create a lobby.'); return }
    setRoom(next); setForm(null); navigate(`/lobby/${next.code}`); setError('')
  }
  function joinRoom(event) {
    event.preventDefault()
    try {
      const saved = localStorage.getItem(roomKey(joinCode.toUpperCase().trim()))
      if (!saved) { setError('Lobby not found. Codes work only in this browser and on this device.'); return }
      const next = normalizeRoom(JSON.parse(saved))
      if (!next) { setError('This lobby is invalid. Create a new one.'); return }
      if (next.players.length >= 5) { setError('This lobby already has 5 players.'); return }
      if (!name.trim()) { setError('Enter your name.'); return }
      next.players.push({ id: uid(), name: name.trim() })
      localStorage.setItem(roomKey(next.code), JSON.stringify(next)); setRoom(next)
      setForm(null); navigate(`/lobby/${next.code}`); setError('')
    } catch { setError('Could not open the lobby. Create a new one.') }
  }
  async function startGame() {
    if (starting.current) return
    if (game?.code === room.code && game.phase !== 'reveal') { setScreen('studio'); return }
    if (room.players.length < 2 || room.players.length > 5 || room.players.some((player) => !player.name.trim())) { setError('Add 2 to 5 players with names.'); return }
    starting.current = true; setAudioStatus('loading'); setError('')
    const startPath = location.pathname
    try {
      await prepareAudio(); audio.current.setVolume(masterVolume / 100); setAudioStatus('ready')
      if (previousPath.current !== startPath) return
      const next = createGame(room)
      setGame(next); setSelectedId(next.tracks[0].id); setRemaining(room.turnSeconds); setScreen('studio')
    } catch (cause) { setError(cause.message); setAudioStatus('error') }
    finally { starting.current = false }
  }

  const selected = game?.tracks.find((track) => track.id === selectedId)
    ?? game?.tracks.find((track) => track.ownerId === game.players[game.current].id) ?? game?.tracks[0]
  const editable = (track) => !!track && game?.phase === 'edit'
  function changeTrack(id, update) {
    if (update.notes) update = { ...update, notes: update.notes.map(constrainNote) }
    setGame((previous) => updateTrack(previous, id, update))
    if ('volume' in update || 'muted' in update) {
      const track = game.tracks.find((item) => item.id === id)
      if (editable(track)) audio.current.setChannelVolume(id, (update.muted ?? track.muted) ? 0 : (update.volume ?? track.volume))
    }
  }
  async function preview(track, pitch = 0) {
    if (gameRef.current?.phase === 'listen') return
    try { await audio.current.play(track.instrumentId, track.sampleId, {
      semitones: pitch + track.transpose, channelId: `preview-${track.id}`, volume: track.volume,
      duration: 0.25, pitched: true,
    }) } catch (cause) { setError(cause.message) }
  }
  function chooseSound(instrumentId, sampleId) {
    if (gameRef.current?.phase !== 'edit') { setPicker(null); return }
    if (picker === 'add') {
      const track = createTrack(instrumentId, game.players[game.current].id, sampleId)
      setGame((previous) => previous.tracks.length >= 16 ? previous : ({ ...previous, history: [...previous.history.slice(-39), previous.tracks], tracks: [...previous.tracks, track] }))
      setSelectedId(track.id)
    } else changeTrack(picker, { instrumentId, sampleId, mode: getInstrument(instrumentId).pitched ? 'piano' : 'steps', cutSelf: !!getInstrument(instrumentId).pitched })
    setPicker(null)
  }
  function exit() { stop(); setGame(null); setScreen('home'); setConfirmExit(false); setError('') }
  const settingsTrack = game?.tracks.find((track) => track.id === settings)
  return <div className={`app screen-${screen}`}>
    <Routes>
    <Route path="/" element={<Home onCreate={() => { setForm('create'); setError('') }} onJoin={() => { setForm('join'); setError('') }} />} />
    <Route path="/lobby/:code" element={room && room.code === routeCode ? <Lobby room={room} onChange={saveRoom} onBack={() => setScreen('home')} onStart={startGame} loading={audioStatus === 'loading'} resume={game?.code === room.code && game.phase !== 'reveal'} onError={setError} /> : <Navigate to="/" replace />} />
    <Route path="/studio/:code" element={game?.code === routeCode && selected ? <Studio game={game} selected={selected} selectedId={selected.id} setSelectedId={setSelectedId}
      playing={playing} playhead={playhead} listenProgress={listenProgress} remaining={remaining} masterVolume={masterVolume}
      onVolume={(value) => { setMasterVolume(value); audio.current.setVolume(value / 100) }}
      onBpm={(bpm) => { stop(); setGame((previous) => ({ ...previous, bpm })) }}
      onPlay={() => playing ? pause() : play()} onStop={stop} onExit={() => setConfirmExit(true)}
      onFinish={() => { stop(); setSelectedId(null); setGame((previous) => finishTurn(previous)) }} editable={editable} changeTrack={changeTrack}
      preview={preview} setSettings={setSettings} setContext={setContext} onAdd={() => setPicker('add')} onUndo={undo}
      onRetryListen={() => { setError(''); play(false, () => setGame((previous) => beginTurn(previous))) }} /> : <Navigate to={room?.code === routeCode ? `/lobby/${routeCode}` : '/'} replace />} />
    <Route path="/result/:code" element={game && game.code === routeCode && game.phase === 'reveal' ? <Result game={game} playing={playing} onPlay={() => playing ? pause() : play()}
      onAgain={() => { stop(); setScreen('lobby'); setGame(null) }} onHome={exit} /> : <Navigate to={room?.code === routeCode ? `/lobby/${routeCode}` : '/'} replace />} />
    <Route path="*" element={<Navigate to="/" replace />} />
    </Routes>
    {error && !form && <div className="error-toast" role="alert">{error}<button className="icon-button" aria-label="Dismiss message" onClick={() => setError('')}><Icon name="close" size={14} /></button></div>}
    {form && <Modal title={form === 'create' ? 'Create a lobby' : 'Join a lobby'} onClose={() => { setForm(null); setError('') }}>
      {error && <p className="form-error" role="alert">{error}</p>}
      <form className="entry-form" onSubmit={form === 'create' ? createRoom : joinRoom}><label>Your name<input autoFocus value={name} onChange={(event) => setName(event.target.value)} maxLength={20} placeholder="What should we call you?" required /></label>{form === 'join' && <label>Lobby code<input value={joinCode} onChange={(event) => setJoinCode(event.target.value.toUpperCase())} maxLength={6} placeholder="ABC123" required /></label>}<p className="small-note">Local play on one shared device.{form === 'join' ? ' The code works in this browser.' : ''}</p><button className="button primary" type="submit">{form === 'create' ? 'Create lobby' : 'Join a lobby'}<Icon name="arrow" /></button></form>
    </Modal>}
    {picker && <SamplePicker onClose={() => setPicker(null)} onChoose={chooseSound} title={picker === 'add' ? 'Add sound' : 'Change sound'} />}
    {settingsTrack && <SoundSettings track={settingsTrack} locked={!editable(settingsTrack)} onClose={() => setSettings(null)} onChange={(update) => changeTrack(settingsTrack.id, update)} onPreview={() => preview(settingsTrack)} onChooseSound={() => { setSettings(null); setPicker(settingsTrack.id) }} />}
    {context && <div className="context-menu" role="menu" style={{ left: context.x, top: context.y }} onPointerDown={(event) => event.stopPropagation()}><button role="menuitem" disabled={!editable(game.tracks.find((track) => track.id === context.id))} onClick={() => { setPicker(context.id); setContext(null) }}><Icon name="music" size={15} />Change sound</button><button role="menuitem" onClick={() => { setSettings(context.id); setContext(null) }}><Icon name="settings" size={15} />Settings</button><button role="menuitem" disabled={!editable(game.tracks.find((track) => track.id === context.id)) || game.tracks.length === 1} onClick={() => { const id = context.id; setGame((previous) => ({ ...previous, history: [...previous.history.slice(-39), previous.tracks], tracks: previous.tracks.filter((track) => track.id !== id) })); setContext(null) }}><Icon name="trash" size={15} />Remove track</button></div>}
    {confirmExit && <Modal title="Leave this session?" onClose={() => setConfirmExit(false)}><p className="modal-copy">Your current beat will be discarded.</p><div className="modal-actions"><button className="button secondary" onClick={() => setConfirmExit(false)}>Keep creating</button><button className="button primary" onClick={exit}>Leave session</button></div></Modal>}
  </div>
}
