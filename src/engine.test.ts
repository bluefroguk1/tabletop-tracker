import { describe, it, expect } from 'vitest'
import {
  createGame, makePlayers, totalScore, rankings, addScore,
  undoLastScore, endTurn, skipTurn, reorderTurnOrder,
  activePlayerId, turnHasBeenCompleted, startTimer, pauseTimer, resumeTimer, addTime
} from './engine'
import { GENERIC_CONFIG, WH40K_CONFIG } from './types'

function game2() {
  const players = makePlayers(2)
  return createGame({ ...GENERIC_CONFIG, mode: 'pass-and-play' }, players, 'admin')
}

function game4() {
  const players = makePlayers(4)
  return createGame({ ...GENERIC_CONFIG, mode: 'pass-and-play', rounds: 5 }, players, 'admin')
}

describe('player management', () => {
  it('creates 2 players', () => {
    const g = game2()
    expect(g.players).toHaveLength(2)
  })

  it('creates 50 players', () => {
    const players = makePlayers(50)
    const g = createGame(GENERIC_CONFIG, players, 'admin')
    expect(g.players).toHaveLength(50)
  })

  it('creates 100 players', () => {
    const players = makePlayers(100)
    const g = createGame(GENERIC_CONFIG, players, 'admin')
    expect(g.players).toHaveLength(100)
  })

  it('player names default to Player N', () => {
    const players = makePlayers(3)
    expect(players.map(p => p.name)).toEqual(['Player 1', 'Player 2', 'Player 3'])
  })
})

describe('turn management', () => {
  it('first active player is player 0', () => {
    const g = game2()
    expect(activePlayerId(g)).toBe(g.players[0].id)
  })

  it('end turn advances to player 1', () => {
    const g0 = game2()
    const g1 = endTurn(g0)
    expect(activePlayerId(g1)).toBe(g0.players[1].id)
  })

  it('end turn at round end advances round', () => {
    let g = game2()
    g = endTurn(g) // p2 done
    g = endTurn(g) // round 1 done
    expect(g.currentRound).toBe(2)
    expect(g.currentTurn).toBe(0)
  })

  it('completes game after all rounds', () => {
    let g = game2()
    for (let i = 0; i < GENERIC_CONFIG.rounds * 2; i++) g = endTurn(g)
    expect(g.status).toBe('completed')
  })

  it('prevents duplicate turn tracking', () => {
    let g = game2()
    const pid = activePlayerId(g)
    expect(turnHasBeenCompleted(g, pid, 1)).toBe(false)
    g = endTurn(g)
    expect(turnHasBeenCompleted(g, g.players[0].id, 1)).toBe(true)
  })

  it('skip turn advances without recording score', () => {
    let g = game2()
    const pid = activePlayerId(g)
    g = skipTurn(g)
    expect(turnHasBeenCompleted(g, pid, 1)).toBe(true)
    expect(totalScore(g, pid)).toBe(0)
  })

  it('mid-game reorder changes upcoming players', () => {
    const g0 = game4()
    const reversed = [...g0.turnOrder].reverse()
    const g1 = reorderTurnOrder(g0, reversed, true)
    expect(g1.turnOrder[0]).toBe(g0.players[3].id)
  })

  it('4 players × 5 rounds = 20 total turns', () => {
    let g = game4()
    let count = 0
    while (g.status !== 'completed') { g = endTurn(g); count++ }
    expect(count).toBe(20)
  })
})

describe('scoring', () => {
  it('starts at zero', () => {
    const g = game2()
    expect(totalScore(g, g.players[0].id)).toBe(0)
  })

  it('adds simple score', () => {
    let g = game2()
    g = addScore(g, g.players[0].id, 5, 'default', 'sess')
    expect(totalScore(g, g.players[0].id)).toBe(5)
  })

  it('adds multiple scores', () => {
    let g = game2()
    const pid = g.players[0].id
    g = addScore(g, pid, 3, 'default', 'sess')
    g = addScore(g, pid, 7, 'default', 'sess')
    expect(totalScore(g, pid)).toBe(10)
  })

  it('undo removes last score', () => {
    let g = game2()
    const pid = g.players[0].id
    g = addScore(g, pid, 10, 'default', 'sess')
    g = undoLastScore(g, pid)
    expect(totalScore(g, pid)).toBe(0)
  })

  it('supports negative scoring', () => {
    let g = game2()
    const pid = g.players[0].id
    g = addScore(g, pid, 10, 'default', 'sess')
    g = addScore(g, pid, -3, 'default', 'sess')
    expect(totalScore(g, pid)).toBe(7)
  })

  it('highest wins ranking', () => {
    let g = game2()
    g = addScore(g, g.players[0].id, 5, 'default', 'sess')
    g = addScore(g, g.players[1].id, 10, 'default', 'sess')
    const r = rankings(g)
    expect(r[0].id).toBe(g.players[1].id)
  })

  it('lowest wins ranking', () => {
    let g = createGame({ ...GENERIC_CONFIG, winCondition: 'lowest' }, makePlayers(2), 'admin')
    g = addScore(g, g.players[0].id, 5, 'default', 'sess')
    g = addScore(g, g.players[1].id, 10, 'default', 'sess')
    const r = rankings(g)
    expect(r[0].id).toBe(g.players[0].id)
  })

  it('category scoring', () => {
    const players = makePlayers(2)
    let g = createGame(WH40K_CONFIG, players, 'admin')
    const pid = g.players[0].id
    g = addScore(g, pid, 10, 'primary', 'sess')
    g = addScore(g, pid, 5, 'secondary', 'sess')
    expect(totalScore(g, pid)).toBe(15)
  })
})

describe('timer', () => {
  it('starts timer by setting timerEndsAt', () => {
    const before = Date.now()
    const g = startTimer(createGame({ ...GENERIC_CONFIG, timerEnabled: true, timerSeconds: 60 }, makePlayers(2), 'admin'))
    expect(g.timerEndsAt).toBeGreaterThanOrEqual(before + 59000)
  })

  it('pause captures timerPausedAt', () => {
    let g = startTimer(createGame({ ...GENERIC_CONFIG, timerEnabled: true, timerSeconds: 60 }, makePlayers(2), 'admin'))
    g = pauseTimer(g)
    expect(g.timerPausedAt).toBeTruthy()
  })

  it('resume clears timerPausedAt', () => {
    let g = startTimer(createGame({ ...GENERIC_CONFIG, timerEnabled: true, timerSeconds: 60 }, makePlayers(2), 'admin'))
    g = pauseTimer(g)
    g = resumeTimer(g)
    expect(g.timerPausedAt).toBeUndefined()
  })

  it('addTime extends timerEndsAt', () => {
    let g = startTimer(createGame({ ...GENERIC_CONFIG, timerEnabled: true, timerSeconds: 60 }, makePlayers(2), 'admin'))
    const before = g.timerEndsAt!
    g = addTime(g, 30)
    expect(g.timerEndsAt).toBeGreaterThan(before)
  })

  it('endTurn clears timer', () => {
    let g = startTimer(createGame({ ...GENERIC_CONFIG, timerEnabled: true, timerSeconds: 60 }, makePlayers(2), 'admin'))
    g = endTurn(g)
    expect(g.timerEndsAt).toBeUndefined()
  })
})
