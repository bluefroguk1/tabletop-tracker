export type GameMode = 'pass-and-play' | 'multiplayer'
export type WinCondition = 'highest' | 'lowest' | 'none'
export type TimerExpiry = 'warn' | 'auto'
export type ScoringMode = 'simple' | 'category'
export type GameStatus = 'setup' | 'waiting' | 'active' | 'paused' | 'completed'
export type EventType =
  | 'game_started' | 'game_paused' | 'game_resumed' | 'game_completed'
  | 'round_started' | 'round_completed'
  | 'turn_started' | 'turn_completed' | 'turn_skipped'
  | 'score_added' | 'score_corrected' | 'score_undone'
  | 'timer_expired' | 'turn_order_changed' | 'player_joined' | 'player_left'

export interface ScoreCategory {
  id: string
  name: string
  color?: string
}

export interface ScoreEvent {
  id: string
  playerId: string
  round: number
  turn: number
  category: string       // category id or 'default'
  delta: number
  note?: string
  timestamp: number
  by: string             // device/session id
  corrected?: boolean
}

export interface Player {
  id: string
  name: string
  color: string
  joined: boolean        // in multiplayer: has a real device
  sessionId?: string     // device that owns this slot
}

export interface Turn {
  playerId: string
  round: number
  index: number          // position within round
  startedAt?: number
  completedAt?: number
  timerExpired?: boolean
}

export interface GameConfig {
  name: string
  preset: 'generic' | 'wh40k'
  mode: GameMode
  rounds: number
  scoringMode: ScoringMode
  categories: ScoreCategory[]
  winCondition: WinCondition
  timerEnabled: boolean
  timerSeconds: number
  timerExpiry: TimerExpiry
  quickAdd: number[]
  allowNegative: boolean
}

export interface HistoryEvent {
  id: string
  type: EventType
  round?: number
  playerId?: string
  detail?: string
  timestamp: number
}

export interface GameState {
  id: string
  config: GameConfig
  status: GameStatus
  players: Player[]
  turnOrder: string[]    // player ids, one full round sequence
  currentRound: number
  currentTurn: number    // index within turnOrder (0-based)
  completedTurns: Turn[]
  scores: ScoreEvent[]
  history: HistoryEvent[]
  createdAt: number
  updatedAt: number
  adminSessionId: string
  timerPausedAt?: number  // timestamp when paused, undefined = running/off
  timerEndsAt?: number    // when the current timer should hit zero (epoch ms)
}

export const PLAYER_COLORS = [
  '#6c63ff', '#ff6584', '#4ade80', '#fbbf24',
  '#38bdf8', '#f97316', '#e879f9', '#2dd4bf',
  '#fb7185', '#a3e635', '#818cf8', '#34d399',
]

export const DEFAULT_CATEGORIES: ScoreCategory[] = [
  { id: 'primary',   name: 'Primary',   color: '#6c63ff' },
  { id: 'secondary', name: 'Secondary', color: '#38bdf8' },
  { id: 'bonus',     name: 'Bonus',     color: '#4ade80' },
  { id: 'penalty',   name: 'Penalty',   color: '#f87171' },
]

export const GENERIC_CONFIG: GameConfig = {
  name: '',
  preset: 'generic',
  mode: 'pass-and-play',
  rounds: 5,
  scoringMode: 'simple',
  categories: [{ id: 'default', name: 'Score' }],
  winCondition: 'highest',
  timerEnabled: false,
  timerSeconds: 120,
  timerExpiry: 'warn',
  quickAdd: [1, 3, 5],
  allowNegative: true,
}

export const WH40K_CONFIG: GameConfig = {
  name: '',
  preset: 'wh40k',
  mode: 'pass-and-play',
  rounds: 5,
  scoringMode: 'category',
  categories: DEFAULT_CATEGORIES,
  winCondition: 'highest',
  timerEnabled: false,
  timerSeconds: 300,
  timerExpiry: 'warn',
  quickAdd: [1, 2, 5],
  allowNegative: false,
}
