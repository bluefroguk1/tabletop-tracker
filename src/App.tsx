import { HashRouter, Routes, Route } from 'react-router-dom'
import { useEffect } from 'react'
import { Home } from './pages/Home'
import { Setup } from './pages/Setup'
import { Game } from './pages/Game'
import { Results } from './pages/Results'
import { Join } from './pages/Join'
import { useStore } from './store'

export default function App() {
  const { theme } = useStore()

  useEffect(() => {
    document.documentElement.classList.toggle('light', theme === 'light')
  }, [theme])

  return (
    <HashRouter>
      <Routes>
        <Route path="/" element={<Home />} />
        <Route path="/setup" element={<Setup />} />
        <Route path="/game/:id" element={<Game />} />
        <Route path="/results/:id" element={<Results />} />
        <Route path="/join" element={<Join />} />
      </Routes>
    </HashRouter>
  )
}
