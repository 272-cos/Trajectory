/**
 * Unit tests for generateFormPDF
 */

import { describe, it, expect } from 'vitest'
import { generateFormPDF, downloadPDF } from './generateFormPDF.js'

// Mock demographics, S-code decoded data, and component scores
const mockDemographics = {
  dob: '2000-01-15',
  gender: 'M',
}

const mockDecoded = {
  date: new Date('2026-04-15'),
  cardio: { exercise: '2mile_run', value: 1140 },
  strength: { exercise: 'pushups', value: 42 },
  core: { exercise: 'situps', value: 55 },
  bodyComp: { heightInches: 70, waistInches: 32.5 },
  isDiagnostic: false,
}

const mockScores = {
  components: [
    {
      type: 'cardio',
      exercise: '2mile_run',
      value: 1140,
      points: 45.5,
      maxPoints: 50,
      pass: true,
      tested: true,
      exempt: false,
      walkOnly: false,
    },
    {
      type: 'strength',
      exercise: 'pushups',
      value: 42,
      points: 13.2,
      maxPoints: 15,
      pass: true,
      tested: true,
      exempt: false,
    },
    {
      type: 'core',
      exercise: 'situps',
      value: 55,
      points: 12.8,
      maxPoints: 15,
      pass: true,
      tested: true,
      exempt: false,
    },
    {
      type: 'bodyComp',
      exercise: 'whtr',
      value: 0.464,
      points: 19.5,
      maxPoints: 20,
      pass: true,
      tested: true,
      exempt: false,
      whtr: 0.464,
    },
  ],
  composite: {
    composite: 85.6,
    pass: true,
  },
}

describe('generateFormPDF', () => {
  it('should produce a PDF byte array', async () => {
    const bytes = await generateFormPDF(mockDemographics, mockDecoded, mockScores)
    expect(bytes).toBeInstanceOf(Uint8Array)
    expect(bytes.length).toBeGreaterThan(1000)
    // PDF magic header
    expect(String.fromCharCode(bytes[0], bytes[1], bytes[2], bytes[3])).toBe('%PDF')
  })

  it('should reject if demographics is missing', async () => {
    await expect(generateFormPDF(null, mockDecoded, mockScores))
      .rejects.toThrow('Missing required parameters')
  })

  it('should reject if decoded is missing', async () => {
    await expect(generateFormPDF(mockDemographics, null, mockScores))
      .rejects.toThrow('Missing required parameters')
  })

  it('should reject if scores is missing', async () => {
    await expect(generateFormPDF(mockDemographics, mockDecoded, null))
      .rejects.toThrow('Missing required parameters')
  })

  it('should handle female gender correctly', async () => {
    const femaleDemographics = { ...mockDemographics, gender: 'F' }
    const bytes = await generateFormPDF(femaleDemographics, mockDecoded, mockScores)
    expect(bytes).toBeInstanceOf(Uint8Array)
  })

  it('should handle composite failures', async () => {
    const failingScores = {
      ...mockScores,
      composite: {
        composite: 65.2,
        pass: false,
      },
    }
    const bytes = await generateFormPDF(mockDemographics, mockDecoded, failingScores)
    expect(bytes).toBeInstanceOf(Uint8Array)
  })

  it('should handle exempt components', async () => {
    const exemptScores = {
      components: [
        {
          type: 'cardio',
          exempt: true,
          tested: false,
          pass: true,
        },
        ...mockScores.components.slice(1),
      ],
      composite: mockScores.composite,
    }
    const bytes = await generateFormPDF(mockDemographics, mockDecoded, exemptScores)
    expect(bytes).toBeInstanceOf(Uint8Array)
  })

  it('should handle walk-only cardio component', async () => {
    const walkScores = {
      components: [
        {
          type: 'cardio',
          exercise: '2km_walk',
          walkOnly: true,
          pass: true,
          tested: true,
          exempt: false,
        },
        ...mockScores.components.slice(1),
      ],
      composite: mockScores.composite,
    }
    const bytes = await generateFormPDF(mockDemographics, mockDecoded, walkScores)
    expect(bytes).toBeInstanceOf(Uint8Array)
  })
})

describe('downloadPDF', () => {
  it('should be a function', () => {
    expect(typeof downloadPDF).toBe('function')
    // Cannot exercise the actual download path in jsdom without mocking the DOM URL APIs.
  })
})
