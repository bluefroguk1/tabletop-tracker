import { useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { isFirebaseConfigured, syncRead } from '../firebase'
import { useStore } from '../store'
import { joinMultiplayer } from '../store'
import { Btn } from '../ui/Btn'
import { QRCode } from '../ui/QRCode'

export function Join() {
  const navigate = useNavigate()
  const { game } = useStore()
  const [code, setCode] = useState('')
  const [error, setError] = useState('')
  const [loading, setLoading] = useState(false)

  // If we're the host and in waiting room, show invite screen
  if (game?.status === 'waiting') {
    const joinUrl = `${location.origin}${import.meta.env.BASE_URL}#/join?game=${game.id}`
    return (
      <div className="min-h-dvh flex flex-col items-center p-4 max-w-lg mx-auto gap-6 pt-12">
        <h1 className="text-2xl font-bold text-center text-[var(--color-text)]">
          {game.config.name || 'Your game is ready'}
        </h1>
        <p className="text-[var(--color-muted)] text-center">Share this code or QR code with other players</p>
        <div
          className="text-5xl font-bold font-mono tracking-widest text-[var(--color-accent)] bg-[var(--color-surface)] px-8 py-4 rounded-2xl border border-[var(--color-border)] select-all"
          aria-label={`Join code: ${game.id.toUpperCase()}`}
        >
          {game.id.slice(0, 6).toUpperCase()}
        </div>
        <QRCode value={joinUrl} />
        <Btn size="sm" onClick={() => navigator.clipboard.writeText(joinUrl)}>Copy link</Btn>
        <div className="mt-2">
          <div className="text-[var(--color-muted)] text-sm mb-2">Players joined:</div>
          {game.players.map(p => (
            <div key={p.id} className="flex items-center gap-2 py-1">
              <div className="w-6 h-6 rounded-full" style={{ background: p.color }} />
              <span>{p.name}</span>
              <span className="text-[var(--color-muted)] text-xs ml-auto">{p.joined ? '✓ joined' : 'waiting'}</span>
            </div>
          ))}
        </div>
        <Btn variant="primary" size="lg" className="w-full" onClick={() => navigate(`/game/${game.id}`)}>
          Start game →
        </Btn>
      </div>
    )
  }

  async function join() {
    setError('')
    if (!code.trim()) { setError('Enter a join code'); return }
    if (!isFirebaseConfigured()) {
      setError('Multiplayer requires Firebase to be configured. See README for setup instructions.')
      return
    }
    setLoading(true)
    try {
      const gameId = code.trim().toLowerCase()
      const state = await syncRead(gameId)
      if (!state) { setError('Game not found. Check the code and try again.'); return }
      await joinMultiplayer(state.id)
      navigate(`/game/${state.id}`)
    } catch (e) {
      setError('Could not connect. Check your connection and try again.')
    } finally {
      setLoading(false)
    }
  }

  // Check for ?game= in URL
  const params = new URLSearchParams(location.search)
  const autoGame = params.get('game')

  return (
    <div className="min-h-dvh flex flex-col items-center justify-center p-6 max-w-lg mx-auto gap-6">
      <button onClick={() => navigate('/')} className="self-start text-[var(--color-muted)] text-2xl" aria-label="Back">‹</button>
      <h1 className="text-2xl font-bold text-[var(--color-text)]">Join a Game</h1>
      <p className="text-[var(--color-muted)] text-center">Enter the 6-character code shown on the host's device</p>
      <input
        value={autoGame ?? code}
        onChange={e => setCode(e.target.value.toUpperCase())}
        placeholder="ABC123"
        maxLength={8}
        className="text-3xl font-mono text-center tracking-widest w-full bg-[var(--color-surface)] border border-[var(--color-border)] rounded-2xl px-4 py-4 text-[var(--color-text)] uppercase"
        aria-label="Join code"
        autoFocus
        onKeyDown={e => { if (e.key === 'Enter') join() }}
      />
      {error && <p className="text-[var(--color-danger)] text-sm text-center" role="alert">{error}</p>}
      <Btn variant="primary" size="lg" className="w-full" onClick={join} disabled={loading}>
        {loading ? 'Connecting…' : 'Join Game'}
      </Btn>
    </div>
  )
}
