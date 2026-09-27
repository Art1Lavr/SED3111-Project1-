const paths = {
  play: 'M8 5l11 7-11 7V5Z', pause: 'M8 5v14M16 5v14', stop: 'M6 6h12v12H6z',
  plus: 'M12 5v14M5 12h14', arrow: 'M5 12h14m-6-6 6 6-6 6', back: 'M19 12H5m6-6-6 6 6 6',
  close: 'm6 6 12 12M6 18 18 6', settings: 'M4 7h16M4 17h16M9 4v6m6 4v6',
  volume: 'm11 5-6 5H2v4h3l6 5V5Zm4 3c3 2 3 6 0 8m3-11c5 4 5 10 0 14',
  mute: 'm11 5-6 5H2v4h3l6 5V5Zm5 4 6 6m0-6-6 6',
  headphones: 'M4 13v-2a8 8 0 0 1 16 0v2M4 12H2v8h5v-8H4Zm16 0h2v8h-5v-8h3Z',
  piano: 'M3 5h18v15H3zM8 5v15m8-15v15M6 5v7h4V5m4 0v7h4V5',
  steps: 'M3 5h6v6H3zM15 5h6v6h-6zM3 15h6v6H3zM15 15h6v6h-6z',
  undo: 'M9 5 3 10l6 5M3 10h11a6 6 0 0 1 0 12',
  trash: 'M4 6h16M9 6V3h6v3M6 6l1 15h10l1-15M10 10v7m4-7v7',
  lock: 'M7 10V7a5 5 0 0 1 10 0v3M5 10h14v11H5z',
  check: 'm4 12 5 5L20 6', copy: 'M8 8h12v13H8zM16 8V3H3v13h5',
  music: 'M9 18V5l12-2v13M9 9l12-2M9 18c0 3-6 4-6 1s6-4 6-1Zm12-2c0 3-6 4-6 1s6-4 6-1Z',
  more: 'M5 12h.01M12 12h.01M19 12h.01',
}
export default function Icon({ name, size = 18, ...props }) {
  return <svg width={size} height={size} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.7" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true" {...props}><path d={paths[name] ?? paths.music} /></svg>
}
