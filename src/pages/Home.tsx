import { useNavigate } from 'react-router-dom'
import { useState } from 'react'
import { useStore } from '../store'
import { Btn } from '../ui/Btn'
import type { GameState } from '../types'

export function Home() {
  const navigate = useNavigate()
  const { savedGames, deleteGame, theme, setTheme } = useStore()
  const [confirmDelete, setConfirmDelete] = useState<string | null>(null)

  const unfinished = savedGames.filter(g => g.status !== 'completed')
  const finished   = savedGames.filter(g => g.status === 'completed')

  return (
    <div className="min-h-dvh flex flex-col p-4 max-w-lg mx-auto gap-6">
      <header className="flex items-center justify-between pt-4">
        <div>
          <h1 className="text-3xl font-bold m-0 text-[var(--color-text)]">Tabletop Tracker</h1>
          <p className="text-[var(--color-muted)] text-sm">Score tracker for tabletop games</p>
        </div>
        <button
          onClick={() => setTheme(theme === 'dark' ? 'light' : 'dark')}
          className="w-10 h-10 rounded-full bg-[var(--color-surface2)] flex items-center justify-center text-lg"
          aria-label={`Switch to ${theme === 'dark' ? 'light' : 'dark'} theme`}
        >
          {theme === 'dark' ? '☀️' : '🌙'}
        </button>
      </header>

      {/* primary actions */}
      <div className="flex flex-col gap-3">
        <Btn variant="primary" size="lg" className="w-full" onClick={() => navigate('/setup')}>
          ＋ New Game
        </Btn>
        <Btn size="lg" className="w-full" onClick={() => navigate('/join')}>
          Join Game
        </Btn>
      </div>

      {/* unfinished games */}
      {unfinished.length > 0 && (
        <section>
          <h2 className="text-[var(--color-muted)] text-sm font-semibold uppercase tracking-wider mb-2">Resume game</h2>
          <div className="flex flex-col gap-2">
            {unfinished.map(g => (
              <GameCard key={g.id} game={g}
                onResume={() => navigate(`/game/${g.id}`)}
                onDelete={() => setConfirmDelete(g.id)}
              />
            ))}
          </div>
        </section>
      )}

      {/* completed games */}
      {finished.length > 0 && (
        <section>
          <h2 className="text-[var(--color-muted)] text-sm font-semibold uppercase tracking-wider mb-2">Past games</h2>
          <div className="flex flex-col gap-2">
            {finished.map(g => (
              <GameCard key={g.id} game={g}
                onResume={() => navigate(`/results/${g.id}`)}
                resumeLabel="View results"
                onDelete={() => setConfirmDelete(g.id)}
              />
            ))}
          </div>
        </section>
      )}

      {/* confirm delete */}
      {confirmDelete && (
        <div className="fixed inset-0 bg-black/60 z-50 flex items-center justify-center p-4">
          <div className="bg-[var(--color-surface)] rounded-2xl p-6 max-w-xs w-full border border-[var(--color-border)]">
            <p className="text-[var(--color-text)] mb-4">Delete this game? This cannot be undone.</p>
            <div className="flex gap-3">
              <Btn variant="danger" className="flex-1" onClick={() => { deleteGame(confirmDelete); setConfirmDelete(null) }}>Delete</Btn>
              <Btn className="flex-1" onClick={() => setConfirmDelete(null)}>Cancel</Btn>
            </div>
          </div>
        </div>
      )}
    </div>
  )
}

function GameCard({ game, onResume, onDelete, resumeLabel = 'Resume' }: {
  game: GameState; onResume: () => void; onDelete: () => void; resumeLabel?: string
}) {
  const ago = formatAgo(game.updatedAt)
  return (
    <div className="bg-[var(--color-surface)] border border-[var(--color-border)] rounded-xl p-3 flex items-center gap-3">
      <div className="flex-1 min-w-0">
        <div className="font-medium truncate">{game.config.name || 'Unnamed game'}</div>
        <div className="text-[var(--color-muted)] text-xs mt-0.5">
          {game.players.length} players · Round {game.currentRound}/{game.config.rounds} · {ago}
        </div>
      </div>
      <Btn size="sm" variant="primary" onClick={onResume}>{resumeLabel}</Btn>
      <Btn size="sm" variant="ghost" onClick={onDelete} aria-label="Delete game">🗑</Btn>
    </div>
  )
}

function formatAgo(ts: number): string {
  const s = (Date.now() - ts) / 1000
  if (s < 60) return 'just now'
  if (s < 3600) return `${Math.floor(s / 60)}m ago`
  if (s < 86400) return `${Math.floor(s / 3600)}h ago`
  return `${Math.floor(s / 86400)}d ago`
}
