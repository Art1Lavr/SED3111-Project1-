import { MIN_NOTE, STEPS, stepSeconds } from '../game/model.js'

// The JS timer looks ahead; the audio clock determines when notes actually sound.
export function startSequence(engine, getTracks, bpm, { loop = true, startPosition = 0, durationSeconds, onProgress, onPosition, onEnd, onError, metronome = () => false, scheduler = globalThis } = {}) {
  const stepDuration = stepSeconds(bpm)
  const tickDuration = stepDuration * MIN_NOTE
  const ticksPerLoop = STEPS / MIN_NOTE
  const duration = durationSeconds ?? (loop ? Infinity : STEPS * stepDuration)
  const startTime = engine.clock() + 0.08 - startPosition * stepDuration
  let step = Math.ceil(startPosition / MIN_NOTE)
  let stopped = false
  let initial = true
  let frame, timer
  function stop() {
    if (stopped) return
    stopped = true
    scheduler.clearInterval(timer)
    scheduler.cancelAnimationFrame(frame)
    engine.stop()
  }
  function schedule() {
    if (stopped) return
    const current = engine.clock()
    // Do not burst a backlog of notes if the browser tab was suspended.
    step = Math.max(step, Math.floor(Math.max(0, current - startTime) / tickDuration))
    try {
      if (initial) {
        initial = false
        if (startPosition > 0) for (const track of getTracks()) {
          if (track.muted) continue
          for (const note of [...track.notes].sort((a, b) => a.start - b.start)) {
            if (note.start >= startPosition || note.start + note.length <= startPosition) continue
            engine.schedule(track.instrumentId, track.sampleId, {
              time: startTime + startPosition * stepDuration, channelId: track.id, volume: track.volume,
              semitones: note.pitch + track.transpose, pitched: true, monophonic: track.cutSelf,
              offsetSeconds: (startPosition - note.start) * stepDuration,
              noteDuration: (note.start + note.length - startPosition) * stepDuration,
            })
          }
        }
      }
      while (step * tickDuration < duration && startTime + step * tickDuration < current + 0.12) {
        const position = (step % ticksPerLoop) * MIN_NOTE
        const time = startTime + step * tickDuration
        if (position % 2 === 0 && metronome()) engine.click(time, position % 8 === 0)
        for (const track of getTracks()) {
          if (track.muted) continue
          for (const note of track.notes.filter((note) => note.start === position)) {
            engine.schedule(track.instrumentId, track.sampleId, {
              time, channelId: track.id, volume: track.volume,
              semitones: note.pitch + track.transpose, pitched: true,
              noteDuration: Math.min(note.length * stepDuration, duration - step * tickDuration),
              monophonic: track.cutSelf,
            })
          }
        }
        step++
      }
    } catch (error) { stop(); onError?.(error) }
  }
  function draw() {
    if (stopped) return
    const elapsed = Math.max(0, engine.clock() - startTime)
    onProgress?.(Number.isFinite(duration) ? Math.min(1, elapsed / duration) : 0)
    if (elapsed >= duration) { stop(); onPosition?.(STEPS); onEnd?.(); return }
    onPosition?.(elapsed / stepDuration % STEPS)
    frame = scheduler.requestAnimationFrame(draw)
  }
  timer = scheduler.setInterval(schedule, 25)
  schedule()
  frame = scheduler.requestAnimationFrame(draw)
  return stop
}
