// Pure game-state transitions — no side effects, no Firebase
import type { GameState, ScoreEvent, Turn, HistoryEvent, Player, GameConfig } from './types'
import { PLAYER_COLORS } from './types'

function uid(): string {
  return Math.random().toString(36).slice(2, 10) + Date.now().toString(36)
}

function event(type: HistoryEvent['type'], opts: Partial<HistoryEvent> = {}): HistoryEvent {
  return { id: uid(), type, timestamp: Date.now(), ...opts }
}

export function createGame(config: GameConfig, players: Player[], adminSessionId: string): GameState {
  const turnOrder = players.map(p => p.id)
  return {
    id: uid(),
    config,
    status: config.mode === 'multiplayer' ? 'waiting' : 'active',
    players,
    turnOrder,
    currentRound: 1,
    currentTurn: 0,
    completedTurns: [],
    scores: [],
    history: [event('game_started'), event('round_started', { round: 1 }), event('turn_started', { round: 1, playerId: turnOrder[0] })],
    createdAt: Date.now(),
    updatedAt: Date.now(),
    adminSessionId,
  }
}

export function makePlayers(count: number): Player[] {
  return Array.from({ length: count }, (_, i) => ({
    id: uid(),
    name: `Player ${i + 1}`,
    color: PLAYER_COLORS[i % PLAYER_COLORS.length],
    joined: false,
  }))
}

export function totalScore(state: GameState, playerId: string): number {
  return state.scores
    .filter(s => s.playerId === playerId && !s.corrected)
    .reduce((sum, s) => sum + s.delta, 0)
}

export function scoreByCategory(state: GameState, playerId: string): Record<string, number> {
  const out: Record<string, number> = {}
  for (const s of state.scores) {
    if (s.playerId !== playerId || s.corrected) continue
    out[s.category] = (out[s.category] ?? 0) + s.delta
  }
  return out
}

export function scoreByRound(state: GameState, playerId: string): Record<number, number> {
  const out: Record<number, number> = {}
  for (const s of state.scores) {
    if (s.playerId !== playerId || s.corrected) continue
    out[s.round] = (out[s.round] ?? 0) + s.delta
  }
  return out
}

export function rankings(state: GameState): Player[] {
  const sorted = [...state.players].sort((a, b) => {
    const diff = totalScore(state, b.id) - totalScore(state, a.id)
    return state.config.winCondition === 'lowest' ? -diff : diff
  })
  return sorted
}

export function addScore(state: GameState, playerId: string, delta: number, category: string, bySessionId: string): GameState {
  const se: ScoreEvent = {
    id: uid(),
    playerId,
    round: state.currentRound,
    turn: state.currentTurn,
    category,
    delta,
    timestamp: Date.now(),
    by: bySessionId,
  }
  return {
    ...state,
    scores: [...state.scores, se],
    history: [...state.history, event('score_added', { round: state.currentRound, playerId, detail: `${delta > 0 ? '+' : ''}${delta} (${category})` })],
    updatedAt: Date.now(),
  }
}

export function undoLastScore(state: GameState, playerId: string): GameState {
  const idx = [...state.scores].reverse().findIndex(s => s.playerId === playerId && !s.corrected)
  if (idx === -1) return state
  const realIdx = state.scores.length - 1 - idx
  const updated = state.scores.map((s, i) => i === realIdx ? { ...s, corrected: true } : s)
  return {
    ...state,
    scores: updated,
    history: [...state.history, event('score_corrected', { playerId, round: state.currentRound })],
    updatedAt: Date.now(),
  }
}

export function correctScore(state: GameState, scoreId: string, newDelta: number): GameState {
  const target = state.scores.find(s => s.id === scoreId)
  if (!target) return state
  const correction: ScoreEvent = {
    id: uid(),
    playerId: target.playerId,
    round: target.round,
    turn: target.turn,
    category: target.category,
    delta: newDelta - target.delta,
    note: `correction of ${scoreId}`,
    timestamp: Date.now(),
    by: target.by,
  }
  const updated = state.scores.map(s => s.id === scoreId ? { ...s, corrected: true } : s)
  return {
    ...state,
    scores: [...updated, correction],
    history: [...state.history, event('score_corrected', { playerId: target.playerId })],
    updatedAt: Date.now(),
  }
}

export function activePlayerId(state: GameState): string {
  return state.turnOrder[state.currentTurn % state.turnOrder.length]
}

export function endTurn(state: GameState): GameState {
  const pid = activePlayerId(state)
  const completedTurn: Turn = {
    playerId: pid,
    round: state.currentRound,
    index: state.currentTurn,
    startedAt: undefined,
    completedAt: Date.now(),
  }
  const newCompletedTurns = [...state.completedTurns, completedTurn]
  const nextTurnIndex = state.currentTurn + 1
  const isRoundComplete = nextTurnIndex >= state.turnOrder.length

  if (isRoundComplete) {
    const isGameComplete = state.currentRound >= state.config.rounds
    if (isGameComplete) {
      return {
        ...state,
        completedTurns: newCompletedTurns,
        status: 'completed',
        history: [
          ...state.history,
          event('turn_completed', { round: state.currentRound, playerId: pid }),
          event('round_completed', { round: state.currentRound }),
          event('game_completed'),
        ],
        updatedAt: Date.now(),
        timerEndsAt: undefined,
        timerPausedAt: undefined,
      }
    }
    const nextRound = state.currentRound + 1
    return {
      ...state,
      completedTurns: newCompletedTurns,
      currentRound: nextRound,
      currentTurn: 0,
      history: [
        ...state.history,
        event('turn_completed', { round: state.currentRound, playerId: pid }),
        event('round_completed', { round: state.currentRound }),
        event('round_started', { round: nextRound }),
        event('turn_started', { round: nextRound, playerId: state.turnOrder[0] }),
      ],
      updatedAt: Date.now(),
      timerEndsAt: undefined,
      timerPausedAt: undefined,
    }
  }

  return {
    ...state,
    completedTurns: newCompletedTurns,
    currentTurn: nextTurnIndex,
    history: [
      ...state.history,
      event('turn_completed', { round: state.currentRound, playerId: pid }),
      event('turn_started', { round: state.currentRound, playerId: state.turnOrder[nextTurnIndex] }),
    ],
    updatedAt: Date.now(),
    timerEndsAt: undefined,
    timerPausedAt: undefined,
  }
}

export function skipTurn(state: GameState): GameState {
  const pid = activePlayerId(state)
  const skipped: Turn = {
    playerId: pid,
    round: state.currentRound,
    index: state.currentTurn,
    completedAt: Date.now(),
  }
  const advanced = endTurn({ ...state, completedTurns: [...state.completedTurns] })
  return {
    ...advanced,
    completedTurns: [...state.completedTurns, { ...skipped, completedAt: Date.now() }],
    history: [...state.history, event('turn_skipped', { round: state.currentRound, playerId: pid }), ...advanced.history.slice(state.history.length)],
  }
}

export function reorderTurnOrder(state: GameState, newOrder: string[], applyNow: boolean): GameState {
  if (applyNow) {
    // preserve completed turns, keep current player active
    return {
      ...state,
      turnOrder: newOrder,
      currentTurn: 0,
      history: [...state.history, event('turn_order_changed', { round: state.currentRound })],
      updatedAt: Date.now(),
    }
  }
  // will take effect next round — store as pending; for simplicity, store in config
  return {
    ...state,
    config: { ...state.config },
    turnOrder: newOrder, // apply from next round when endTurn detects round change
    history: [...state.history, event('turn_order_changed')],
    updatedAt: Date.now(),
  }
}

export function startTimer(state: GameState): GameState {
  if (!state.config.timerEnabled) return state
  return {
    ...state,
    timerEndsAt: Date.now() + state.config.timerSeconds * 1000,
    timerPausedAt: undefined,
    updatedAt: Date.now(),
  }
}

export function pauseTimer(state: GameState): GameState {
  if (!state.timerEndsAt) return state
  return {
    ...state,
    timerPausedAt: Date.now(),
    updatedAt: Date.now(),
  }
}

export function resumeTimer(state: GameState): GameState {
  if (!state.timerEndsAt || !state.timerPausedAt) return state
  const remaining = state.timerEndsAt - state.timerPausedAt
  return {
    ...state,
    timerEndsAt: Date.now() + remaining,
    timerPausedAt: undefined,
    updatedAt: Date.now(),
  }
}

export function addTime(state: GameState, seconds: number): GameState {
  if (!state.timerEndsAt) return state
  return {
    ...state,
    timerEndsAt: state.timerEndsAt + seconds * 1000,
    updatedAt: Date.now(),
  }
}

export function pauseGame(state: GameState): GameState {
  return {
    ...state,
    status: 'paused',
    history: [...state.history, event('game_paused')],
    updatedAt: Date.now(),
  }
}

export function resumeGame(state: GameState): GameState {
  return {
    ...state,
    status: 'active',
    history: [...state.history, event('game_resumed')],
    updatedAt: Date.now(),
  }
}

export function turnHasBeenCompleted(state: GameState, playerId: string, round: number): boolean {
  return state.completedTurns.some(t => t.playerId === playerId && t.round === round)
}

export function isAdmin(state: GameState, sessionId: string): boolean {
  return state.adminSessionId === sessionId
}
