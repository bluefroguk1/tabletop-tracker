import { useState } from 'react'
import type { GameState } from '../types'
import { useStore } from '../store'
import { totalScore } from '../engine'
import { Btn } from './Btn'

interface Props {
  game: GameState
  playerId: string
}

export function ScoreControls({ game, playerId }: Props) {
  const { addScore, undoLastScore } = useStore()
  const [custom, setCustom] = useState('')
  const [selectedCat, setSelectedCat] = useState(game.config.categories[0]?.id ?? 'default')
  const cats = game.config.categories

  function apply(delta: number) {
    if (delta === 0) return
    if (!game.config.allowNegative && delta < 0) return
    addScore(playerId, delta, selectedCat)
    setCustom('')
  }

  const score = totalScore(game, playerId)

  return (
    <div className="flex flex-col gap-4">
      {/* current total */}
      <div className="text-center">
        <div className="text-[var(--color-muted)] text-sm">Total score</div>
        <div className="text-5xl font-bold tabular-nums" aria-live="polite">{score}</div>
      </div>

      {/* category selector */}
      {cats.length > 1 && (
        <div className="flex gap-2 flex-wrap">
          {cats.map(c => (
            <button
              key={c.id}
              onClick={() => setSelectedCat(c.id)}
              className={`px-3 py-1.5 rounded-lg text-sm font-medium transition-opacity border ${
                selectedCat === c.id
                  ? 'opacity-100 border-[var(--color-accent)]'
                  : 'opacity-60 border-[var(--color-border)]'
              }`}
              style={{ borderLeftColor: c.color ?? 'var(--color-accent)', borderLeftWidth: 3 }}
              aria-pressed={selectedCat === c.id}
            >
              {c.name}
            </button>
          ))}
        </div>
      )}

      {/* quick-add buttons */}
      <div className="flex gap-3 flex-wrap">
        {game.config.quickAdd.map(v => (
          <Btn key={v} variant="primary" size="lg" className="flex-1 min-w-16" onClick={() => apply(v)} aria-label={`Add ${v}`}>
            +{v}
          </Btn>
        ))}
        {game.config.allowNegative && game.config.quickAdd.map(v => (
          <Btn key={`-${v}`} variant="secondary" size="lg" className="flex-1 min-w-16" onClick={() => apply(-v)} aria-label={`Subtract ${v}`}>
            −{v}
          </Btn>
        ))}
      </div>

      {/* custom entry */}
      <div className="flex gap-2">
        <input
          type="number"
          value={custom}
          onChange={e => setCustom(e.target.value)}
          placeholder="Custom"
          className="flex-1 bg-[var(--color-surface2)] border border-[var(--color-border)] rounded-xl px-3 py-2.5 text-[var(--color-text)] text-center text-lg"
          aria-label="Custom score value"
          onKeyDown={e => { if (e.key === 'Enter') apply(Number(custom)) }}
        />
        <Btn variant="primary" onClick={() => apply(Number(custom))} disabled={!custom || isNaN(Number(custom))}>
          Apply
        </Btn>
      </div>

      {/* undo */}
      <Btn variant="ghost" size="sm" onClick={() => undoLastScore(playerId)}>
        Undo last score
      </Btn>
    </div>
  )
}
