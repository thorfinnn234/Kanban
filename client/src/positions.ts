import type { Card, Column } from './types'

const GAP = 1000

// The position for a card placed between `above` and `below` (either can be
// missing). Positions are spaced out, so a card can always be slotted between
// two others without renumbering the rest of the column.
export function positionBetween(above: number | undefined, below: number | undefined): number {
  if (above === undefined && below === undefined) return GAP // empty column
  if (above === undefined) return below! / 2 // dropped at the top
  if (below === undefined) return above + GAP // dropped at the end
  return (above + below) / 2
}

export function findCard(columns: Column[], cardId: string): Card | undefined {
  for (const column of columns) {
    const card = column.cards.find((c) => c.id === cardId)
    if (card) return card
  }
  return undefined
}

// Returns new columns with `card` taken out of whichever column held it and
// put into `card.columnId` at the place its position says. Used both to apply
// a move and to undo one (by putting back the card as it was).
export function putCard(columns: Column[], card: Card): Column[] {
  return columns.map((column) => {
    const cards = column.cards.filter((c) => c.id !== card.id)
    if (column.id === card.columnId) {
      cards.push(card)
      cards.sort((a, b) => a.position - b.position)
    }
    return { ...column, cards }
  })
}
