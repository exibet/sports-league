// Search that ignores case, whitespace and diacritics, with highlight ranges in the original text.
// Every folded character remembers where it came from, so a match in folded text maps back to
// exact original indices. Matching is `includes` / `split`: no regex is built from the query.

/** A half-open `[start, end)` range of original string indices. */
type TextRange = [start: number, end: number]

interface FoldedChar {
  char: string
  start: number
  end: number
}

/** A base character with the combining marks (accents) that follow it. */
const CHARACTER = /\P{M}\p{M}*/gu

function foldChars(input: string): FoldedChar[] {
  const chars = [...input.matchAll(CHARACTER)].flatMap(({ 0: original, index }) =>
    [...original.normalize('NFD').replace(/\p{M}/gu, '').toLowerCase()].map(char => ({
      char: /\s/.test(char) ? ' ' : char,
      start: index,
      end: index + original.length,
    })),
  )
  // Collapse whitespace runs into one space and trim the start; then trim the end.
  const collapsed = chars.filter((char, i) => char.char !== ' ' || (i > 0 && chars[i - 1]?.char !== ' '))
  return collapsed.at(-1)?.char === ' ' ? collapsed.slice(0, -1) : collapsed
}

const joined = (chars: FoldedChar[]) => chars.map(({ char }) => char).join('')

/** Lowercase, trimmed, inner whitespace collapsed, diacritics removed. */
export function foldText(input: string): string {
  return joined(foldChars(input))
}

/** Whether `text` contains `query`; an empty or whitespace-only query matches everything. */
export function matchesQuery(text: string, query: string): boolean {
  return foldText(text).includes(foldText(query))
}

/** Every non-overlapping occurrence of `query` in `text`, in original string indices. */
export function highlightRanges(text: string, query: string): TextRange[] {
  const needle = foldText(query)
  if (!needle) return []
  const chars = foldChars(text)
  // Each piece but the last is followed by one occurrence of the needle.
  const pieces = joined(chars).split(needle).slice(0, -1)
  return pieces.reduce<{ offset: number, ranges: TextRange[] }>(({ offset, ranges }, piece) => {
    const from = offset + piece.length
    const to = from + needle.length
    return { offset: to, ranges: [...ranges, [chars[from]!.start, chars[to - 1]!.end]] }
  }, { offset: 0, ranges: [] }).ranges
}
