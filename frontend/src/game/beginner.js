// Pattern library adapted from aridj, commit 1454d84. Uses current samples.
import { normalizeRoom } from './rooms.js'
import { getInstrument, createGame, createTrack, constrainNote, uid } from './model.js'

const BEGINNER_STARTER_NOTES = {
  kick: [0, 2, 4, 6, 8, 10, 12, 14],
  snare: [1, 3, 5, 7, 9, 11, 13, 15],
}
export const MELODY_CATEGORIES = [
  { id: 'keys', icon: '🎹', title: 'PIANO & KEYS' },
  { id: 'leads', icon: '🎸', title: 'SYNTHS & LEADS' },
  { id: 'bass', icon: '🔊', title: 'BASSLINES' },
  { id: 'pads', icon: '🎻', title: 'STRINGS & PADS' },
  { id: 'drums', icon: '🥁', title: 'DRUM BEATS' },
  { id: 'brass', icon: '🎺', title: 'BRASS & HORNS' },
  { id: 'vocal', icon: '🎤', title: 'VOCAL FX' },
]
const BASE_MELODY_PRESETS = [
  { id: 'classic-ballad', category: 'keys', instrumentName: 'Piano', style: 'Classic Ballad', vibe: 'Warm', description: 'Open, gentle chords with room to breathe.', patterns: [{ instrumentId: 'melody', sampleId: 'keyboard', notes: [[0, 0, 4], [0, 4, 4], [0, 7, 4], [8, 9, 4], [8, 0, 4], [8, 4, 4]] }] },
  { id: 'lo-fi-chords', category: 'keys', instrumentName: 'Piano', style: 'Lo-Fi Chords', vibe: 'Chill', description: 'A mellow repeating chord progression.', patterns: [{ instrumentId: 'melody', sampleId: 'keyboard', notes: [[0, 0, 3], [0, 4, 3], [0, 9, 3], [6, 2, 3], [6, 7, 3], [6, 0, 3], [12, 4, 3], [12, 7, 3], [12, 0, 3]] }] },
  { id: 'jazz-hop', category: 'keys', instrumentName: 'Piano', style: 'Jazz Hop', vibe: 'Groovy', description: 'A syncopated phrase with a relaxed swing.', patterns: [{ instrumentId: 'melody', sampleId: 'keyboard', notes: [[0, 0, 2], [3, 4, 1], [5, 7, 2], [8, 9, 2], [11, 7, 1], [13, 4, 2]] }] },
  { id: 'bright-pop', category: 'keys', instrumentName: 'Piano', style: 'Bright Pop', vibe: 'Energetic', description: 'A bouncy melody that moves up and down.', patterns: [{ instrumentId: 'melody', sampleId: 'keyboard', notes: [[0, 0, 1], [2, 4, 1], [4, 7, 1], [6, 4, 1], [8, 9, 1], [10, 7, 1], [12, 4, 1], [14, 7, 1]] }] },
  { id: 'retro-hook', category: 'leads', instrumentName: 'Synth', style: '80s Retro Hook', vibe: 'Nostalgic', description: 'A bold repeating hook with a retro feel.', patterns: [{ instrumentId: 'melody', sampleId: 'sax', notes: [[0, 7, 1], [2, 9, 1], [4, 7, 1], [6, 4, 2], [8, 2, 1], [10, 4, 1], [12, 7, 2], [14, 9, 1]] }] },
  { id: 'future-bass', category: 'leads', instrumentName: 'Synth', style: 'Future Bass', vibe: 'Dreamy', description: 'Wide, bright chord hits with a modern lift.', patterns: [{ instrumentId: 'melody', sampleId: 'flute', notes: [[0, 0, 3], [0, 7, 3], [0, 9, 3], [6, 2, 3], [6, 7, 3], [6, 9, 3], [12, 4, 3], [12, 9, 3], [12, 0, 3]] }] },
  { id: 'arpeggiated-pulse', category: 'leads', instrumentName: 'Synth', style: 'Arp Pulse', vibe: 'Driving', description: 'A steady climbing-and-falling note pattern.', patterns: [{ instrumentId: 'melody', sampleId: 'sax', notes: [[0, 0, 1], [1, 4, 1], [2, 7, 1], [3, 9, 1], [8, 7, 1], [9, 4, 1], [10, 2, 1], [11, 4, 1], [12, 7, 2]] }] },
  { id: 'tropical-lead', category: 'leads', instrumentName: 'Flute Lead', style: 'Tropical Lead', vibe: 'Sunny', description: 'A light, skipping phrase with a sunny lift.', patterns: [{ instrumentId: 'melody', sampleId: 'flute', notes: [[0, 4, 1], [2, 7, 2], [5, 9, 1], [7, 7, 1], [8, 4, 1], [10, 2, 2], [13, 4, 1], [15, 7, 1]] }] },
  { id: 'deep-sub', category: 'bass', instrumentName: 'Bass', style: 'Deep Sub Pulse', vibe: 'Heavy', description: 'A low, steady pulse under the melody.', patterns: [{ instrumentId: 'bass', sampleId: 'bass-low', notes: [[0, -12, 2], [4, -12, 2], [8, -7, 2], [12, -12, 2]] }] },
  { id: 'funk-bassline', category: 'bass', instrumentName: 'Bass', style: 'Funk Bass', vibe: 'Groovy', description: 'A syncopated bass phrase that keeps moving.', patterns: [{ instrumentId: 'bass', sampleId: 'bass-mira', notes: [[0, -12, 1], [3, -7, 1], [4, -12, 2], [7, -5, 1], [8, -12, 1], [11, -7, 1], [12, -5, 2], [15, -7, 1]] }] },
  { id: '808-bounce', category: 'bass', instrumentName: '808 Bass', style: '808 Bounce', vibe: 'Punchy', description: 'A bouncing low-end pattern with short rests.', patterns: [{ instrumentId: 'bass', sampleId: 'bass-hiroshima', notes: [[0, -12, 2], [3, -12, 1], [6, -7, 2], [8, -12, 1], [11, -5, 1], [12, -7, 2], [15, -12, 1]] }] },
  { id: 'driving-synth-bass', category: 'bass', instrumentName: '808 Bass', style: 'Driving Synth Bass', vibe: 'Driving', description: 'A persistent pulse for a high-energy loop.', patterns: [{ instrumentId: 'bass', sampleId: 'bass-low', notes: [[0, -12, 1], [2, -12, 1], [4, -7, 1], [6, -12, 1], [8, -12, 1], [10, -12, 1], [12, -5, 1], [14, -7, 1]] }] },
  { id: 'atmospheric-pad', category: 'pads', instrumentName: 'Flute Pad', style: 'Atmospheric Pad', vibe: 'Calm', description: 'Long, soft tones that create a floating bed.', patterns: [{ instrumentId: 'melody', sampleId: 'flute', notes: [[0, 0, 8], [0, 7, 8], [8, 2, 8], [8, 9, 8]] }] },
  { id: 'cinematic-violins', category: 'pads', instrumentName: 'Flute Ensemble', style: 'Cinematic Strings', vibe: 'Cinematic', description: 'A rising phrase with a sweeping, film-like mood.', patterns: [{ instrumentId: 'melody', sampleId: 'flute', notes: [[0, 0, 4], [4, 4, 3], [8, 7, 4], [12, 9, 4]] }] },
  { id: 'warm-ambient', category: 'pads', instrumentName: 'Warm Guitar', style: 'Warm Ambient', vibe: 'Soft', description: 'A spacious melody with a gentle, warm tone.', patterns: [{ instrumentId: 'melody', sampleId: 'guitar', notes: [[0, 0, 4], [4, 7, 3], [8, 4, 4], [12, 9, 3]] }] },
  { id: 'lo-fi-beat', category: 'drums', instrumentName: 'Drum Kit', style: 'Lo-Fi Chill Beat', vibe: 'Chill', description: 'A relaxed kit groove with a soft offbeat hat.', patterns: [{ instrumentId: 'kick', sampleId: 'kick-learn', notes: [[0, 0, 1], [4, 0, 1], [8, 0, 1], [12, 0, 1]] }, { instrumentId: 'snare', sampleId: 'snare-shorty', notes: [[2, 0, 1], [6, 0, 1], [10, 0, 1], [14, 0, 1]] }, { instrumentId: 'hat', sampleId: 'hat-drip', notes: [[1, 0, 1], [3, 0, 1], [5, 0, 1], [7, 0, 1], [9, 0, 1], [11, 0, 1], [13, 0, 1], [15, 0, 1]] }] },
  { id: 'four-floor', category: 'drums', instrumentName: 'Drum Kit', style: 'Four-on-the-Floor', vibe: 'Energetic', description: 'A dependable dance kick with a clap backbeat.', patterns: [{ instrumentId: 'kick', sampleId: 'kick-2', notes: [[0, 0, 1], [2, 0, 1], [4, 0, 1], [6, 0, 1], [8, 0, 1], [10, 0, 1], [12, 0, 1], [14, 0, 1]] }, { instrumentId: 'clap', sampleId: 'clap-nova', notes: [[2, 0, 1], [6, 0, 1], [10, 0, 1], [14, 0, 1]] }, { instrumentId: 'hat', sampleId: 'hat-123', notes: [[1, 0, 1], [3, 0, 1], [5, 0, 1], [7, 0, 1], [9, 0, 1], [11, 0, 1], [13, 0, 1], [15, 0, 1]] }] },
  { id: 'trap-bounce', category: 'drums', instrumentName: 'Drum Kit', style: 'Trap Bounce', vibe: 'Punchy', description: 'A bouncing kick with a crisp, spacious snare.', patterns: [{ instrumentId: 'kick', sampleId: 'kick-lean', notes: [[0, 0, 1], [3, 0, 1], [6, 0, 1], [8, 0, 1], [11, 0, 1], [14, 0, 1]] }, { instrumentId: 'snare', sampleId: 'snare-ghast', notes: [[4, 0, 1], [12, 0, 1]] }, { instrumentId: 'hat', sampleId: 'hat-drip', notes: [[0, 0, 1], [2, 0, 1], [4, 0, 1], [6, 0, 1], [8, 0, 1], [10, 0, 1], [12, 0, 1], [14, 0, 1], [15, 0, 1]] }] },
  { id: 'acoustic-pop', category: 'drums', instrumentName: 'Drum Kit', style: 'Acoustic Groove', vibe: 'Upbeat', description: 'A familiar pop beat with a steady backbeat.', patterns: [{ instrumentId: 'kick', sampleId: 'kick-learn', notes: [[0, 0, 1], [4, 0, 1], [8, 0, 1], [12, 0, 1]] }, { instrumentId: 'snare', sampleId: 'snare-vivaldi', notes: [[2, 0, 1], [6, 0, 1], [10, 0, 1], [14, 0, 1]] }, { instrumentId: 'hat', sampleId: 'hat-123', notes: [[0, 0, 1], [2, 0, 1], [4, 0, 1], [6, 0, 1], [8, 0, 1], [10, 0, 1], [12, 0, 1], [14, 0, 1]] }] },
]

const MELODY_MOTIFS = [
  [[0, 0, 2], [2, 4, 1], [4, 7, 2], [8, 9, 1], [10, 7, 2], [14, 4, 1]],
  [[0, 7, 1], [2, 4, 1], [3, 2, 2], [6, 4, 1], [8, 9, 1], [10, 7, 1], [12, 4, 2], [15, 2, 1]],
  [[0, 0, 4], [0, 4, 4], [4, 7, 3], [8, 2, 4], [8, 7, 4], [12, 9, 3]],
  [[0, 9, 1], [1, 7, 1], [3, 4, 2], [6, 2, 1], [8, 0, 2], [11, 4, 1], [13, 7, 2]],
  [[0, 4, 2], [2, 7, 2], [6, 9, 1], [8, 7, 2], [10, 4, 2], [14, 2, 1]],
  [[0, 0, 1], [1, 4, 1], [2, 7, 1], [3, 9, 1], [8, 9, 1], [9, 7, 1], [10, 4, 1], [11, 0, 2]],
  [[0, 7, 3], [4, 9, 1], [6, 7, 1], [8, 4, 3], [12, 2, 1], [14, 0, 1]],
  [[0, 0, 3], [4, 2, 2], [8, 4, 3], [12, 7, 2], [14, 9, 1]],
]
const BASS_MOTIFS = [
  [[0, -12, 2], [4, -12, 2], [8, -7, 2], [12, -12, 2]],
  [[0, -12, 1], [3, -7, 1], [4, -12, 2], [7, -5, 1], [8, -12, 1], [11, -7, 1], [12, -5, 2], [15, -7, 1]],
  [[0, -12, 1], [2, -12, 1], [4, -7, 1], [6, -12, 1], [8, -12, 1], [10, -12, 1], [12, -5, 1], [14, -7, 1]],
  [[0, -12, 2], [3, -12, 1], [6, -7, 2], [8, -12, 1], [11, -5, 1], [12, -7, 2], [15, -12, 1]],
  [[0, -12, 3], [4, -5, 2], [8, -7, 3], [12, -3, 2]],
  [[0, -7, 1], [2, -12, 2], [5, -5, 1], [7, -7, 1], [8, -12, 2], [11, -3, 1], [13, -5, 2]],
  [[0, -12, 1], [1, -12, 1], [4, -7, 1], [6, -5, 1], [8, -12, 1], [9, -12, 1], [12, -3, 2], [15, -5, 1]],
  [[0, -12, 2], [4, -7, 1], [6, -12, 1], [8, -5, 2], [12, -7, 1], [14, -12, 2]],
]

function presetGroup(category, instrumentName, instrumentId, sampleIds, variants, motifs = MELODY_MOTIFS) {
  return variants.map(([id, style, vibe, motifIndex, description]) => ({
    id, category, instrumentName, style, vibe, description,
    patterns: [{ instrumentId, sampleId: sampleIds[motifIndex % sampleIds.length], notes: motifs[motifIndex] }],
  }))
}

const ADDITIONAL_MELODY_PRESETS = [
  ...presetGroup('keys', 'Piano', 'melody', ['keyboard'], [
    ['intro-chords', 'Intro Chords', 'Gentle', 2, 'A spacious opening with soft chord changes.'],
    ['syncopated-riff', 'Syncopated Riff', 'Groovy', 3, 'A playful phrase with unexpected accents.'],
    ['keys-arp', 'Arp Lead', 'Bright', 5, 'A quick climbing figure for extra movement.'],
    ['chorus-hook', 'Chorus Hook', 'Catchy', 6, 'A memorable phrase made for the chorus.'],
  ]),
  ...presetGroup('leads', 'Synth Lead', 'melody', ['sax', 'flute'], [
    ['laser-run', 'Laser Run', 'Energetic', 5, 'A quick bright lead that runs across the bar.'],
    ['wide-lift', 'Wide Lift', 'Dreamy', 2, 'A broad chord lift with a spacious feel.'],
    ['island-answer', 'Island Answer', 'Sunny', 4, 'A short melodic reply with a sunny bounce.'],
    ['neon-chase', 'Neon Chase', 'Driving', 7, 'A pulsing lead that keeps the energy moving.'],
  ]),
  ...presetGroup('bass', 'Bass', 'bass', ['bass-low', 'bass-mira', 'bass-hiroshima'], [
    ['bass-octave-hop', 'Octave Hop', 'Playful', 5, 'A bouncing low line with quick repeated notes.'],
    ['bass-pocket', 'Pocket Groove', 'Groovy', 1, 'A syncopated line that sits in the pocket.'],
    ['bass-long-pulse', 'Long Pulse', 'Steady', 4, 'Long low notes anchor each half of the loop.'],
    ['bass-turnaround', 'Turnaround', 'Driving', 7, 'A low phrase that pushes back to the top.'],
  ], BASS_MOTIFS),
  ...presetGroup('pads', 'Flute / Pad', 'melody', ['flute', 'guitar'], [
    ['pad-slow-rise', 'Slow Rise', 'Calm', 7, 'A gentle rising texture with long notes.'],
    ['pad-clouds', 'Soft Clouds', 'Dreamy', 2, 'Wide notes float behind the main melody.'],
    ['pad-glow', 'Ambient Glow', 'Warm', 0, 'A softly pulsing texture for extra depth.'],
    ['pad-film', 'Film Sweep', 'Cinematic', 4, 'A slow-moving line with a film-score feel.'],
    ['pad-guitar-wash', 'Guitar Wash', 'Soft', 6, 'Warm guitar notes drift across the beat.'],
  ]),
  ...presetGroup('brass', 'Saxophone', 'melody', ['sax'], [
    ['brass-fanfare', 'Short Fanfare', 'Bold', 6, 'A compact brass-like call for the downbeat.'],
    ['brass-stabs', 'Horn Stabs', 'Punchy', 2, 'Bright short notes add accents to the groove.'],
    ['brass-swell', 'Rising Swell', 'Cinematic', 7, 'A rising line with a big finish.'],
    ['brass-answer', 'Horn Answer', 'Soulful', 1, 'A call-and-response style phrase.'],
    ['brass-parade', 'Parade Bounce', 'Upbeat', 5, 'A lively lead with a bouncing rhythm.'],
    ['brass-long-tone', 'Long Tones', 'Warm', 4, 'Held notes make a simple brass bed.'],
    ['brass-skip', 'Skipping Horn', 'Playful', 3, 'A nimble phrase skips between scale tones.'],
    ['brass-finale', 'Finale Lift', 'Triumphant', 0, 'A bright ending phrase for the final bars.'],
  ]),
  ...presetGroup('vocal', 'Voice-Style FX', 'melody', ['flute', 'sax'], [
    ['vocal-chop', 'Vocal Chop', 'Punchy', 5, 'Short voice-like lead chops using the available flute sample.'],
    ['vocal-air', 'Breathy Ad-Lib', 'Airy', 4, 'A light upper-register answer phrase.'],
    ['vocal-call', 'Call & Response', 'Playful', 1, 'A short call answered by a higher phrase.'],
    ['vocal-choir', 'Choir-Like Lift', 'Dreamy', 2, 'Stacked notes create a soft choir-like color.'],
    ['vocal-stab', 'Vocal Stabs', 'Energetic', 3, 'Compact rhythmic accents cut through the mix.'],
    ['vocal-whisper', 'Whisper Wave', 'Soft', 7, 'A gentle wave of soft, high notes.'],
    ['vocal-response', 'Ad-Lib Response', 'Groovy', 6, 'A syncopated response to the main melody.'],
    ['vocal-hook', 'Vocal Hook', 'Catchy', 0, 'A short repeating phrase with a bright lead sound.'],
  ]),
  ...[
    ['breakbeat', 'Breakbeat Bounce', 'Edgy', [0, 4, 8, 11], [2, 6, 10, 14], [1, 3, 5, 7, 9, 11, 13, 15]],
    ['disco', 'Disco Shuffle', 'Dancey', [0, 2, 4, 6, 8, 10, 12, 14], [2, 6, 10, 14], [0, 2, 4, 6, 8, 10, 12, 14]],
    ['half-time', 'Half-Time Heavy', 'Punchy', [0, 6, 8, 14], [4, 12], [0, 3, 6, 8, 11, 14]],
    ['shuffle', 'Acoustic Shuffle', 'Loose', [0, 4, 8, 12], [2, 6, 10, 14], [0, 2, 3, 4, 6, 7, 8, 10, 11, 12, 14, 15]],
  ].map(([id, style, vibe, kickHits, snareHits, hatHits]) => ({
    id: `drum-${id}`, category: 'drums', instrumentName: 'Drum Kit', style, vibe,
    description: `A ${vibe.toLowerCase()} two-bar drum groove with kick, snare, and hats.`,
    patterns: [
      { instrumentId: 'kick', sampleId: 'kick-learn', notes: kickHits.map((start) => [start, 0, 1]) },
      { instrumentId: 'snare', sampleId: 'snare-shorty', notes: snareHits.map((start) => [start, 0, 1]) },
      { instrumentId: 'hat', sampleId: 'hat-drip', notes: hatHits.map((start) => [start, 0, 1]) },
    ],
  })),
]
export const MELODY_PRESETS = [...BASE_MELODY_PRESETS, ...ADDITIONAL_MELODY_PRESETS]
// Melodic samples are distinct instruments; bass/drum variations share a lane.
export function matchingTrack(track, part) {
  return track.instrumentId === part.instrumentId && (part.instrumentId !== 'melody' || track.sampleId === part.sampleId)
}
export function planPreset(game, preset, selectedId) {
  const used = new Set()
  const parts = preset.patterns.map(part => {
    const matches = game.tracks.filter(t => !used.has(t.id) && matchingTrack(t, part))
    const track = matches.find(t => t.id === selectedId) ?? matches.find(t => !t.notes.length) ?? matches[0]
    if (track) used.add(track.id)
    return { part, track }
  })
  return { parts, replacing: parts.filter(p => p.track?.notes.length).map(p => p.track),
    canApply: game.tracks.length + parts.filter(p => !p.track).length <= 16 }
}
export function addMelodyPreset(game, presetId, selectedId) {
  const preset = MELODY_PRESETS.find(p => p.id === presetId)
  if (!preset || game.mode !== 'beginner' || game.phase !== 'edit') return game
  const plan = planPreset(game, preset, selectedId)
  if (!plan.canApply) return game
  const tracks = [...game.tracks]
  for (const { part, track } of plan.parts) {
    const next = { ...(track ?? createTrack(part.instrumentId, game.players[game.current].id, part.sampleId)),
      sampleId: part.sampleId, mode: part.instrumentId === 'melody' || part.instrumentId === 'bass' ? 'piano' : 'steps',
      notes: part.notes.map(([start, pitch, length]) => constrainNote({ id: uid(), start, pitch, length }, 'beginner')),
      presetId, presetStyle: preset.style, presetCategory: preset.category, transpose: 0 }
    delete next.presetInstanceId
    delete next.starterBeatPart
    if (new Set(part.notes.map(n => n[0])).size < part.notes.length) next.cutSelf = false
    if (track) tracks[tracks.findIndex(t => t.id === track.id)] = next
    else tracks.push(next)
  }
  return { ...game, tracks, history: [...game.history.slice(-39), game.tracks] }
}
export function addEmptyInstrument(game, instrumentId, sampleId) {
  if (game.mode !== 'beginner' || game.phase !== 'edit' || game.tracks.length >= 16) return game
  const instrument = getInstrument(instrumentId)
  if (!instrument?.samples.some(s => s.id === sampleId)) return game
  return { ...game, tracks: [...game.tracks, createTrack(instrumentId, game.players[game.current].id, sampleId)], history: [...game.history.slice(-39), game.tracks] }
}
export function removeBeginnerTrack(game, id) {
  if (game.mode !== 'beginner' || game.phase !== 'edit' || !game.tracks.some(t => t.id === id)) return game
  return { ...game, tracks: game.tracks.filter(t => t.id !== id), history: [...game.history.slice(-39), game.tracks] }
}

export function createBeginnerGame(room, now = Date.now()) {
  const game = createGame(normalizeRoom({ ...room, mode: 'beginner' }), now)
  return { ...game, mode: 'beginner', tracks: game.tracks.map(track => {
    if (!BEGINNER_STARTER_NOTES[track.instrumentId]) return track
    return { ...track, starterBeatPart: track.instrumentId,
      notes: BEGINNER_STARTER_NOTES[track.instrumentId].map(start => ({ id: uid(), start, length: 0.5, pitch: 0 })) }
  }) }
}

export function starterBeatEnabled(game) {
  const parts = game.tracks.filter(track => track.starterBeatPart)
  return parts.length > 0 && parts.some(track => track.notes.length > 0)
}

export function setStarterBeat(game, enabled) {
  if (game.mode !== 'beginner' || game.phase !== 'edit' || starterBeatEnabled(game) === enabled) return game
  return { ...game, history: [...game.history.slice(-39), game.tracks],
    tracks: game.tracks.map(track => track.starterBeatPart
      ? { ...track, notes: enabled ? BEGINNER_STARTER_NOTES[track.starterBeatPart].map(start => ({ id: uid(), start, length: 0.5, pitch: 0 })) : [] }
      : track) }
}
