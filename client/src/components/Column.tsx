import { useDroppable } from '@dnd-kit/core'
import { SortableContext, verticalListSortingStrategy } from '@dnd-kit/sortable'
import type { Column as ColumnType } from '../types'
import AddInput from './AddInput'
import Card from './Card'

type Props = {
  column: ColumnType
  onAddCard: (columnId: string, title: string) => Promise<void>
}

export default function Column({ column, onAddCard }: Props) {
  // The column itself is also a drop target, so a card can be dropped into an
  // empty column (where there are no cards to drop onto).
  const { setNodeRef } = useDroppable({ id: column.id, data: { type: 'column' } })

  return (
    // shrink-0 + fixed width keeps every column the same size; the row
    // scrolls sideways instead of squashing them.
    <section
      ref={setNodeRef}
      className="flex w-72 shrink-0 flex-col gap-2 rounded-xl bg-white p-3 shadow-sm"
    >
      <h2 className="px-1 text-sm font-semibold text-slate-700">{column.title}</h2>

      {/* One sortable list per column. `items` must be the card ids in the
          order they're shown. Cards arrive sorted by position from the server. */}
      <SortableContext
        id={column.id}
        items={column.cards.map((c) => c.id)}
        strategy={verticalListSortingStrategy}
      >
        {/* min-h gives an empty column some room to drop into. */}
        <ul className="flex min-h-2 flex-col gap-2">
          {column.cards.map((card) => (
            <Card key={card.id} card={card} />
          ))}
        </ul>
      </SortableContext>

      <AddInput placeholder="+ Add a card" onAdd={(title) => onAddCard(column.id, title)} />
    </section>
  )
}
