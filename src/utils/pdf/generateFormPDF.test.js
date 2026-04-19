/**
 * Unit tests for generateFormPDF
 */

import { describe, it, expect } from 'vitest'
import { generateFormPDF, downloadPDF } from './generateFormPDF.js'
import { lookupScore } from '../scoring/scoringEngine.js'
import { calculateAge, getAgeBracket } from '../scoring/constants.js'

// Mock demographics, S-code decoded data, and component scores
const mockDemographics = {
  dob: '2000-01-15',
  gender: 'M',
}

const mockDecoded = {
  date: new Date('2026-04-15'),
  cardio: { exercise: '2mile_run', value: 1140 },
  strength: { exercise: 'pushups', value: 55 },
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
      points: 36,
      maxPoints: 50,
      pass: true,
      tested: true,
      exempt: false,
      walkOnly: false,
    },
    {
      type: 'strength',
      exercise: 'pushups',
      value: 55,
      points: 12,
      maxPoints: 15,
      pass: true,
      tested: true,
      exempt: false,
    },
    {
      type: 'core',
      exercise: 'situps',
      value: 55,
      points: 14.5,
      maxPoints: 15,
      pass: true,
      tested: true,
      exempt: false,
    },
    {
      type: 'bodyComp',
      exercise: 'whtr',
      value: 0.464,
      points: 20,
      maxPoints: 20,
      pass: true,
      tested: true,
      exempt: false,
      whtr: 0.464,
    },
  ],
  composite: {
    composite: 82.5,
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

describe('score validation - mock fixtures match scoring engine', () => {
  const age = calculateAge(mockDemographics.dob, mockDecoded.date)
  const bracket = getAgeBracket(age)
  const gender = mockDemographics.gender

  it('cardio score matches engine lookup', () => {
    const comp = mockScores.components.find(c => c.type === 'cardio')
    const result = lookupScore(comp.exercise, comp.value, gender, bracket)
    expect(result.points).toBe(comp.points)
  })

  it('strength score matches engine lookup', () => {
    const comp = mockScores.components.find(c => c.type === 'strength')
    const result = lookupScore(comp.exercise, comp.value, gender, bracket)
    expect(result.points).toBe(comp.points)
  })

  it('core score matches engine lookup', () => {
    const comp = mockScores.components.find(c => c.type === 'core')
    const result = lookupScore(comp.exercise, comp.value, gender, bracket)
    expect(result.points).toBe(comp.points)
  })

  it('body comp score matches engine lookup', () => {
    const comp = mockScores.components.find(c => c.type === 'bodyComp')
    const result = lookupScore(comp.exercise, comp.value, gender, bracket)
    expect(result.points).toBe(comp.points)
  })

  it('composite matches sum of components', () => {
    const earned = mockScores.components.reduce((sum, c) => sum + c.points, 0)
    const possible = mockScores.components.reduce((sum, c) => sum + c.maxPoints, 0)
    const expected = Math.round((earned / possible) * 1000) / 10
    expect(mockScores.composite.composite).toBe(expected)
  })
})

describe('downloadPDF', () => {
  it('should be a function', () => {
    expect(typeof downloadPDF).toBe('function')
    // Cannot exercise the actual download path in jsdom without mocking the DOM URL APIs.
  })
})
