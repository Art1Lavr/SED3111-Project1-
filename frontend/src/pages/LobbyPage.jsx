import { useState } from 'react'
import { NOTE_NAMES } from '../game/harmony'
import Brand from '../components/Brand'
import Icon from '../components/Icon'
import { uid, PLAYER_COLORS } from '../game/model'
import { formatTime, LISTEN_LENGTHS, TURN_LENGTHS, BEGINNER_TURN_LENGTHS } from '../game/rooms'

export default function LobbyPage({ room, onChange, onBack, onStart, loading, resume, onError }) {
  const beginner = room.mode === 'beginner'
  const turnLengths = beginner ? BEGINNER_TURN_LENGTHS : TURN_LENGTHS
  const [copied, setCopied] = useState(false)
  async function copyCode() {
    try { await navigator.clipboard.writeText(room.code); setCopied(true) }
    catch { onError('Could not copy the code. You can enter it manually.') }
  }
  return <>
    <header className="landing-header"><Brand onClick={onBack} /><button className="text-button" onClick={onBack}><Icon name="back" />Back to home</button></header>
    <main className="session-lobby">
      <div className="session-title"><span className="mini-vinyl" aria-hidden="true" /><div className="section-kicker">YOUR SESSION</div><h1>Everyone brings <span>a little rhythm.</span></h1><p>Add your people. Set the mood. Make it yours.</p></div>
      <div className="session-codebar"><span><span className="live-dot" />Local lobby <small>One browser. One shared device.</small></span><button onClick={copyCode} aria-label="Copy lobby code"><span>{room.code}</span><Icon name={copied ? 'check' : 'copy'} size={16} /><small>{copied ? 'Copied' : 'Copy code'}</small></button></div>
      {resume && <p className="resume-note">Your session is paused. Resume to keep creating.</p>}
      <fieldset disabled={loading || resume} className="session-board">
        <section className="session-players"><div className="panel-heading"><h2><span>01</span> The people</h2><span>{room.players.length} / 5</span></div><p className="section-description">Your names, in playing order.</p>
          <div className="lobby-players">{room.players.map((player, index) => <div className="lobby-player" key={player.id} style={{ '--player-color': PLAYER_COLORS[index] }}>
            <span className="player-avatar">{String(index + 1).padStart(2, '0')}</span><input aria-label={`Player name ${index + 1}`} value={player.name} maxLength={20} onChange={(event) => onChange({ ...room, players: room.players.map((item) => item.id === player.id ? { ...item, name: event.target.value } : item) })} />
            {index === 0 ? <span className="host-tag">Host</span> : <button className="icon-button" onClick={() => onChange({ ...room, players: room.players.filter((item) => item.id !== player.id) })} aria-label={`Remove ${player.name}`}><Icon name="close" size={15} /></button>}
          </div>)}</div>
          <button className="add-player" disabled={room.players.length >= 5 || loading} onClick={() => onChange({ ...room, players: [...room.players, { id: uid(), name: `Player ${room.players.length + 1}` }] })}><Icon name="plus" size={16} />Add player</button>
        </section>
        <section className="session-settings"><div className="panel-heading"><h2><span>02</span> The sound</h2><Icon name="music" size={17} /></div><p className="section-description">A starting point for your shared beat.</p>
          <div className="session-fields">
            <label className="wide-field">Mode<select value={room.mode ?? 'standard'} onChange={event => onChange({ ...room, mode: event.target.value })}><option value="standard">Standard</option><option value="beginner">Beginner</option></select></label>
            {beginner && <p className="section-description wide-field">Ready-made patterns. Pitch lock: C D E G A.</p>}
            <label>Tempo<span className="tempo-field"><input aria-label="Lobby tempo" type="number" min="60" max="180" key={room.bpm} defaultValue={room.bpm} onBlur={(event) => { const bpm = Math.max(60, Math.min(180, Number(event.target.value) || 120)); event.target.value = bpm; onChange({ ...room, bpm }) }} /><span>BPM</span></span></label>
            <label>Key<select disabled={beginner} value={beginner ? 0 : room.root ?? 0} onChange={(event) => onChange({ ...room, root: event.target.value === 'any' ? 'any' : Number(event.target.value) })}><option value="any">Any</option>{NOTE_NAMES.map((name, index) => <option key={name} value={index}>{name}</option>)}</select></label>
            <label className="wide-field">Mood / scale<select disabled={beginner} value={beginner ? 'pentatonic' : room.scale ?? 'major'} onChange={(event) => onChange({ ...room, scale: event.target.value })}><option value="any">Any</option>{beginner && <option value="pentatonic">Major pentatonic</option>}<option value="major">Major · Happy</option><option value="minor">Minor · Sad</option></select></label>
            <label>Turn length<select value={room.turnSeconds} onChange={(event) => onChange({ ...room, turnSeconds: Number(event.target.value) })}>{turnLengths.map((seconds) => <option key={seconds} value={seconds}>{formatTime(seconds)}</option>)}</select></label>
            <label>Listen between turns<select value={room.listenSeconds ?? 8} onChange={(event) => onChange({ ...room, listenSeconds: Number(event.target.value) })}>{LISTEN_LENGTHS.map((seconds) => <option key={seconds} value={seconds}>{formatTime(seconds)}</option>)}</select></label>
          </div>
        </section>
      </fieldset>
      <div className="session-bottom"><p><strong>One beat. Everyone can edit.</strong><span>2 bars · Take turns, then listen together.</span></p><button className="button primary start-game" disabled={loading || room.players.length < 2} onClick={onStart}>{loading ? 'Loading sounds…' : resume ? 'Resume session' : 'Start session'}<Icon name="arrow" size={18} /></button></div>
    </main>
  </>
}
