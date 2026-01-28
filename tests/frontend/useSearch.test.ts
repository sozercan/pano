import { describe, test, expect } from 'bun:test'
import { fuzzyMatch, fuzzySearch, highlightMatches } from '@frontend/hooks/useSearch'

describe('fuzzyMatch', () => {
  test('returns null for non-matching strings', () => {
    expect(fuzzyMatch('hello', 'xyz')).toBeNull()
    expect(fuzzyMatch('test', 'abc')).toBeNull()
  })

  test('returns exact match with highest score', () => {
    const result = fuzzyMatch('hello', 'hello')
    expect(result).not.toBeNull()
    expect(result!.score).toBe(1000)
    expect(result!.matches).toEqual([{ start: 0, end: 5 }])
  })

  test('matches are case insensitive', () => {
    const result = fuzzyMatch('HELLO', 'hello')
    expect(result).not.toBeNull()
    expect(result!.score).toBe(1000)
  })

  test('starts-with match gets high score', () => {
    const result = fuzzyMatch('kubernetes', 'kube')
    expect(result).not.toBeNull()
    expect(result!.score).toBeGreaterThan(800)
    expect(result!.matches).toEqual([{ start: 0, end: 4 }])
  })

  test('substring match works', () => {
    const result = fuzzyMatch('sig-release-main', 'release')
    expect(result).not.toBeNull()
    expect(result!.score).toBeGreaterThan(500)
    expect(result!.matches[0].start).toBe(4) // 'release' starts at index 4
  })

  test('word boundary match works', () => {
    const result = fuzzyMatch('sig-release-main', 'main')
    expect(result).not.toBeNull()
    expect(result!.matches[0].start).toBe(12)
  })

  test('fuzzy character match works', () => {
    const result = fuzzyMatch('sig-release', 'srl')
    expect(result).not.toBeNull()
    expect(result!.matches.length).toBeGreaterThan(0)
  })

  test('fuzzy match requires all characters in order', () => {
    // 'srm' is not in order in 'sig-release'
    const result1 = fuzzyMatch('sig-release', 'abc')
    expect(result1).toBeNull()

    // 'sre' is in order in 'sig-release' (s-ig-r-e-lease)
    const result2 = fuzzyMatch('sig-release', 'sre')
    expect(result2).not.toBeNull()
  })

  test('score reflects match quality', () => {
    const exact = fuzzyMatch('test', 'test')
    const prefix = fuzzyMatch('testing', 'test')
    const substring = fuzzyMatch('atestb', 'test')
    const fuzzy = fuzzyMatch('t-e-s-t', 'test')

    expect(exact!.score).toBeGreaterThan(prefix!.score)
    expect(prefix!.score).toBeGreaterThan(substring!.score)
    expect(substring!.score).toBeGreaterThan(fuzzy!.score)
  })
})

describe('fuzzySearch', () => {
  const items = [
    { name: 'sig-release' },
    { name: 'sig-testing' },
    { name: 'kubernetes' },
    { name: 'kind-master' },
    { name: 'sig-api-machinery' },
  ]

  test('returns empty array for empty query', () => {
    const results = fuzzySearch(items, '', (item) => item.name)
    expect(results).toEqual([])
  })

  test('returns empty array for whitespace query', () => {
    const results = fuzzySearch(items, '   ', (item) => item.name)
    expect(results).toEqual([])
  })

  test('finds exact matches', () => {
    const results = fuzzySearch(items, 'kubernetes', (item) => item.name)
    expect(results).toHaveLength(1)
    expect(results[0].item.name).toBe('kubernetes')
  })

  test('finds partial matches', () => {
    const results = fuzzySearch(items, 'sig', (item) => item.name)
    expect(results.length).toBeGreaterThanOrEqual(3)
    expect(results.every((r) => r.item.name.includes('sig'))).toBe(true)
  })

  test('results are sorted by score (highest first)', () => {
    const results = fuzzySearch(items, 'sig', (item) => item.name)

    for (let i = 1; i < results.length; i++) {
      expect(results[i - 1].score).toBeGreaterThanOrEqual(results[i].score)
    }
  })

  test('respects maxResults limit', () => {
    const results = fuzzySearch(items, 's', (item) => item.name, 2)
    expect(results.length).toBeLessThanOrEqual(2)
  })

  test('includes match information in results', () => {
    const results = fuzzySearch(items, 'release', (item) => item.name)
    const sigRelease = results.find((r) => r.item.name === 'sig-release')

    expect(sigRelease).toBeDefined()
    expect(sigRelease!.matches).toBeDefined()
    expect(sigRelease!.matches.length).toBeGreaterThan(0)
  })
})

describe('highlightMatches', () => {
  test('returns unhighlighted text for empty matches', () => {
    const result = highlightMatches('hello world', [])
    expect(result).toEqual([{ text: 'hello world', highlighted: false }])
  })

  test('highlights single match', () => {
    const result = highlightMatches('hello world', [{ start: 0, end: 5 }])
    expect(result).toEqual([
      { text: 'hello', highlighted: true },
      { text: ' world', highlighted: false },
    ])
  })

  test('highlights multiple matches', () => {
    const result = highlightMatches('hello world', [
      { start: 0, end: 2 },
      { start: 6, end: 11 },
    ])
    expect(result).toEqual([
      { text: 'he', highlighted: true },
      { text: 'llo ', highlighted: false },
      { text: 'world', highlighted: true },
    ])
  })

  test('handles match at end of string', () => {
    const result = highlightMatches('test', [{ start: 2, end: 4 }])
    expect(result).toEqual([
      { text: 'te', highlighted: false },
      { text: 'st', highlighted: true },
    ])
  })

  test('handles match covering entire string', () => {
    const result = highlightMatches('test', [{ start: 0, end: 4 }])
    expect(result).toEqual([{ text: 'test', highlighted: true }])
  })

  test('handles adjacent matches', () => {
    const result = highlightMatches('abcd', [
      { start: 0, end: 2 },
      { start: 2, end: 4 },
    ])
    expect(result).toEqual([
      { text: 'ab', highlighted: true },
      { text: 'cd', highlighted: true },
    ])
  })
})
