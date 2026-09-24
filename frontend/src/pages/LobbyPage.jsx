import { useState } from 'react'
import { NOTE_NAMES } from '../game/harmony'
import Brand from '../components/Brand'
import Icon from '../components/Icon'
import { uid, PLAYER_COLORS } from '../game/model'
import { formatTime, LISTEN_LENGTHS, TURN_LENGTHS } from '../game/rooms'

export default function LobbyPage({ room, onChange, onBack, onStart, loading, resume, onError }) {
  const [copied, setCopied] = useState(false)
  return <><header className="landing-header"><Brand onClick={onBack} /><button className="text-button" onClick={onBack}><Icon name="back" />Back to home</button></header>
    <main className="lobby-main"><div className="section-kicker">SET THE SESSION</div>
      <div className="lobby-title"><div><h1>Ready when you are.</h1><p>Pick your players. Set the pace. Pass the beat.</p></div><span className="local-badge">Local session</span></div>
      {resume && <p className="resume-note">Your session is paused. Resume to keep creating, or finish it before changing the setup.</p>}<fieldset disabled={loading || resume} className="lobby-layout"><section className="players-panel"><div className="panel-heading"><h2>Players</h2><span>{room.players.length} / 5</span></div>
        <div className="lobby-players">{room.players.map((player, index) => <div className="lobby-player" key={player.id} style={{ '--player-color': PLAYER_COLORS[index] }}>
          <span className="player-avatar">{index + 1}</span><input aria-label={`Player name ${index + 1}`} value={player.name} maxLength={20} onChange={(event) => onChange({ ...room, players: room.players.map((item) => item.id === player.id ? { ...item, name: event.target.value } : item) })} />
          {index === 0 ? <span className="host-tag">Host</span> : <button className="icon-button" onClick={() => onChange({ ...room, players: room.players.filter((item) => item.id !== player.id) })} aria-label={`Remove ${player.name}`}><Icon name="close" size={15} /></button>}
        </div>)}</div><button className="add-player" disabled={room.players.length >= 5 || loading} onClick={() => onChange({ ...room, players: [...room.players, { id: uid(), name: `Player ${room.players.length + 1}` }] })}><Icon name="plus" />Add player</button>
      </section><aside className="room-panel"><span className="section-kicker">LOBBY CODE</span>
        <button className="room-code" onClick={async () => { try { await navigator.clipboard.writeText(room.code); setCopied(true) } catch { onError('Could not copy the code. You can enter it manually.') } }}>{room.code}<Icon name={copied ? 'check' : 'copy'} /></button><p className="small-note">Join on this browser and device.</p>
        <div className="room-settings"><label>Tempo<span><input aria-label="Lobby tempo" type="number" min="60" max="180" key={room.bpm} defaultValue={room.bpm} onBlur={(event) => onChange({ ...room, bpm: Math.max(60, Math.min(180, Number(event.target.value) || 120)) })} /> BPM</span></label><label>Key<select value={room.root ?? 0} onChange={(event) => onChange({ ...room, root: Number(event.target.value) })}>{NOTE_NAMES.map((name, index) => <option key={name} value={index}>{name}</option>)}</select></label><label>Mood / scale<select value={room.scale ?? 'major'} onChange={(event) => onChange({ ...room, scale: event.target.value })}><option value="major">Major · Happy</option><option value="minor">Minor · Sad</option></select></label><label>Turn length<select value={room.turnSeconds} onChange={(event) => onChange({ ...room, turnSeconds: Number(event.target.value) })}>{TURN_LENGTHS.map((seconds) => <option key={seconds} value={seconds}>{formatTime(seconds)}</option>)}</select></label><label>Listen between turns<select value={room.listenSeconds ?? 8} onChange={(event) => onChange({ ...room, listenSeconds: Number(event.target.value) })}>{LISTEN_LENGTHS.map((seconds) => <option key={seconds} value={seconds}>{formatTime(seconds)}</option>)}</select></label><label>Pattern length<span>2 bars</span></label></div>
        </aside></fieldset><button className="button primary start-game" disabled={loading || room.players.length < 2} onClick={onStart}>{loading ? 'Loading sounds…' : resume ? 'Resume session' : 'Start session'}<Icon name="arrow" /></button>
    </main></>
}
