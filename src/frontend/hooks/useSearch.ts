import { useMemo } from 'react'

export interface SearchResult<T> {
  item: T
  score: number
  matches: Array<{ start: number; end: number }>
}

/**
 * Simple fuzzy matching algorithm
 * Returns a score based on how well the query matches the text
 * Higher score = better match
 */
export function fuzzyMatch(text: string, query: string): { score: number; matches: Array<{ start: number; end: number }> } | null {
  if (!text || !query) return null

  const lowerText = text.toLowerCase()
  const lowerQuery = query.toLowerCase()

  // Exact match gets highest score
  if (lowerText === lowerQuery) {
    return { score: 1000, matches: [{ start: 0, end: text.length }] }
  }

  // Starts with query gets high score
  if (lowerText.startsWith(lowerQuery)) {
    return { score: 800 + (query.length / text.length) * 100, matches: [{ start: 0, end: query.length }] }
  }

  // Contains query as substring
  const substringIndex = lowerText.indexOf(lowerQuery)
  if (substringIndex !== -1) {
    return { score: 500 + (query.length / text.length) * 100, matches: [{ start: substringIndex, end: substringIndex + query.length }] }
  }

  // Word boundary match (query matches start of any word)
  const words = lowerText.split(/[\s\-_./]+/)
  let wordStart = 0
  for (const word of words) {
    if (word.startsWith(lowerQuery)) {
      const actualStart = lowerText.indexOf(word, wordStart)
      return { score: 400 + (query.length / word.length) * 50, matches: [{ start: actualStart, end: actualStart + query.length }] }
    }
    wordStart += word.length + 1
  }

  // Fuzzy character match - all query characters must appear in order
  let textIndex = 0
  let queryIndex = 0
  const matches: Array<{ start: number; end: number }> = []
  let currentMatchStart = -1

  while (textIndex < lowerText.length && queryIndex < lowerQuery.length) {
    if (lowerText[textIndex] === lowerQuery[queryIndex]) {
      if (currentMatchStart === -1) {
        currentMatchStart = textIndex
      }
      queryIndex++
    } else if (currentMatchStart !== -1) {
      matches.push({ start: currentMatchStart, end: textIndex })
      currentMatchStart = -1
    }
    textIndex++
  }

  // Close any open match
  if (currentMatchStart !== -1) {
    matches.push({ start: currentMatchStart, end: textIndex })
  }

  // All query characters must be found
  if (queryIndex === lowerQuery.length) {
    // Score based on:
    // - How compact the matches are (fewer gaps = better)
    // - How much of the text is matched
    const matchedLength = matches.reduce((acc, m) => acc + (m.end - m.start), 0)
    const totalSpan = matches.length > 0 ? matches[matches.length - 1].end - matches[0].start : 0
    const compactness = matchedLength / Math.max(totalSpan, 1)
    const coverage = query.length / text.length

    return {
      score: 100 + compactness * 100 + coverage * 50,
      matches,
    }
  }

  return null
}

/**
 * Search through items with fuzzy matching
 */
export function fuzzySearch<T>(
  items: T[],
  query: string,
  getSearchText: (item: T) => string,
  maxResults = 50
): SearchResult<T>[] {
  if (!query.trim()) return []

  const results: SearchResult<T>[] = []

  for (const item of items) {
    const text = getSearchText(item)
    const match = fuzzyMatch(text, query)

    if (match) {
      results.push({
        item,
        score: match.score,
        matches: match.matches,
      })
    }
  }

  // Sort by score (highest first) and limit results
  return results
    .sort((a, b) => b.score - a.score)
    .slice(0, maxResults)
}

/**
 * Hook for fuzzy searching with memoization
 */
export function useSearch<T>(
  items: T[],
  query: string,
  getSearchText: (item: T) => string,
  maxResults = 50
): SearchResult<T>[] {
  return useMemo(
    () => fuzzySearch(items, query, getSearchText, maxResults),
    [items, query, getSearchText, maxResults]
  )
}

/**
 * Highlight matched portions of text
 */
export function highlightMatches(
  text: string,
  matches: Array<{ start: number; end: number }>
): Array<{ text: string; highlighted: boolean }> {
  if (!text || matches.length === 0) {
    return [{ text: text ?? '', highlighted: false }]
  }

  const result: Array<{ text: string; highlighted: boolean }> = []
  let lastEnd = 0

  for (const match of matches) {
    if (match.start > lastEnd) {
      result.push({ text: text.slice(lastEnd, match.start), highlighted: false })
    }
    result.push({ text: text.slice(match.start, match.end), highlighted: true })
    lastEnd = match.end
  }

  if (lastEnd < text.length) {
    result.push({ text: text.slice(lastEnd), highlighted: false })
  }

  return result
}
