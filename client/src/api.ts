import type { Board, BoardSummary, Card, Column } from './types'

const API_URL = import.meta.env.VITE_API_URL

// One place for every request: sends JSON, and turns failures into an Error
// with a readable message so components can just show `error.message`.
async function request<T>(path: string, options: RequestInit = {}): Promise<T> {
  let res: Response
  try {
    res = await fetch(`${API_URL}${path}`, {
      ...options,
      headers: { 'Content-Type': 'application/json', ...options.headers },
    })
  } catch {
    // fetch only throws when no response arrived at all, e.g. server is down.
    throw new Error(`Can't reach the server at ${API_URL}. Is it running?`)
  }

  if (!res.ok) {
    // Our server sends { error: "..." }; fall back if the body isn't JSON.
    const body = await res.json().catch(() => null)
    throw new Error(body?.error ?? `Request failed (${res.status})`)
  }
  return res.json() as Promise<T>
}

export function getBoards() {
  return request<BoardSummary[]>('/boards')
}

export function getBoard(id: string) {
  return request<Board>(`/boards/${id}`)
}

export function createBoard(title: string) {
  return request<BoardSummary>('/boards', {
    method: 'POST',
    body: JSON.stringify({ title }),
  })
}

// The server returns the new column without a `cards` field.
export function createColumn(boardId: string, title: string) {
  return request<Omit<Column, 'cards'>>(`/boards/${boardId}/columns`, {
    method: 'POST',
    body: JSON.stringify({ title }),
  })
}

export function createCard(columnId: string, title: string) {
  return request<Card>(`/columns/${columnId}/cards`, {
    method: 'POST',
    body: JSON.stringify({ title }),
  })
}
