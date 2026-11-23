import type { Column as ColumnType } from '../types'
import AddInput from './AddInput'
import Card from './Card'

type Props = {
  column: ColumnType
  onAddCard: (columnId: string, title: string) => Promise<void>
}

export default function Column({ column, onAddCard }: Props) {
  return (
    // shrink-0 + fixed width keeps every column the same size; the row
    // scrolls sideways instead of squashing them.
    <section className="flex w-72 shrink-0 flex-col gap-2 rounded-xl bg-white p-3 shadow-sm">
      <h2 className="px-1 text-sm font-semibold text-slate-700">{column.title}</h2>

      {/* Cards already arrive sorted by position from the server. */}
      <ul className="flex flex-col gap-2">
        {column.cards.map((card) => (
          <Card key={card.id} card={card} />
        ))}
      </ul>

      <AddInput
        placeholder="+ Add a card"
        onAdd={(title) => onAddCard(column.id, title)}
      />
    </section>
  )
}
