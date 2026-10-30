import { useState } from 'react'
import type { GameState } from '../types'
import { useStore } from '../store'
import { activePlayerId } from '../engine'
import { Modal } from '../ui/Modal'
import { Btn } from '../ui/Btn'

interface Props { game: GameState; onClose: () => void }

export function AdminPanel({ game, onClose }: Props) {
  const { pauseGame, resumeGame, skipTurn, reorderTurnOrder, setGame, saveGame } = useStore()
  const [view, setView] = useState<'main' | 'order' | 'history'>('main')
  const [orderDraft, setOrderDraft] = useState([...game.turnOrder])
  const [confirmEnd, setConfirmEnd] = useState(false)

  const paused = game.status === 'paused'

  function moveUp(idx: number) {
    if (idx === 0) return
    const d = [...orderDraft]; [d[idx - 1], d[idx]] = [d[idx], d[idx - 1]]; setOrderDraft(d)
  }
  function moveDown(idx: number) {
    if (idx === orderDraft.length - 1) return
    const d = [...orderDraft]; [d[idx], d[idx + 1]] = [d[idx + 1], d[idx]]; setOrderDraft(d)
  }
  function applyOrder(now: boolean) {
    reorderTurnOrder(orderDraft, now)
    setView('main')
  }

  function endGame() {
    const next = { ...game, status: 'completed' as const, updatedAt: Date.now() }
    setGame(next)
    if (game.config.mode === 'pass-and-play') saveGame(next)
    onClose()
  }

  if (view === 'order') {
    const activePid = activePlayerId(game)
    return (
      <Modal title="Turn Order" onClose={() => setView('main')}
        footer={
          <>
            <Btn size="sm" onClick={() => applyOrder(false)}>Apply next round</Btn>
            <Btn size="sm" variant="primary" onClick={() => applyOrder(true)}>Apply now</Btn>
          </>
        }
      >
        <p className="text-[var(--color-muted)] text-sm mb-3">Drag or use buttons to reorder upcoming turns.</p>
        <div className="flex flex-col gap-2">
          {orderDraft.map((pid, i) => {
            const p = game.players.find(x => x.id === pid)!
            const isActive = pid === activePid
            return (
              <div key={pid} className={`flex items-center gap-2 p-2 rounded-lg border ${isActive ? 'border-[var(--color-accent)]' : 'border-[var(--color-border)]'}`}>
                <div className="w-7 h-7 rounded-full flex items-center justify-center text-xs font-bold"
                  style={{ background: p.color }}>{p.name[0]}</div>
                <span className="flex-1 text-sm">{p.name} {isActive ? '(active)' : ''}</span>
                <button onClick={() => moveUp(i)} disabled={i === 0} className="text-[var(--color-muted)] disabled:opacity-30 px-1" aria-label="Move up">↑</button>
                <button onClick={() => moveDown(i)} disabled={i === orderDraft.length - 1} className="text-[var(--color-muted)] disabled:opacity-30 px-1" aria-label="Move down">↓</button>
              </div>
            )
          })}
        </div>
      </Modal>
    )
  }

  if (view === 'history') {
    return (
      <Modal title="Game History" onClose={() => setView('main')}>
        <div className="flex flex-col gap-1 text-sm">
          {[...game.history].reverse().slice(0, 100).map(e => (
            <div key={e.id} className="flex gap-2 py-1.5 border-b border-[var(--color-border)]">
              <span className="text-[var(--color-muted)] text-xs w-16 shrink-0">{new Date(e.timestamp).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}</span>
              <span className="capitalize text-[var(--color-text)]">{e.type.replace(/_/g, ' ')}</span>
              {e.detail && <span className="text-[var(--color-muted)]">{e.detail}</span>}
            </div>
          ))}
        </div>
      </Modal>
    )
  }

  return (
    <Modal title="Admin Panel" onClose={onClose}>
      <div className="flex flex-col gap-2">
        <AdminRow label="⏸ Pause game" onClick={() => { paused ? resumeGame() : pauseGame() }}>
          {paused ? 'Resume' : 'Pause'}
        </AdminRow>
        <AdminRow label="⏭ Skip current turn" onClick={() => { skipTurn(); onClose() }}>Skip</AdminRow>
        <AdminRow label="🔀 Turn order" onClick={() => setView('order')}>Manage</AdminRow>
        <AdminRow label="📋 Game history" onClick={() => setView('history')}>View</AdminRow>
        <div className="mt-4 pt-4 border-t border-[var(--color-border)]">
          {confirmEnd ? (
            <div className="flex gap-2">
              <Btn variant="danger" className="flex-1" onClick={endGame}>End game now</Btn>
              <Btn className="flex-1" onClick={() => setConfirmEnd(false)}>Cancel</Btn>
            </div>
          ) : (
            <Btn variant="ghost" className="w-full text-[var(--color-danger)]" onClick={() => setConfirmEnd(true)}>
              End game early
            </Btn>
          )}
        </div>
      </div>
    </Modal>
  )
}

function AdminRow({ label, children, onClick }: { label: string; children: React.ReactNode; onClick: () => void }) {
  return (
    <div className="flex items-center justify-between py-2.5 border-b border-[var(--color-border)]">
      <span className="text-sm text-[var(--color-text)]">{label}</span>
      <Btn size="sm" onClick={onClick}>{children}</Btn>
    </div>
  )
}
