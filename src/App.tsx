import { useEffect } from 'react'
import Game from './game/Game'
import './App.css'

function App() {
  useEffect(() => {
    // Initialize Telegram WebApp
    const tg = window.Telegram.WebApp
    tg.expand() // Make app fullscreen
    tg.enableClosingConfirmation() // Prevent accidental closes
  }, [])

  return (
    <div id="game-container">
      <Game />
    </div>
  )
}

export default App
