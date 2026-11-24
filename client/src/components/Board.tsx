import { useState } from 'react'
import {
  closestCorners,
  DndContext,
  DragOverlay,
  KeyboardSensor,
  MouseSensor,
  TouchSensor,
  useSensor,
  useSensors,
  type DragEndEvent,
  type DragOverEvent,
  type DragStartEvent,
  type UniqueIdentifier,
} from '@dnd-kit/core'
import { sortableKeyboardCoordinates } from '@dnd-kit/sortable'
import { findCard } from '../positions'
import type { Board as BoardType, Card as CardType, Column as ColumnType } from '../types'
import AddInput from './AddInput'
import Column from './Column'
import { CardPreview } from './Card'

type Props = {
  board: BoardType
  onAddColumn: (title: string) => Promise<void>
  onAddCard: (columnId: string, title: string) => Promise<void>
  // Called once when a card is dropped: put it at `toIndex` in `toColumnId`.
  onMoveCard: (cardId: string, toColumnId: string, toIndex: number) => void
}

// `id` is either a column id (hovering over a column) or a card id (hovering
// over a card). Either way, return the id of the column it belongs to.
function columnIdOf(columns: ColumnType[], id: UniqueIdentifier): string | undefined {
  if (columns.some((c) => c.id === id)) return String(id)
  return columns.find((c) => c.cards.some((card) => card.id === id))?.id
}

export default function Board({ board, onAddColumn, onAddCard, onMoveCard }: Props) {
  // While a card is being dragged between columns, we show it in the column
  // it's hovering over. That in-progress layout lives here, not in App, so
  // nothing is saved until the card is actually dropped.
  const [dragColumns, setDragColumns] = useState<ColumnType[] | null>(null)
  const [activeCard, setActiveCard] = useState<CardType | null>(null)
  const columns = dragColumns ?? board.columns

  const sensors = useSensors(
    // Only start dragging after 5px of movement, so clicking a card still works.
    useSensor(MouseSensor, { activationConstraint: { distance: 5 } }),
    // On touch screens, press and hold to drag, so swiping still scrolls.
    useSensor(TouchSensor, { activationConstraint: { delay: 200, tolerance: 5 } }),
    // Tab to a card, Space to pick up, arrow keys to move, Space to drop.
    useSensor(KeyboardSensor, { coordinateGetter: sortableKeyboardCoordinates }),
  )

  function handleDragStart({ active }: DragStartEvent) {
    setActiveCard(findCard(board.columns, String(active.id)) ?? null)
    setDragColumns(board.columns)
  }

  // Fires as the card moves over things. We only act when it crosses into a
  // different column; reordering inside one column is animated by
  // SortableContext on its own.
  function handleDragOver({ active, over }: DragOverEvent) {
    if (!over || !dragColumns) return
    const fromId = columnIdOf(dragColumns, active.id)
    const toId = columnIdOf(dragColumns, over.id)
    if (!fromId || !toId || fromId === toId) return

    const card = findCard(dragColumns, String(active.id))
    const toCards = dragColumns.find((c) => c.id === toId)!.cards
    if (!card) return

    // Over a card: go above it, or below it if the pointer is past its middle.
    // Over the column itself (e.g. it's empty): go to the end.
    const overIndex = toCards.findIndex((c) => c.id === over.id)
    let index = toCards.length
    if (overIndex !== -1) {
      const dragged = active.rect.current.translated
      const below = dragged !== null && dragged.top > over.rect.top + over.rect.height / 2
      index = overIndex + (below ? 1 : 0)
    }

    setDragColumns(
      dragColumns.map((column) => {
        if (column.id === fromId) return { ...column, cards: column.cards.filter((c) => c.id !== card.id) }
        if (column.id === toId) {
          const cards = [...column.cards]
          cards.splice(index, 0, card)
          return { ...column, cards }
        }
        return column
      }),
    )
  }

  // Fires once, on drop. By now handleDragOver has already put the card in
  // the right column, so we just need its final index there.
  function handleDragEnd({ active, over }: DragEndEvent) {
    const finalColumns = dragColumns
    setDragColumns(null)
    setActiveCard(null)
    if (!over || !finalColumns) return

    const columnId = columnIdOf(finalColumns, active.id)
    const column = finalColumns.find((c) => c.id === columnId)
    if (!column) return

    const oldIndex = column.cards.findIndex((c) => c.id === active.id)
    const overIndex = column.cards.findIndex((c) => c.id === over.id)
    // Dropped on another card: take its index (the cards between shift over
    // by one, which is what SortableContext was already showing). Dropped on
    // the column itself: keep the spot handleDragOver gave it.
    const newIndex = overIndex === -1 ? oldIndex : overIndex

    // App updates the board in the same render that clears dragColumns, so
    // the card doesn't flash back to where it started.
    onMoveCard(String(active.id), column.id, newIndex)
  }

  function handleDragCancel() {
    setDragColumns(null)
    setActiveCard(null)
  }

  return (
    <DndContext
      sensors={sensors}
      // Recommended for kanban: picks the card under the pointer instead of
      // the whole column around it.
      collisionDetection={closestCorners}
      onDragStart={handleDragStart}
      onDragOver={handleDragOver}
      onDragEnd={handleDragEnd}
      onDragCancel={handleDragCancel}
    >
      <div className="flex h-full flex-col">
        <h1 className="px-6 pt-6 text-xl font-bold text-slate-800">{board.title}</h1>

        {/* items-start stops short columns stretching to the tallest one's height. */}
        <div className="flex flex-1 items-start gap-4 overflow-x-auto p-6">
          {columns.map((column) => (
            <Column key={column.id} column={column} onAddCard={onAddCard} />
          ))}

          <div className="w-72 shrink-0 rounded-xl bg-slate-200/70 p-2">
            <AddInput placeholder="+ Add a column" onAdd={onAddColumn} />
          </div>
        </div>
      </div>

      {/* Draws the dragged card above everything, following the pointer, so it
          isn't clipped by the scrolling row or hidden behind other columns. */}
      <DragOverlay>{activeCard && <CardPreview card={activeCard} />}</DragOverlay>
    </DndContext>
  )
}
