import { useEffect, useRef, useState } from 'react'
import type { GameState } from '../types'
import { useStore } from '../store'
import { Btn } from './Btn'

export function TimerDisplay({ game }: { game: GameState }) {
  const [remaining, setRemaining] = useState<number>(game.config.timerSeconds * 1000)
  const { startTimer, pauseTimer, resumeTimer, addTime, endTurn } = useStore()
  const endTurnFired = useRef(false)

  useEffect(() => {
    endTurnFired.current = false
    if (!game.timerEndsAt) {
      setRemaining(game.config.timerSeconds * 1000)
      return
    }
    function tick() {
      if (!game.timerEndsAt) return
      if (game.timerPausedAt) {
        setRemaining(game.timerEndsAt - game.timerPausedAt)
        return
      }
      const r = game.timerEndsAt - Date.now()
      setRemaining(Math.max(0, r))
      if (r <= 0 && !endTurnFired.current) {
        endTurnFired.current = true
        if (game.config.timerExpiry === 'auto') endTurn()
      }
    }
    tick()
    const id = setInterval(tick, 250)
    return () => clearInterval(id)
  }, [game.timerEndsAt, game.timerPausedAt, game.config.timerExpiry, endTurn])

  const sec = Math.ceil(remaining / 1000)
  const mins = Math.floor(sec / 60)
  const secs = sec % 60
  const pct = Math.min(1, remaining / (game.config.timerSeconds * 1000))
  const warn = sec <= 30 && sec > 0
  const expired = remaining === 0

  const color = expired ? 'var(--color-danger)' : warn ? 'var(--color-warning)' : 'var(--color-success)'

  return (
    <div className="flex flex-col items-center gap-3">
      {/* Circular progress */}
      <div className="relative w-28 h-28">
        <svg className="w-full h-full -rotate-90" viewBox="0 0 100 100" aria-hidden="true">
          <circle cx="50" cy="50" r="44" fill="none" stroke="var(--color-surface2)" strokeWidth="8" />
          <circle
            cx="50" cy="50" r="44" fill="none"
            stroke={color} strokeWidth="8"
            strokeDasharray={`${pct * 276.46} 276.46`}
            strokeLinecap="round"
            style={{ transition: 'stroke-dasharray 0.25s, stroke 0.5s' }}
          />
        </svg>
        <div
          className="absolute inset-0 flex items-center justify-center font-mono text-2xl font-bold"
          style={{ color }}
          aria-live="polite"
          aria-label={`${mins}:${String(secs).padStart(2, '0')} remaining`}
        >
          {mins}:{String(secs).padStart(2, '0')}
        </div>
      </div>
      {expired && <p className="text-[var(--color-danger)] font-semibold" role="alert">Time expired!</p>}
      {warn && !expired && <p className="text-[var(--color-warning)] font-semibold" aria-live="polite">Time running low</p>}
      <div className="flex gap-2 flex-wrap justify-center">
        {!game.timerEndsAt && (
          <Btn size="sm" variant="primary" onClick={startTimer}>Start timer</Btn>
        )}
        {game.timerEndsAt && !game.timerPausedAt && !expired && (
          <Btn size="sm" onClick={pauseTimer}>Pause</Btn>
        )}
        {game.timerEndsAt && game.timerPausedAt && (
          <Btn size="sm" variant="primary" onClick={resumeTimer}>Resume</Btn>
        )}
        {game.timerEndsAt && (
          <Btn size="sm" onClick={() => addTime(30)}>+30s</Btn>
        )}
      </div>
    </div>
  )
}
