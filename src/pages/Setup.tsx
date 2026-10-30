import { useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { useStore } from '../store'
import type { GameConfig, Player } from '../types'
import { GENERIC_CONFIG, WH40K_CONFIG, PLAYER_COLORS } from '../types'
import { makePlayers } from '../engine'
import { Btn } from '../ui/Btn'

type Step = 'preset' | 'players' | 'config' | 'review'

export function Setup() {
  const navigate = useNavigate()
  const { createGame } = useStore()
  const [step, setStep] = useState<Step>('preset')
  const [config, setConfig] = useState<GameConfig>(GENERIC_CONFIG)
  const [players, setPlayers] = useState<Player[]>(makePlayers(2))

  function patch(partial: Partial<GameConfig>) { setConfig(c => ({ ...c, ...partial })) }

  function start() {
    createGame(config, players)
    const gameId = useStore.getState().game?.id
    if (gameId) navigate(`/game/${gameId}`)
  }

  return (
    <div className="min-h-dvh flex flex-col p-4 max-w-lg mx-auto gap-4">
      <header className="flex items-center gap-3 pt-4">
        <button onClick={() => step === 'preset' ? navigate('/') : setStep(prev(step))}
          className="text-[var(--color-muted)] text-2xl" aria-label="Back">‹</button>
        <h1 className="text-xl font-bold m-0 flex-1 text-[var(--color-text)]">New Game</h1>
        <StepIndicator current={step} />
      </header>

      {step === 'preset' && <PresetStep config={config} setConfig={setConfig} onNext={() => setStep('players')} />}
      {step === 'players' && <PlayersStep players={players} setPlayers={setPlayers} config={config} patch={patch} onNext={() => setStep('config')} />}
      {step === 'config' && <ConfigStep config={config} patch={patch} onNext={() => setStep('review')} />}
      {step === 'review' && <ReviewStep config={config} players={players} onStart={start} onBack={() => setStep('config')} />}
    </div>
  )
}

function StepIndicator({ current }: { current: Step }) {
  const steps: Step[] = ['preset', 'players', 'config', 'review']
  const idx = steps.indexOf(current)
  return (
    <div className="flex gap-1">
      {steps.map((s, i) => (
        <div key={s} className={`w-2 h-2 rounded-full ${i <= idx ? 'bg-[var(--color-accent)]' : 'bg-[var(--color-border)]'}`} />
      ))}
    </div>
  )
}

function prev(step: Step): Step {
  const steps: Step[] = ['preset', 'players', 'config', 'review']
  return steps[steps.indexOf(step) - 1] ?? 'preset'
}

function PresetStep({ config, setConfig, onNext }: { config: GameConfig; setConfig: (c: GameConfig) => void; onNext: () => void }) {
  return (
    <div className="flex flex-col gap-4">
      <h2 className="text-[var(--color-text)] text-lg font-semibold m-0">Choose a preset</h2>
      {[
        { key: 'generic', label: '🎲 Generic Tabletop', desc: 'Board games, card games, custom games', cfg: GENERIC_CONFIG },
        { key: 'wh40k',   label: '⚔️ Warhammer-style',  desc: 'Category scoring: Primary, Secondary, Bonus, Penalty', cfg: WH40K_CONFIG },
      ].map(p => (
        <button key={p.key} onClick={() => { setConfig(p.cfg); onNext() }}
          className={`text-left p-4 rounded-xl border transition-colors ${
            config.preset === p.key
              ? 'border-[var(--color-accent)] bg-[var(--color-surface2)]'
              : 'border-[var(--color-border)] bg-[var(--color-surface)]'
          }`}
        >
          <div className="font-semibold text-[var(--color-text)]">{p.label}</div>
          <div className="text-[var(--color-muted)] text-sm mt-1">{p.desc}</div>
        </button>
      ))}
    </div>
  )
}

function PlayersStep({ players, setPlayers, config, patch, onNext }: {
  players: Player[]; setPlayers: (p: Player[]) => void
  config: GameConfig; patch: (p: Partial<GameConfig>) => void; onNext: () => void
}) {
  function setCount(n: number) {
    if (n < 2) return
    if (n > players.length) {
      const extra = Array.from({ length: n - players.length }, (_, i) => ({
        id: Math.random().toString(36).slice(2),
        name: `Player ${players.length + i + 1}`,
        color: PLAYER_COLORS[(players.length + i) % PLAYER_COLORS.length],
        joined: false,
      }))
      setPlayers([...players, ...extra])
    } else {
      setPlayers(players.slice(0, n))
    }
  }

  function rename(id: string, name: string) {
    setPlayers(players.map(p => p.id === id ? { ...p, name } : p))
  }

  function setColor(id: string, color: string) {
    setPlayers(players.map(p => p.id === id ? { ...p, color } : p))
  }

  function moveUp(idx: number) {
    if (idx === 0) return
    const p = [...players]; [p[idx - 1], p[idx]] = [p[idx], p[idx - 1]]; setPlayers(p)
  }
  function moveDown(idx: number) {
    if (idx === players.length - 1) return
    const p = [...players]; [p[idx], p[idx + 1]] = [p[idx + 1], p[idx]]; setPlayers(p)
  }

  function randomize() {
    const p = [...players]
    for (let i = p.length - 1; i > 0; i--) {
      const j = Math.floor(Math.random() * (i + 1));
      [p[i], p[j]] = [p[j], p[i]]
    }
    setPlayers(p)
  }

  return (
    <div className="flex flex-col gap-4">
      <div className="flex items-center gap-3">
        <h2 className="text-[var(--color-text)] text-lg font-semibold m-0 flex-1">Players</h2>
        <div className="flex items-center gap-2 bg-[var(--color-surface2)] rounded-xl px-3 py-1.5">
          <button onClick={() => setCount(players.length - 1)} className="text-xl font-bold w-8 text-center" aria-label="Remove player">−</button>
          <span className="w-8 text-center font-bold">{players.length}</span>
          <button onClick={() => setCount(players.length + 1)} className="text-xl font-bold w-8 text-center" aria-label="Add player">+</button>
        </div>
      </div>

      <div className="flex gap-2">
        <Btn size="sm" onClick={randomize} className="flex-1">🔀 Randomize order</Btn>
        <div className="flex items-center gap-2 flex-1">
          <label className="text-[var(--color-muted)] text-sm">Mode:</label>
          <select
            value={config.mode}
            onChange={e => patch({ mode: e.target.value as any })}
            className="bg-[var(--color-surface2)] border border-[var(--color-border)] rounded-lg px-2 py-1 text-sm flex-1"
          >
            <option value="pass-and-play">Pass &amp; Play</option>
            <option value="multiplayer">Multiplayer</option>
          </select>
        </div>
      </div>

      <div className="flex flex-col gap-2 max-h-96 overflow-y-auto pr-1">
        {players.map((p, i) => (
          <div key={p.id} className="flex items-center gap-2 bg-[var(--color-surface)] rounded-xl p-2 border border-[var(--color-border)]">
            <input
              type="color"
              value={p.color}
              onChange={e => setColor(p.id, e.target.value)}
              className="w-8 h-8 rounded-lg cursor-pointer border-0 bg-transparent"
              aria-label={`Colour for ${p.name}`}
            />
            <input
              value={p.name}
              onChange={e => rename(p.id, e.target.value)}
              className="flex-1 bg-transparent text-[var(--color-text)] font-medium min-w-0"
              aria-label={`Player ${i + 1} name`}
            />
            <div className="flex gap-1">
              <button onClick={() => moveUp(i)} disabled={i === 0} className="text-[var(--color-muted)] disabled:opacity-30 px-1" aria-label="Move up">↑</button>
              <button onClick={() => moveDown(i)} disabled={i === players.length - 1} className="text-[var(--color-muted)] disabled:opacity-30 px-1" aria-label="Move down">↓</button>
            </div>
          </div>
        ))}
      </div>

      <Btn variant="primary" size="lg" className="w-full" onClick={onNext}>Continue →</Btn>
    </div>
  )
}

function ConfigStep({ config, patch, onNext }: { config: GameConfig; patch: (p: Partial<GameConfig>) => void; onNext: () => void }) {
  function addCat() {
    patch({ categories: [...config.categories, { id: Math.random().toString(36).slice(2), name: 'New Category' }] })
  }
  function removeCat(id: string) {
    if (config.categories.length <= 1) return
    patch({ categories: config.categories.filter(c => c.id !== id) })
  }
  function renameCat(id: string, name: string) {
    patch({ categories: config.categories.map(c => c.id === id ? { ...c, name } : c) })
  }

  return (
    <div className="flex flex-col gap-4">
      <h2 className="text-[var(--color-text)] text-lg font-semibold m-0">Game settings</h2>

      <Field label="Game name (optional)">
        <input value={config.name} onChange={e => patch({ name: e.target.value })}
          className="input" placeholder="My game" />
      </Field>

      <div className="flex gap-3">
        <Field label="Rounds" className="flex-1">
          <input type="number" min={1} value={config.rounds} onChange={e => patch({ rounds: +e.target.value })}
            className="input text-center" />
        </Field>
        <Field label="Win condition" className="flex-1">
          <select value={config.winCondition} onChange={e => patch({ winCondition: e.target.value as any })}
            className="input">
            <option value="highest">Highest wins</option>
            <option value="lowest">Lowest wins</option>
            <option value="none">No auto-winner</option>
          </select>
        </Field>
      </div>

      <Field label="Scoring">
        <div className="flex gap-2">
          {(['simple', 'category'] as const).map(m => (
            <button key={m} onClick={() => patch({ scoringMode: m })}
              className={`flex-1 py-2 rounded-lg border text-sm font-medium transition-colors ${
                config.scoringMode === m
                  ? 'border-[var(--color-accent)] bg-[var(--color-surface2)] text-[var(--color-accent)]'
                  : 'border-[var(--color-border)] text-[var(--color-muted)]'
              }`}
              aria-pressed={config.scoringMode === m}
            >
              {m === 'simple' ? 'Simple' : 'Categories'}
            </button>
          ))}
        </div>
      </Field>

      {config.scoringMode === 'category' && (
        <Field label="Categories">
          <div className="flex flex-col gap-2">
            {config.categories.map(c => (
              <div key={c.id} className="flex items-center gap-2">
                <input type="color" value={c.color ?? '#6c63ff'} onChange={e => patch({ categories: config.categories.map(x => x.id === c.id ? { ...x, color: e.target.value } : x) })}
                  className="w-8 h-8 rounded border-0 bg-transparent cursor-pointer" aria-label="Category colour" />
                <input value={c.name} onChange={e => renameCat(c.id, e.target.value)}
                  className="input flex-1" aria-label="Category name" />
                <button onClick={() => removeCat(c.id)} className="text-[var(--color-danger)]" aria-label="Remove">✕</button>
              </div>
            ))}
            <Btn size="sm" onClick={addCat}>+ Add category</Btn>
          </div>
        </Field>
      )}

      <Field label="Turn timer">
        <div className="flex items-center gap-3">
          <input type="checkbox" id="timer-enabled" checked={config.timerEnabled} onChange={e => patch({ timerEnabled: e.target.checked })}
            className="w-5 h-5" />
          <label htmlFor="timer-enabled" className="text-[var(--color-text)]">Enable turn timer</label>
        </div>
        {config.timerEnabled && (
          <div className="mt-2 flex gap-2 flex-wrap">
            {[30, 60, 120, 300, 600].map(s => (
              <button key={s} onClick={() => patch({ timerSeconds: s })}
                className={`px-3 py-1.5 rounded-lg text-sm border transition-colors ${
                  config.timerSeconds === s ? 'border-[var(--color-accent)] text-[var(--color-accent)]' : 'border-[var(--color-border)] text-[var(--color-muted)]'
                }`}
              >{s < 60 ? `${s}s` : `${s / 60}m`}</button>
            ))}
            <select value={config.timerExpiry} onChange={e => patch({ timerExpiry: e.target.value as any })}
              className="input ml-2">
              <option value="warn">Warn only</option>
              <option value="auto">Auto end turn</option>
            </select>
          </div>
        )}
      </Field>

      <Btn variant="primary" size="lg" className="w-full" onClick={onNext}>Review →</Btn>
    </div>
  )
}

function ReviewStep({ config, players, onStart, onBack }: {
  config: GameConfig; players: Player[]; onStart: () => void; onBack: () => void
}) {
  return (
    <div className="flex flex-col gap-4">
      <h2 className="text-[var(--color-text)] text-lg font-semibold m-0">Ready to start?</h2>
      <div className="bg-[var(--color-surface)] rounded-xl border border-[var(--color-border)] divide-y divide-[var(--color-border)]">
        {[
          ['Game',    config.name || '(no name)'],
          ['Preset',  config.preset === 'wh40k' ? 'Warhammer-style' : 'Generic tabletop'],
          ['Mode',    config.mode === 'multiplayer' ? 'Multiplayer' : 'Pass & Play'],
          ['Rounds',  String(config.rounds)],
          ['Players', players.map(p => p.name).join(', ')],
          ['Scoring', config.scoringMode === 'category' ? config.categories.map(c => c.name).join(', ') : 'Simple'],
          ['Timer',   config.timerEnabled ? `${config.timerSeconds}s (${config.timerExpiry})` : 'Off'],
        ].map(([k, v]) => (
          <div key={k} className="flex gap-3 px-4 py-2.5 text-sm">
            <span className="text-[var(--color-muted)] w-20 shrink-0">{k}</span>
            <span className="text-[var(--color-text)]">{v}</span>
          </div>
        ))}
      </div>
      <div className="flex gap-3">
        <Btn className="flex-1" onClick={onBack}>← Back</Btn>
        <Btn variant="primary" size="lg" className="flex-1" onClick={onStart}>Start Game</Btn>
      </div>
    </div>
  )
}

function Field({ label, children, className = '' }: { label: string; children: React.ReactNode; className?: string }) {
  return (
    <div className={`flex flex-col gap-1.5 ${className}`}>
      <label className="text-[var(--color-muted)] text-sm font-medium">{label}</label>
      {children}
    </div>
  )
}

// Inject global input style
const style = document.createElement('style')
style.textContent = `.input { background: var(--color-surface2); border: 1px solid var(--color-border); border-radius: 0.75rem; padding: 0.625rem 0.75rem; color: var(--color-text); width: 100%; }`
document.head.appendChild(style)
