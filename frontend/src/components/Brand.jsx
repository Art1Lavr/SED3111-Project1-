export default function Brand({ onClick, small = false }) {
  return <button className={`brand ${small ? 'small' : ''}`} onClick={onClick} aria-label="Pass the Beat — home"><span className="brand-mark"><i /><i /><i /><i /></span><span>pass the beat<span className="brand-period">.</span></span></button>
}
