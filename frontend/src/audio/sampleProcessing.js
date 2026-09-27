// Compensate quiet recordings once at load time, preserving the user's volume control.
export function applySampleGain(buffer, gain = 1) {
  if (gain === 1) return
  for (let channel = 0; channel < buffer.numberOfChannels; channel++) {
    const data = buffer.getChannelData(channel)
    for (let i = 0; i < data.length; i++) data[i] *= gain
  }
}

export function sustainChannels(buffer, { start, end }) {
  const first = Math.round(start * buffer.sampleRate), last = Math.round(end * buffer.sampleRate)
  const fade = Math.min(Math.round(buffer.sampleRate * 0.008), first, last - first)
  return Array.from({ length: buffer.numberOfChannels }, (_, channel) => {
    const data = new Float32Array(buffer.getChannelData(channel))
    // Blend the loop exit into the samples just before the entry, avoiding a hard seam.
    for (let i = 0; i < fade; i++) {
      const weight = (i + 1) / fade
      data[last - fade + i] = data[last - fade + i] * (1 - weight) + data[first - fade + i] * weight
    }
    return data
  })
}
