import { useParams, useNavigate } from 'react-router-dom'
import { useStore } from '../store'
import { rankings, totalScore, scoreByRound, scoreByCategory } from '../engine'
import { Btn } from '../ui/Btn'
import { useEffect } from 'react'

export function Results() {
  const { id } = useParams<{ id: string }>()
  const navigate = useNavigate()
  const { game, setGame, savedGames } = useStore()

  useEffect(() => {
    if (!game && id) {
      const saved = savedGames.find(g => g.id === id)
      if (saved) setGame(saved)
      else navigate('/')
    }
  }, [])

  if (!game) return <div className="p-8 text-center text-[var(--color-muted)]">Loading…</div>

  const ranked = rankings(game)
  const winner = game.config.winCondition !== 'none' ? ranked[0] : null
  const isWin = game.config.winCondition !== 'none'
  const topScore = winner ? totalScore(game, winner.id) : 0
  const tied = isWin ? ranked.filter(p => totalScore(game, p.id) === topScore) : []
  const duration = Math.round((game.updatedAt - game.createdAt) / 60000)

  function copyText() {
    const lines = [
      `${game!.config.name || 'Tabletop Game'} — Results`,
      `${ranked.map((p, i) => `${i + 1}. ${p.name}: ${totalScore(game!, p.id)}`).join('\n')}`,
    ]
    navigator.clipboard.writeText(lines.join('\n')).catch(() => {})
  }

  return (
    <div className="min-h-dvh flex flex-col p-4 max-w-lg mx-auto gap-6">
      <header className="flex items-center gap-3 pt-4">
        <button onClick={() => navigate('/')} className="text-[var(--color-muted)] text-2xl" aria-label="Home">‹</button>
        <h1 className="text-xl font-bold m-0 flex-1 text-[var(--color-text)]">Results</h1>
      </header>

      {/* winner */}
      {winner && (
        <div className="text-center bg-[var(--color-surface)] rounded-2xl border border-[var(--color-accent)] p-6">
          <div className="text-4xl mb-2">{tied.length > 1 ? '🤝' : '🏆'}</div>
          <div className="text-[var(--color-muted)] text-sm">{tied.length > 1 ? 'It\'s a tie!' : 'Winner'}</div>
          <div className="text-2xl font-bold mt-1" style={{ color: winner.color }}>
            {tied.map(p => p.name).join(' & ')}
          </div>
          <div className="text-4xl font-bold tabular-nums mt-2">{topScore}</div>
        </div>
      )}

      {/* meta */}
      <div className="bg-[var(--color-surface)] rounded-xl border border-[var(--color-border)] divide-y divide-[var(--color-border)]">
        {[
          ['Game',     game.config.name || '(no name)'],
          ['Date',     new Date(game.updatedAt).toLocaleDateString()],
          ['Duration', `${duration} min`],
          ['Rounds',   String(game.config.rounds)],
        ].map(([k, v]) => (
          <div key={k} className="flex gap-3 px-4 py-2.5 text-sm">
            <span className="text-[var(--color-muted)] w-20">{k}</span>
            <span>{v}</span>
          </div>
        ))}
      </div>

      {/* rankings */}
      <section>
        <h2 className="text-[var(--color-muted)] text-xs font-semibold uppercase tracking-wider mb-2">Final Rankings</h2>
        <div className="flex flex-col gap-2">
          {ranked.map((p, i) => (
            <div key={p.id} className="bg-[var(--color-surface)] rounded-xl border border-[var(--color-border)] p-3">
              <div className="flex items-center gap-3">
                <span className="text-[var(--color-muted)] w-6 text-sm">#{i + 1}</span>
                <div className="w-8 h-8 rounded-full flex items-center justify-center font-bold text-sm"
                  style={{ background: p.color }}>{p.name[0]}</div>
                <span className="flex-1 font-medium">{p.name}</span>
                <span className="font-bold text-xl tabular-nums">{totalScore(game, p.id)}</span>
              </div>
              {/* round breakdown */}
              <div className="mt-2 flex gap-2 flex-wrap pl-14">
                {Array.from({ length: game.config.rounds }, (_, r) => (
                  <span key={r} className="text-xs text-[var(--color-muted)] bg-[var(--color-surface2)] px-2 py-0.5 rounded">
                    R{r + 1}: {scoreByRound(game, p.id)[r + 1] ?? 0}
                  </span>
                ))}
              </div>
              {/* category breakdown */}
              {game.config.scoringMode === 'category' && (
                <div className="mt-1 flex gap-2 flex-wrap pl-14">
                  {game.config.categories.map(c => (
                    <span key={c.id} className="text-xs text-[var(--color-muted)] bg-[var(--color-surface2)] px-2 py-0.5 rounded"
                      style={{ borderLeft: `2px solid ${c.color}` }}>
                      {c.name}: {scoreByCategory(game, p.id)[c.id] ?? 0}
                    </span>
                  ))}
                </div>
              )}
            </div>
          ))}
        </div>
      </section>

      <div className="flex gap-3">
        <Btn className="flex-1" onClick={copyText}>📋 Copy results</Btn>
        {typeof navigator.share !== 'undefined' && (
          <Btn className="flex-1" onClick={() => navigator.share({ title: 'Game Results', text: `${game.config.name || 'Game'}: ${ranked[0].name} wins!` })}>
            Share
          </Btn>
        )}
        <Btn variant="primary" className="flex-1" onClick={() => navigate('/')}>Home</Btn>
      </div>
    </div>
  )
}
