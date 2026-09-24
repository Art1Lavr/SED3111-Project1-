import { useCallback, useEffect, useRef, useState } from 'react'
import { startSequence } from '../audio/sequencer'

async function defaultEngineFactory() {
  const { createAudioEngine } = await import('../audio/audioEngine')
  return createAudioEngine()
}

export default function usePlayback(game, onError, engineFactory = defaultEngineFactory) {
  const audio = useRef(null)
  const pending = useRef(null)
  const stopSequence = useRef(null)
  const gameRef = useRef(game)
  const positionRef = useRef(0)
  const [playing, setPlaying] = useState(false)
  const [playhead, setPlayhead] = useState(0)
  const [listenProgress, setListenProgress] = useState(0)
  useEffect(() => { gameRef.current = game }, [game])

  useEffect(() => {
    let active = true
    pending.current = Promise.resolve().then(engineFactory).then((engine) => {
      if (!active) { engine.dispose(); return null }
      audio.current = engine
      return engine
    }).catch((error) => { if (active) onError(error.message); return null })
    return () => { active = false; stopSequence.current?.(); audio.current?.dispose(); audio.current = null }
  }, [engineFactory, onError])

  const prepareAudio = useCallback(async () => {
    const engine = await pending.current
    if (!engine) throw new Error('Audio could not start. Refresh and try again.')
    await engine.start()
    return engine
  }, [])

  const stop = useCallback(() => {
    stopSequence.current?.(); stopSequence.current = null
    audio.current?.stop(); positionRef.current = 0; setPlaying(false); setPlayhead(0)
  }, [])

  const pause = useCallback(() => {
    stopSequence.current?.(); stopSequence.current = null
    audio.current?.stop(); setPlaying(false)
  }, [])

  const play = useCallback((loop = true, onEnd) => {
    if (!audio.current || !gameRef.current) return
    stopSequence.current?.(); audio.current.stop(); setPlaying(true); setPlayhead(gameRef.current.phase === 'listen' ? 0 : positionRef.current); setListenProgress(0)
    stopSequence.current = startSequence(audio.current, () => gameRef.current.tracks, gameRef.current.bpm, {
      loop, startPosition: gameRef.current.phase === 'listen' ? 0 : positionRef.current,
      onPosition: (value) => { positionRef.current = value; setPlayhead(value) }, onProgress: setListenProgress,
      durationSeconds: gameRef.current.phase === 'listen' ? gameRef.current.listenSeconds : undefined,
      onEnd: () => { stopSequence.current = null; setPlaying(false); setPlayhead(0); onEnd?.() },
      onError: (cause) => { onError(cause.message); setPlaying(false) },
    })
  }, [onError])

  return { audio, gameRef, stopSequence, prepareAudio, stop, pause, play, playing, playhead, listenProgress }
}
