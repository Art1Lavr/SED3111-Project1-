// The UI and audio engine share this catalogue. Paths are relative to public/sounds.
export const instruments = [
  { id: 'kick', name: 'Kick', color: '#b8bdce', description: 'The pulse that starts it all.', samples: [
    { id: 'kick-learn', name: 'Learn', file: 'kick/kick_learn.wav' },
    { id: 'kick-lean', name: 'Lean', file: 'kick/kick_lean.wav' },
    { id: 'kick-2', name: 'Kick 2', file: 'kick/kick 2.wav' },
  ] },
  { id: 'hat', name: 'Hi-hat', color: '#c5b28d', description: 'A little motion between the beats.', samples: [
    { id: 'hat-drip', name: 'Drip', file: 'hat/hh_drip.wav' },
    { id: 'hat-123', name: '123', file: 'hat/hh_123.wav' },
  ] },
  { id: 'snare', name: 'Snare', color: '#b4a5cb', description: 'Give your rhythm a sharp accent.', samples: [
    { id: 'snare-shorty', name: 'Shorty', file: 'snare/snare_shorty.wav' },
    { id: 'snare-vivaldi', name: 'Vivaldi', file: 'snare/snare_vivaldi.wav' },
    { id: 'snare-golf', name: 'Golf', file: 'snare/snare_golf.wav' },
    { id: 'snare-ghast', name: 'Ghast', file: 'snare/snare_ghast.wav' },
  ] },
  { id: 'clap', name: 'Clap', color: '#c69e98', description: 'Bring a few more hands into the mix.', samples: [
    { id: 'clap-nova', name: 'Nova', file: 'clap/clap_nova.wav' },
    { id: 'clap-spoil', name: 'Spoil', file: 'clap/clap_spoil.wav' },
    { id: 'clap-lugger', name: 'Lugger', file: 'clap/clap_lugger.wav' },
  ] },
  {
    id: 'bass', name: 'Bass', color: '#97b9b0', description: '808 one-shots. Shape the length of each note.',
    pitched: true, rootKey: 'C5', // FL sampler reference key, not a measured acoustic pitch.
    samples: [
      { id: 'bass-hiroshima', name: '808 Hiroshima', file: 'bass/808_hiroshima.wav' },
      { id: 'bass-low', name: '808 Low', file: 'bass/808_low.wav' },
      { id: 'bass-mira', name: '808 Mira Long', file: 'bass/808_mira_long.wav' },
    ],
  },
  {
    id: 'melody', name: 'Instrument', color: '#a0b3ce', description: 'Keyboard, sax, flute or guitar. Pick your voice.',
    pitched: true,
    noteDuration: 0.25,
    samples: [
      { id: 'keyboard', name: 'Keyboard · A', file: 'instrument/sound_keyboard_staff_A.mp3' },
      { id: 'sax', name: 'Saxophone · C', file: 'instrument/sax-short-single-note_C.wav' },
      { id: 'flute', name: 'Flute · C major', file: 'instrument/flute-one-shot-note-long_133bpm_C_major.wav' },
      { id: 'guitar', name: 'Guitar · A minor', file: 'instrument/clean-guitar-note_A_minor.wav' },
    ],
  },
]
