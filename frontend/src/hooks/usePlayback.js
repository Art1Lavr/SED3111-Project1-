import { useCallback, useEffect, useRef, useState } from 'react'
import { audibleTracks } from '../game/model'
import { startSequence } from '../audio/sequencer'

async function defaultEngineFactory() {
  const { createAudioEngine } = await import('../audio/audioEngine')
  return createAudioEngine()
}

export default function usePlayback(game, onError, engineFactory = defaultEngineFactory, masterVolume = 65) {
  const audio = useRef(null)
  const pending = useRef(null)
  const volumeRef = useRef(masterVolume)
  useEffect(() => { volumeRef.current = masterVolume; audio.current?.setVolume(masterVolume / 100) }, [masterVolume])
  const playVersion = useRef(0)
  const stopSequence = useRef(null)
  const gameRef = useRef(game)
  const positionRef = useRef(0)
  const startRef = useRef(0)
  const [startPosition, setStartPosition] = useState(0)
  const [playing, setPlaying] = useState(false)
  const [playhead, setPlayhead] = useState(0)
  const [listenProgress, setListenProgress] = useState(0)
  useEffect(() => { gameRef.current = game }, [game])

  useEffect(() => {
    let active = true
    const cancelPendingPlay = () => { playVersion.current++ }
    pending.current = Promise.resolve().then(engineFactory).then((engine) => {
      if (!active) { engine.dispose(); return null }
      audio.current = engine
      return engine
    }).catch((error) => { if (active) onError(error.message); return null })
    return () => { cancelPendingPlay(); active = false; stopSequence.current?.(); audio.current?.dispose(); audio.current = null }
  }, [engineFactory, onError])

  const prepareAudio = useCallback(async () => {
    const engine = await pending.current
    if (!engine) throw new Error('Audio could not start. Refresh and try again.')
    await engine.start()
    engine.setVolume(volumeRef.current / 100)
    return engine
  }, [])

  const stop = useCallback(() => {
    playVersion.current++
    stopSequence.current?.(); stopSequence.current = null
    audio.current?.stop(); positionRef.current = 0; setPlaying(false); setPlayhead(0)
  }, [])

  const pause = useCallback(() => {
    playVersion.current++
    stopSequence.current?.(); stopSequence.current = null
    audio.current?.stop(); positionRef.current = startRef.current; setPlayhead(startRef.current); setPlaying(false)
  }, [])

  const play = useCallback(async (loop = true, onEnd) => {
    const version = ++playVersion.current
    try { await prepareAudio() } catch (cause) { if (version === playVersion.current) onError(cause.message); return }
    if (version !== playVersion.current || !audio.current || !gameRef.current) return
    stopSequence.current?.(); audio.current.stop(); setPlaying(true); setPlayhead(gameRef.current.phase === 'listen' ? 0 : startRef.current); setListenProgress(0)
    stopSequence.current = startSequence(audio.current, () => audibleTracks(gameRef.current.tracks, gameRef.current.phase === 'edit'), gameRef.current.bpm, {
      metronome: () => gameRef.current?.phase === 'edit' && !!gameRef.current.metronome,
      loop, startPosition: gameRef.current.phase === 'listen' ? 0 : startRef.current,
      onPosition: (value) => { positionRef.current = value; setPlayhead(value) }, onProgress: setListenProgress,
      durationSeconds: gameRef.current.phase === 'listen' ? gameRef.current.listenSeconds : undefined,
      onEnd: () => { stopSequence.current = null; setPlaying(false); setPlayhead(0); onEnd?.() },
      onError: (cause) => { onError(cause.message); setPlaying(false) },
    })
  }, [onError, prepareAudio])

  const seek = useCallback((position) => {
    if (gameRef.current?.phase !== 'edit') return
    const next = Math.max(0, Math.min(15.875, Math.round(position * 8) / 8))
    startRef.current = next; positionRef.current = next; setStartPosition(next); setPlayhead(next)
    if (stopSequence.current) play()
  }, [play])

  const resetStart = useCallback(() => {
    startRef.current = 0; setStartPosition(0)
  }, [])

  return { audio, gameRef, stopSequence, prepareAudio, stop, pause, play, playing, playhead, listenProgress, startPosition, seek, resetStart }
}
