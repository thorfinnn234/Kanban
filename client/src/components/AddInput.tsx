import { useState, type KeyboardEvent } from 'react'

type Props = {
  placeholder: string
  // Should create the item; if it throws, the error is shown under the input.
  onAdd: (title: string) => Promise<void>
}

// A text input that calls onAdd when you press Enter.
// Used for both "+ Add a card" and "+ Add a column".
export default function AddInput({ placeholder, onAdd }: Props) {
  const [text, setText] = useState('')
  const [saving, setSaving] = useState(false)
  const [error, setError] = useState<string | null>(null)

  async function handleKeyDown(e: KeyboardEvent<HTMLInputElement>) {
    if (e.key === 'Escape') {
      setText('')
      setError(null)
      return
    }
    if (e.key !== 'Enter' || saving) return

    const title = text.trim()
    if (!title) return

    setSaving(true)
    setError(null)
    try {
      await onAdd(title)
      setText('') // only clear on success, so a failed title isn't lost
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Something went wrong')
    } finally {
      setSaving(false)
    }
  }

  return (
    <div>
      <input
        value={text}
        onChange={(e) => setText(e.target.value)}
        onKeyDown={handleKeyDown}
        placeholder={placeholder}
        disabled={saving}
        className="w-full rounded-lg bg-transparent px-2 py-1.5 text-sm text-slate-700 placeholder:text-slate-500 hover:bg-slate-200/60 focus:bg-white focus:outline-none focus:ring-2 focus:ring-blue-400 disabled:opacity-60"
      />
      {error && <p className="mt-1 px-2 text-xs text-red-600">{error}</p>}
    </div>
  )
}
