// Firebase Realtime Database adapter
// Replace firebaseConfig with your own project values.
// Free tier is sufficient for friend groups.
import { initializeApp, getApps } from 'firebase/app'
import type { FirebaseApp } from 'firebase/app'
import { getDatabase, ref, set, get, onValue, off } from 'firebase/database'
import type { GameState } from './types'

// Placeholder config — the user fills this in from their Firebase console
// or sets VITE_FIREBASE_* env vars.
const firebaseConfig = {
  apiKey:            import.meta.env.VITE_FIREBASE_API_KEY            ?? '',
  authDomain:        import.meta.env.VITE_FIREBASE_AUTH_DOMAIN        ?? '',
  databaseURL:       import.meta.env.VITE_FIREBASE_DATABASE_URL       ?? '',
  projectId:         import.meta.env.VITE_FIREBASE_PROJECT_ID         ?? '',
  storageBucket:     import.meta.env.VITE_FIREBASE_STORAGE_BUCKET     ?? '',
  messagingSenderId: import.meta.env.VITE_FIREBASE_MESSAGING_SENDER_ID ?? '',
  appId:             import.meta.env.VITE_FIREBASE_APP_ID             ?? '',
}

function getApp(): FirebaseApp {
  if (getApps().length) return getApps()[0]
  return initializeApp(firebaseConfig)
}

function db() { return getDatabase(getApp()) }

export function isFirebaseConfigured(): boolean {
  return !!firebaseConfig.databaseURL
}

export async function syncWrite(gameId: string, state: GameState): Promise<void> {
  if (!isFirebaseConfigured()) return
  await set(ref(db(), `games/${gameId}`), state)
}

export async function syncRead(gameId: string): Promise<GameState | null> {
  if (!isFirebaseConfigured()) return null
  const snap = await get(ref(db(), `games/${gameId}`))
  return snap.exists() ? (snap.val() as GameState) : null
}

export function syncListen(gameId: string, cb: (g: GameState) => void): () => void {
  if (!isFirebaseConfigured()) return () => {}
  const r = ref(db(), `games/${gameId}`)
  onValue(r, (snap) => { if (snap.exists()) cb(snap.val() as GameState) })
  return () => off(r)
}

export function syncUnlisten(gameId: string): void {
  if (!isFirebaseConfigured()) return
  off(ref(db(), `games/${gameId}`))
}
