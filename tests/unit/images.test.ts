import { describe, expect, it } from 'vitest'
import { fitWithin } from '@/lib/ops/images'

describe('Foto verkleinern', () => {
  it('begrenzt die längere Kante und behält das Seitenverhältnis', () => {
    expect(fitWithin(4032, 3024, 1600)).toEqual({ width: 1600, height: 1200 })
    expect(fitWithin(3024, 4032, 1600)).toEqual({ width: 1200, height: 1600 })
    expect(fitWithin(4032, 3024, 400)).toEqual({ width: 400, height: 300 })
  })
  it('vergrößert kleine Bilder nicht', () => {
    expect(fitWithin(800, 600, 1600)).toEqual({ width: 800, height: 600 })
  })
})
