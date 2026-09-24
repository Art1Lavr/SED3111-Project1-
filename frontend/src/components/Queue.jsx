import { formatTime } from '../game/rooms'
import Icon from './Icon'
import { PLAYER_COLORS } from '../game/model'

export default function Queue({ game, remaining, listenProgress }) {
  const listening = game.phase === 'listen'
  return <footer className="queue-footer">
    <div className="queue-heading"><span><span className={`live-dot ${listening ? 'listening' : ''}`} />{listening ? 'Listen to the previous contribution' : `Creating now: ${game.players[game.current].name}`}</span><span>{game.current + 1} / {game.players.length}<span className="queue-label"> · TURN ORDER</span></span></div>
    <div className="queue-flow">{game.players.map((player, index) => {
      const done = index < game.current
      const current = index === game.current && game.phase === 'edit'
      const progress = done ? 1 : current ? 1 - remaining / game.turnSeconds : 0
      return <div className="queue-segment" key={player.id}>
        <div className={`player-turn ${current ? 'current' : ''} ${done ? 'done' : ''}`} style={{ '--player-color': PLAYER_COLORS[index] }}>
          <span className="player-avatar">{done ? <Icon name="check" size={16} /> : player.name.slice(0, 1).toUpperCase()}</span>
          <span className="player-turn-name">{player.name}<small>{done ? 'Done' : current ? 'Creating' : index === game.current && listening ? 'Listening' : 'Up next'}</small></span>
          <span className="turn-seconds">{done ? '✓' : formatTime(current ? remaining : game.turnSeconds)}</span>
          <span className="turn-progress" style={{ width: `${progress * 100}%` }} />
        </div>
        {index < game.players.length - 1 && <div className="listen-connector" title="Listening before the next turn"><Icon name="headphones" size={12} /><span><i style={{ width: `${index < game.current - 1 || (index === game.current - 1 && !listening) ? 100 : index === game.current - 1 && listening ? listenProgress * 100 : 0}%` }} /></span></div>}
      </div>
    })}</div>
  </footer>
}
