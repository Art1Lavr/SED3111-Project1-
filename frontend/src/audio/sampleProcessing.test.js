import test from 'node:test'
import assert from 'node:assert/strict'
import { applySampleGain, sustainChannels } from './sampleProcessing.js'

test('Quiet sample compensation applies once to both channels without changing duration', () => {
  const data = [new Float32Array([0.1, -0.05]), new Float32Array([0.05, -0.1])]
  applySampleGain({ numberOfChannels: 2, getChannelData: (i) => data[i] }, 6)
  assert.ok(Math.abs(data[0][0] - 0.6) < 0.000001)
  assert.ok(Math.abs(data[1][1] + 0.6) < 0.000001)
  assert.equal(data[0].length, 2)
})

test('Sustain blending leaves the original recording untouched and joins the loop entry', () => {
  const data = Float32Array.from({ length: 400 }, (_, i) => Math.sin(i / 7))
  const before = new Float32Array(data)
  const [loop] = sustainChannels({ sampleRate: 1000, numberOfChannels: 1, getChannelData: () => data }, { start: 0.08, end: 0.24 })
  assert.deepEqual(data, before)
  assert.equal(loop[239], data[79])
  assert.equal(loop[0], data[0])
})
