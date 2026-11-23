import type { Card as CardType } from '../types'

export default function Card({ card }: { card: CardType }) {
  return (
    <li className="rounded-lg border border-slate-200 bg-slate-50 px-3 py-2 text-sm text-slate-800 shadow-xs">
      {card.title}
    </li>
  )
}
