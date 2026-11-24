import { useSortable } from '@dnd-kit/sortable'
import type { Card as CardType } from '../types'

const cardClass =
  'rounded-lg border border-slate-200 bg-slate-50 px-3 py-2 text-sm text-slate-800 shadow-xs'

// A card in a column that can be picked up and dragged.
export default function Card({ card }: { card: CardType }) {
  // useSortable registers this card with the nearest SortableContext. It gives
  // back the ref and event handlers to attach, plus the offset (`transform`)
  // to apply while other cards make room for the one being dragged.
  const { setNodeRef, attributes, listeners, transform, transition, isDragging } = useSortable({
    id: card.id,
    data: { type: 'card' },
  })

  return (
    <li
      ref={setNodeRef}
      style={{
        transform: transform ? `translate3d(${transform.x}px, ${transform.y}px, 0)` : undefined,
        transition,
      }}
      {...attributes}
      {...listeners}
      // While dragging, this stays in the list as a faded placeholder showing
      // where the card will land; the copy under the pointer is CardPreview.
      className={`${cardClass} cursor-grab focus:outline-none focus-visible:ring-2 focus-visible:ring-blue-400 ${isDragging ? 'opacity-40' : ''}`}
    >
      {card.title}
    </li>
  )
}

// The copy of the card that follows the pointer (rendered in DragOverlay).
export function CardPreview({ card }: { card: CardType }) {
  return <div className={`${cardClass} cursor-grabbing shadow-lg rotate-2`}>{card.title}</div>
}
