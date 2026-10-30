import { create } from 'zustand'
import { persist } from 'zustand/middleware'
import type { GameState, GameConfig, Player } from './types'
import * as engine from './engine'
import { syncWrite, syncRead, syncListen } from './firebase'

export type Theme = 'dark' | 'light'

interface AppStore {
  // identity
  sessionId: string

  // theme
  theme: Theme
  setTheme: (t: Theme) => void

  // saved games (pass & play)
  savedGames: GameState[]
  saveGame: (g: GameState) => void
  deleteGame: (id: string) => void

  // active game
  game: GameState | null
  setGame: (g: GameState | null) => void

  // actions
  createGame: (config: GameConfig, players: Player[]) => void
  addScore: (playerId: string, delta: number, category: string) => void
  undoLastScore: (playerId: string) => void
  correctScore: (scoreId: string, newDelta: number) => void
  endTurn: () => void
  skipTurn: () => void
  reorderTurnOrder: (order: string[], now: boolean) => void
  startTimer: () => void
  pauseTimer: () => void
  resumeTimer: () => void
  addTime: (s: number) => void
  pauseGame: () => void
  resumeGame: () => void
  syncStop: () => void
}

function makeSessionId(): string {
  return 'sess-' + Math.random().toString(36).slice(2, 10)
}

export const useStore = create<AppStore>()(
  persist(
    (set, get) => {
      let unsubscribe: (() => void) | null = null

      function mutate(fn: (g: GameState) => GameState) {
        const { game, savedGames } = get()
        if (!game) return
        const next = { ...fn(game), updatedAt: Date.now() }
        // update savedGames if pass-and-play
        const saved = game.config.mode === 'pass-and-play'
          ? savedGames.map(g => g.id === next.id ? next : g)
          : savedGames
        set({ game: next, savedGames: saved })
        if (game.config.mode === 'multiplayer') {
          syncWrite(next.id, next)
        }
      }

      return {
        sessionId: makeSessionId(),
        theme: 'dark',
        setTheme: (theme) => {
          set({ theme })
          document.documentElement.classList.toggle('light', theme === 'light')
        },
        savedGames: [],
        saveGame: (g) => set(s => ({
          savedGames: s.savedGames.find(x => x.id === g.id)
            ? s.savedGames.map(x => x.id === g.id ? g : x)
            : [...s.savedGames, g]
        })),
        deleteGame: (id) => set(s => ({ savedGames: s.savedGames.filter(g => g.id !== id) })),

        game: null,
        setGame: (game) => set({ game }),

        createGame: (config, players) => {
          const { sessionId, savedGames } = get()
          const g = engine.createGame(config, players, sessionId)
          const saved = config.mode === 'pass-and-play' ? [...savedGames, g] : savedGames
          set({ game: g, savedGames: saved })
          if (config.mode === 'multiplayer') {
            syncWrite(g.id, g)
          }
        },

        addScore: (pid, delta, cat) => mutate(g => engine.addScore(g, pid, delta, cat, get().sessionId)),
        undoLastScore: (pid) => mutate(g => engine.undoLastScore(g, pid)),
        correctScore: (sid, nd) => mutate(g => engine.correctScore(g, sid, nd)),
        endTurn: () => mutate(engine.endTurn),
        skipTurn: () => mutate(engine.skipTurn),
        reorderTurnOrder: (order, now) => mutate(g => engine.reorderTurnOrder(g, order, now)),
        startTimer: () => mutate(engine.startTimer),
        pauseTimer: () => mutate(engine.pauseTimer),
        resumeTimer: () => mutate(engine.resumeTimer),
        addTime: (s) => mutate(g => engine.addTime(g, s)),
        pauseGame: () => mutate(engine.pauseGame),
        resumeGame: () => mutate(engine.resumeGame),

        syncStop: () => {
          if (unsubscribe) { unsubscribe(); unsubscribe = null }
        },
      }
    },
    {
      name: 'tabletop-tracker',
      partialize: (s) => ({
        sessionId: s.sessionId,
        theme: s.theme,
        savedGames: s.savedGames,
        game: s.game?.config.mode === 'pass-and-play' ? s.game : null,
      }),
    }
  )
)

// Subscribe to a multiplayer game by id
export async function joinMultiplayer(gameId: string): Promise<void> {
  const state = await syncRead(gameId)
  if (state) useStore.setState({ game: state })
  const unsub = syncListen(gameId, (g) => {
    useStore.setState({ game: g })
  })
  // store unsub for cleanup — hack via closure on store
  const cur = useStore.getState()
  cur.syncStop()
  // re-bind
  ;(useStore as any)._unsub = unsub
}
