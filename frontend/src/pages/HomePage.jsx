import { useState } from 'react'
import Brand from '../components/Brand'
import Icon from '../components/Icon'

export default function HomePage({ onCreate, onJoin, onResume }) {
  const [motion, setMotion] = useState(true)
  return <>
    <header className="landing-header"><Brand /></header>
    <main className="vinyl-home">
      <h1>Your sound. <span>Our beat.</span></h1>
      <div className="record-stage">
        <div className="music-sketch melody-sketch" aria-hidden="true">
          <div className="sketch-lights"><i /><i /><i /></div>
          <div className="sketch-roll">{[0, 1, 2, 3, 4, 5, 6, 7].map((note) => <i key={note} style={{ '--note': note }} />)}</div>
          <div className="sketch-wave">{[12, 22, 34, 19, 42, 58, 36, 24, 46, 62, 38, 20, 32, 46, 28, 15].map((height, index) => <i key={index} style={{ height }} />)}</div>
        </div>
      <div className="turntable">
        <div className={`vinyl-disc ${motion ? '' : 'motion-paused'}`} aria-hidden="true"><div className="vinyl-grooves" /><div className="vinyl-glint" /><span className="vinyl-stamp">PASS THE BEAT • PLAY TOGETHER</span></div>
        <button className="vinyl-start" onClick={onCreate} aria-label="Create a lobby"><span className="label-caption">PASS THE BEAT</span><Icon name="play" size={22} /><strong>Start</strong><span className="label-caption">CREATE A LOBBY</span></button>
      </div>
        <div className="music-sketch rhythm-sketch" aria-hidden="true">
          <div className="sketch-lights"><i /><i /><i /></div>
          <div className="sketch-pads">{Array.from({ length: 16 }, (_, pad) => <i key={pad} className={[0, 3, 5, 8, 10, 14].includes(pad) ? 'lit' : ''} />)}</div>
          <div className="sketch-faders"><i /><i /><i /></div>
        </div>
      </div>
      <button className="vinyl-join" onClick={onJoin}>Join a lobby<Icon name="arrow" size={16} /></button>
      {onResume && <button className="text-button resume-session" onClick={onResume}>Resume saved beat<Icon name="arrow" size={16} /></button>}
      <div className="home-details"><span>2–5 players</span><i /><span>One shared device</span></div>
      <button className="motion-toggle" onClick={() => setMotion(!motion)} aria-pressed={!motion}>{motion ? 'Pause motion' : 'Resume motion'}</button>
    </main>
    <footer className="landing-footer"><span>PASS THE BEAT / SED3111</span></footer>
  </>
}
