import type { Player } from '../types'
import { Btn } from '../ui/Btn'

export function Handover({ currentPlayer, nextPlayer, onReady }: {
  currentPlayer: Player
  nextPlayer: Player
  onReady: () => void
}) {
  return (
    <div className="min-h-dvh flex flex-col items-center justify-center p-6 gap-8 bg-[var(--color-bg)] text-center">
      <div className="text-6xl">✓</div>
      <div>
        <div className="text-[var(--color-muted)] mb-2">Turn complete</div>
        <div className="text-xl font-bold"
          style={{ color: currentPlayer.color }}>{currentPlayer.name}'s turn is done</div>
      </div>
      <div
        className="w-24 h-24 rounded-full flex items-center justify-center text-4xl font-bold mx-auto"
        style={{ background: nextPlayer.color }}
        aria-hidden="true"
      >
        {nextPlayer.name[0]}
      </div>
      <div className="text-2xl font-semibold">
        Pass the device to<br />
        <span style={{ color: nextPlayer.color }}>{nextPlayer.name}</span>
      </div>
      <Btn variant="primary" size="lg" className="w-full max-w-xs" onClick={onReady} autoFocus>
        I'm ready →
      </Btn>
    </div>
  )
}
