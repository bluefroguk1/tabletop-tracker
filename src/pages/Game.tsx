import { useEffect, useState } from 'react'
import { useNavigate, useParams } from 'react-router-dom'
import { useStore } from '../store'
import { activePlayerId, isAdmin, totalScore } from '../engine'
import { ScoreControls } from '../ui/ScoreControls'
import { Scoreboard } from '../ui/Scoreboard'
import { TimerDisplay } from '../ui/TimerDisplay'
import { AdminPanel } from './AdminPanel'
import { Handover } from './Handover'
import { Btn } from '../ui/Btn'

export function Game() {
  const { id } = useParams<{ id: string }>()
  const navigate = useNavigate()
  const { game, setGame, savedGames, sessionId, endTurn } = useStore()
  const [showAdmin, setShowAdmin] = useState(false)
  const [pendingHandover, setPendingHandover] = useState(false)

  // restore game from savedGames if navigating direct
  useEffect(() => {
    if (!game && id) {
      const saved = savedGames.find(g => g.id === id)
      if (saved) setGame(saved)
      else navigate('/')
    }
  }, [])

  useEffect(() => {
    if (game?.status === 'completed') navigate(`/results/${game.id}`)
  }, [game?.status])

  if (!game) return <div className="p-8 text-center text-[var(--color-muted)]">Loading…</div>

  const activePid = activePlayerId(game)
  const activePlayer = game.players.find(p => p.id === activePid)!
  const admin = isAdmin(game, sessionId)
  const paused = game.status === 'paused'

  function handleEndTurn() {
    if (game!.config.mode === 'pass-and-play') {
      setPendingHandover(true)
    } else {
      endTurn()
    }
  }

  if (pendingHandover) {
    const nextIdx = (game.currentTurn + 1) % game.turnOrder.length
    const nextPlayer = game.players.find(p => p.id === game.turnOrder[nextIdx])!
    return (
      <Handover
        currentPlayer={activePlayer}
        nextPlayer={nextPlayer}
        onReady={() => { setPendingHandover(false); endTurn() }}
      />
    )
  }

  return (
    <div className="min-h-dvh flex flex-col max-w-lg mx-auto">
      {/* header */}
      <header className="safe-top flex items-center gap-2 px-4 py-3 border-b border-[var(--color-border)] sticky top-0 bg-[var(--color-bg)] z-10">
        <div className="flex-1 min-w-0">
          <div className="font-semibold truncate">{game.config.name || 'Game'}</div>
          <div className="text-[var(--color-muted)] text-xs">Round {game.currentRound} of {game.config.rounds}</div>
        </div>
        {paused && <span className="text-[var(--color-warning)] text-xs font-semibold px-2 py-1 bg-[var(--color-surface2)] rounded-lg">PAUSED</span>}
        {admin && (
          <button onClick={() => setShowAdmin(true)}
            className="w-9 h-9 rounded-lg bg-[var(--color-surface2)] flex items-center justify-center text-lg"
            aria-label="Admin panel">⚙️</button>
        )}
      </header>

      <div className="flex-1 overflow-y-auto p-4 pb-[calc(1rem+env(safe-area-inset-bottom,0px))] flex flex-col gap-4" style={{ overscrollBehavior: 'contain' }}>
        {/* active player */}
        <div className="bg-[var(--color-surface)] rounded-2xl border border-[var(--color-accent)] p-4">
          <div className="flex items-center gap-3 mb-4">
            <div className="w-12 h-12 rounded-full flex items-center justify-center text-xl font-bold"
              style={{ background: activePlayer.color }}>
              {activePlayer.name[0]}
            </div>
            <div>
              <div className="text-[var(--color-muted)] text-xs">Active player</div>
              <div className="font-bold text-xl">{activePlayer.name}</div>
            </div>
            <div className="ml-auto text-3xl font-bold tabular-nums">{totalScore(game, activePid)}</div>
          </div>

          {game.config.timerEnabled && <TimerDisplay game={game} />}

          {!paused && (
            <div className="mt-4">
              <ScoreControls game={game} playerId={activePid} />
            </div>
          )}
        </div>

        {/* end turn */}
        {!paused && (
          <Btn variant="primary" size="lg" className="w-full"
            onClick={handleEndTurn}
            aria-label="End current turn"
          >
            End Turn →
          </Btn>
        )}

        {paused && admin && (
          <Btn variant="primary" size="lg" className="w-full" onClick={() => useStore.getState().resumeGame()}>
            Resume Game
          </Btn>
        )}

        {/* scoreboard */}
        <section>
          <h2 className="text-[var(--color-muted)] text-xs font-semibold uppercase tracking-wider mb-2">Scoreboard</h2>
          <Scoreboard game={game} />
        </section>
      </div>

      {showAdmin && <AdminPanel game={game} onClose={() => setShowAdmin(false)} />}
    </div>
  )
}
