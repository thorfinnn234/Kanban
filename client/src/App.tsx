import { useEffect, useState, type FormEvent } from 'react'
import * as api from './api'
import Board from './components/Board'
import { findCard, positionBetween, putCard } from './positions'
import type { Board as BoardType, Column as ColumnType } from './types'

// The screen is always in exactly one of these states, which is easier to
// reason about than separate `loading`, `error` and `board` variables.
type State =
  | { status: 'loading' }
  | { status: 'error'; message: string }
  | { status: 'empty' } // the server has no boards yet
  | { status: 'ready'; board: BoardType }

// Fetch the board list, then load the first board in full.
async function loadFirstBoard(): Promise<State> {
  const boards = await api.getBoards()
  if (boards.length === 0) return { status: 'empty' }
  const board = await api.getBoard(boards[0].id)
  return { status: 'ready', board }
}

export default function App() {
  const [state, setState] = useState<State>({ status: 'loading' })
  const [moveError, setMoveError] = useState<string | null>(null)

  // Used by "Try again" and after creating the first board.
  function load() {
    setState({ status: 'loading' })
    return loadFirstBoard()
      .then(setState)
      .catch((err: Error) => setState({ status: 'error', message: err.message }))
  }

  // Initial load. State already starts as 'loading', so we only set it once the
  // request finishes. `ignore` drops a late response if the component unmounts
  // first (React's StrictMode does exactly that once in development).
  useEffect(() => {
    let ignore = false
    loadFirstBoard()
      .catch((err: Error): State => ({ status: 'error', message: err.message }))
      .then((next) => {
        if (!ignore) setState(next)
      })
    return () => {
      ignore = true
    }
  }, [])

  async function createFirstBoard(title: string) {
    await api.createBoard(title)
    await load()
  }

  // After the server saves the new column, add it to the board we already have
  // in state, instead of refetching the whole board.
  async function addColumn(title: string) {
    if (state.status !== 'ready') return
    const column = await api.createColumn(state.board.id, title)
    setState((s) =>
      s.status === 'ready'
        ? { ...s, board: { ...s.board, columns: [...s.board.columns, { ...column, cards: [] }] } }
        : s,
    )
  }

  async function addCard(columnId: string, title: string) {
    const card = await api.createCard(columnId, title)
    setState((s) =>
      s.status === 'ready'
        ? {
            ...s,
            board: {
              ...s.board,
              columns: s.board.columns.map((col) =>
                col.id === columnId ? { ...col, cards: [...col.cards, card] } : col,
              ),
            },
          }
        : s,
    )
  }

  // Move a card so it ends up at `toIndex` in `toColumnId`. The screen updates
  // straight away; if the server rejects the move, the card goes back.
  async function moveCard(cardId: string, toColumnId: string, toIndex: number) {
    if (state.status !== 'ready') return
    const columns = state.board.columns
    const original = findCard(columns, cardId)
    const target = columns.find((c) => c.id === toColumnId)
    if (!original || !target) return

    // Dropped back where it started: nothing to save.
    if (original.columnId === toColumnId && target.cards.findIndex((c) => c.id === cardId) === toIndex)
      return

    // The neighbours it lands between, ignoring the card itself.
    const others = target.cards.filter((c) => c.id !== cardId)
    const position = positionBetween(others[toIndex - 1]?.position, others[toIndex]?.position)
    const moved = { ...original, columnId: toColumnId, position }

    setMoveError(null)
    updateColumns((cols) => putCard(cols, moved))
    try {
      await api.moveCard(cardId, toColumnId, position)
    } catch (err) {
      updateColumns((cols) => putCard(cols, original))
      setMoveError(err instanceof Error ? err.message : 'Something went wrong')
    }
  }

  function updateColumns(change: (columns: ColumnType[]) => ColumnType[]) {
    setState((s) =>
      s.status === 'ready' ? { ...s, board: { ...s.board, columns: change(s.board.columns) } } : s,
    )
  }

  return (
    <main className="min-h-screen bg-slate-100">
      {state.status === 'loading' && <p className="p-6 text-slate-500">Loading…</p>}

      {state.status === 'error' && (
        <div className="p-6">
          <p className="mb-3 text-red-600">{state.message}</p>
          <button
            onClick={load}
            className="rounded-lg bg-white px-3 py-1.5 text-sm text-slate-700 shadow-sm hover:bg-slate-50"
          >
            Try again
          </button>
        </div>
      )}

      {state.status === 'empty' && <CreateFirstBoard onCreate={createFirstBoard} />}

      {state.status === 'ready' && moveError && (
        <div role="alert" className="flex items-center gap-3 bg-red-50 px-6 py-2 text-sm text-red-700">
          <span>Couldn't move the card: {moveError}</span>
          <button onClick={() => setMoveError(null)} className="underline hover:no-underline">
            Dismiss
          </button>
        </div>
      )}

      {state.status === 'ready' && (
        <Board
          board={state.board}
          onAddColumn={addColumn}
          onAddCard={addCard}
          onMoveCard={moveCard}
        />
      )}
    </main>
  )
}

function CreateFirstBoard({ onCreate }: { onCreate: (title: string) => Promise<void> }) {
  const [title, setTitle] = useState('My board')
  const [saving, setSaving] = useState(false)
  const [error, setError] = useState<string | null>(null)

  async function handleSubmit(e: FormEvent) {
    e.preventDefault()
    setSaving(true)
    setError(null)
    try {
      await onCreate(title)
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Something went wrong')
      setSaving(false)
    }
  }

  return (
    <form onSubmit={handleSubmit} className="flex flex-col items-center gap-3 pt-32">
      <p className="text-slate-500">You don't have any boards yet.</p>
      <input
        value={title}
        onChange={(e) => setTitle(e.target.value)}
        aria-label="Board title"
        className="w-64 rounded-lg border border-slate-300 bg-white px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-400"
      />
      <button
        type="submit"
        disabled={saving || !title.trim()}
        className="rounded-lg bg-blue-600 px-4 py-2 text-sm font-medium text-white hover:bg-blue-700 disabled:opacity-60"
      >
        {saving ? 'Creating…' : 'Create your first board'}
      </button>
      {error && <p className="text-sm text-red-600">{error}</p>}
    </form>
  )
}
