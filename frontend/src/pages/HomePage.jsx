import Brand from '../components/Brand'
import Icon from '../components/Icon'


export default function HomePage({ onCreate, onJoin }) {
  return <><header className="landing-header"><Brand /><span className="edition">PROTOTYPE 01</span></header>
    <main className="home-main"><div className="home-eyebrow"><span className="live-dot" />GATHER. CREATE. PASS IT ON.</div>
      <h1>Your sound.<br /><span>Our beat.</span></h1><p className="home-subtitle">Make something only you could make together.</p>
      <div className="home-actions"><button className="button primary large" onClick={onCreate}>Create a lobby<Icon name="arrow" /></button><button className="button secondary large" onClick={onJoin}>Join a lobby</button></div>
      <div className="home-details"><span>2–5 players</span><i /><span>One turn each</span><i /><span>One shared device</span></div>
      <div className="beat-decoration" aria-hidden="true">{Array.from({ length: 16 }, (_, i) => <span key={i} style={{ '--bar-height': `${[22, 42, 70, 35, 95, 60, 120, 85, 45, 105, 70, 130, 80, 46, 65, 25][i]}px` }} />)}</div>
    </main><footer className="landing-footer"><span>PASS THE BEAT / SED3111</span><span>Listen first. Make it yours.</span></footer></>
}

