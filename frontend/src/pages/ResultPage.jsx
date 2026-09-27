import Brand from '../components/Brand'
import Icon from '../components/Icon'
import { PLAYER_COLORS } from '../game/model'

export default function ResultPage({ game, playing, onPlay, onAgain, onHome }) {
  return <><header className="landing-header"><Brand onClick={onHome} /><span className="edition">BETTER TOGETHER</span></header>
    <main className="result-main"><span className="result-icon"><Icon name="music" size={38} /></span><div className="section-kicker">REVEAL</div><h1>You made this<span>.</span></h1><p>{game.players.length} players. One shared beat.</p>
      <div className={`result-bars ${playing ? 'animated' : ''}`} aria-hidden="true">{Array.from({ length: 24 }, (_, index) => <i key={index} style={{ height: `${25 + (index * 37 % 95)}px`, animationDelay: `${index * 43}ms` }} />)}</div>
      <button className="button primary large" onClick={onPlay}><Icon name={playing ? 'pause' : 'play'} />{playing ? 'Pause' : 'Listen together'}</button>
      <div className="contributions">{game.players.map((player, index) => <div key={player.id} style={{ '--player-color': PLAYER_COLORS[index] }}><span className="player-avatar">{player.name[0]}</span><strong>{player.name}</strong><span>Co-creator</span></div>)}</div>
      <button className="text-button" onClick={onAgain}>Play again<Icon name="arrow" size={16} /></button>
    </main></>
}
