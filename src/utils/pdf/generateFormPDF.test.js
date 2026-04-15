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
  it('should create a jsPDF document', () => {
    const pdf = generateFormPDF(mockDemographics, mockDecoded, mockScores)
    expect(pdf).toBeDefined()
    expect(pdf.internal).toBeDefined()
    expect(pdf.internal.pageSize).toBeDefined()
  })

  it('should have letter size dimensions', () => {
    const pdf = generateFormPDF(mockDemographics, mockDecoded, mockScores)
    const width = pdf.internal.pageSize.getWidth()
    const height = pdf.internal.pageSize.getHeight()
    // Letter: 8.5" x 11" = 215.9 x 279.4 mm
    expect(width).toBeCloseTo(215.9, 1)
    expect(height).toBeCloseTo(279.4, 1)
  })

  it('should throw error if demographics is missing', () => {
    expect(() => {
      generateFormPDF(null, mockDecoded, mockScores)
    }).toThrow('Missing required parameters')
  })

  it('should throw error if decoded is missing', () => {
    expect(() => {
      generateFormPDF(mockDemographics, null, mockScores)
    }).toThrow('Missing required parameters')
  })

  it('should throw error if scores is missing', () => {
    expect(() => {
      generateFormPDF(mockDemographics, mockDecoded, null)
    }).toThrow('Missing required parameters')
  })

  it('should handle female gender correctly', () => {
    const femaleDemographics = { ...mockDemographics, gender: 'F' }
    const pdf = generateFormPDF(femaleDemographics, mockDecoded, mockScores)
    expect(pdf).toBeDefined()
  })

  it('should handle composite failures', () => {
    const failingScores = {
      ...mockScores,
      composite: {
        composite: 65.2,
        pass: false,
      },
    }
    const pdf = generateFormPDF(mockDemographics, mockDecoded, failingScores)
    expect(pdf).toBeDefined()
  })

  it('should handle exempt components', () => {
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
    const pdf = generateFormPDF(mockDemographics, mockDecoded, exemptScores)
    expect(pdf).toBeDefined()
  })

  it('should handle walk-only cardio component', () => {
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
    const pdf = generateFormPDF(mockDemographics, mockDecoded, walkScores)
    expect(pdf).toBeDefined()
  })

  it('should have a valid save method', () => {
    const pdf = generateFormPDF(mockDemographics, mockDecoded, mockScores)
    expect(typeof pdf.save).toBe('function')
  })
})

describe('downloadPDF', () => {
  it('should have a save method', () => {
    expect(typeof downloadPDF).toBe('function')
    // Note: we can't test the actual download in jsdom without mocking window.open or similar
    // Just verify the function exists and accepts the right parameters
  })
})
