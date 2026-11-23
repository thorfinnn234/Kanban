import type { Board as BoardType } from '../types'
import AddInput from './AddInput'
import Column from './Column'

type Props = {
  board: BoardType
  onAddColumn: (title: string) => Promise<void>
  onAddCard: (columnId: string, title: string) => Promise<void>
}

export default function Board({ board, onAddColumn, onAddCard }: Props) {
  return (
    <div className="flex h-full flex-col">
      <h1 className="px-6 pt-6 text-xl font-bold text-slate-800">{board.title}</h1>

      {/* items-start stops short columns stretching to the tallest one's height. */}
      <div className="flex flex-1 items-start gap-4 overflow-x-auto p-6">
        {board.columns.map((column) => (
          <Column key={column.id} column={column} onAddCard={onAddCard} />
        ))}

        <div className="w-72 shrink-0 rounded-xl bg-slate-200/70 p-2">
          <AddInput placeholder="+ Add a column" onAdd={onAddColumn} />
        </div>
      </div>
    </div>
  )
}
