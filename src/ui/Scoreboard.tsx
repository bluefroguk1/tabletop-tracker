import type { GameState, Player } from '../types'
import { totalScore, rankings, turnHasBeenCompleted, activePlayerId } from '../engine'

interface Props {
  game: GameState
  compact?: boolean
}

export function Scoreboard({ game, compact }: Props) {
  const ranked = rankings(game)
  const activeId = game.status === 'active' || game.status === 'paused' ? activePlayerId(game) : null

  return (
    <div className="flex flex-col gap-1" role="table" aria-label="Scoreboard">
      <div className="sr-only" role="row">
        <span role="columnheader">Rank</span>
        <span role="columnheader">Player</span>
        <span role="columnheader">Score</span>
        <span role="columnheader">Status</span>
      </div>
      {ranked.map((p, i) => (
        <PlayerRow
          key={p.id}
          player={p}
          rank={i + 1}
          score={totalScore(game, p.id)}
          isActive={p.id === activeId}
          done={turnHasBeenCompleted(game, p.id, game.currentRound)}
          compact={compact}
        />
      ))}
    </div>
  )
}

function PlayerRow({ player, rank, score, isActive, done, compact }: {
  player: Player; rank: number; score: number; isActive: boolean; done: boolean; compact?: boolean
}) {
  return (
    <div
      role="row"
      className={`flex items-center gap-3 rounded-xl px-3 py-2 transition-colors ${
        isActive ? 'bg-[var(--color-surface2)] border border-[var(--color-accent)]' : 'bg-[var(--color-surface)]'
      }`}
    >
      <span className="text-[var(--color-muted)] text-sm w-5 text-center" role="cell">#{rank}</span>
      <div
        className={`rounded-full shrink-0 ${compact ? 'w-6 h-6 text-xs' : 'w-8 h-8 text-sm'} flex items-center justify-center font-bold`}
        style={{ background: player.color }}
        aria-hidden="true"
      >
        {player.name[0]}
      </div>
      <span className="flex-1 font-medium truncate" role="cell">{player.name}</span>
      {done && !isActive && <span className="text-[var(--color-success)] text-xs" aria-label="Turn complete">✓</span>}
      {isActive && <span className="text-[var(--color-accent)] text-xs font-semibold" aria-label="Active">▶</span>}
      <span className="font-bold text-lg tabular-nums" role="cell">{score}</span>
    </div>
  )
}
