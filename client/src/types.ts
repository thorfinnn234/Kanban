// These mirror the Prisma models on the server. Dates arrive as strings
// because JSON has no Date type.

export type Card = {
  id: string
  title: string
  description: string | null
  position: number
  columnId: string
  createdAt: string
}

export type Column = {
  id: string
  title: string
  position: number
  boardId: string
  cards: Card[]
}

// What GET /boards returns: boards without their columns.
export type BoardSummary = {
  id: string
  title: string
  createdAt: string
}

// What GET /boards/:id returns: a board with columns and cards included.
export type Board = BoardSummary & {
  columns: Column[]
}
