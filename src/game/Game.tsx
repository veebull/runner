import { useEffect } from 'react'
import Phaser from 'phaser'
import { MainScene } from './scenes/MainScene'
import { GameOverScene } from './scenes/GameOverScene'

export default function Game() {
  useEffect(() => {
    const config: Phaser.Types.Core.GameConfig = {
      type: Phaser.AUTO,
      parent: 'game-container',
      backgroundColor: '#000000',
      scale: {
        mode: Phaser.Scale.RESIZE,
        width: window.innerWidth,
        height: window.innerHeight,
      },
      physics: {
        default: 'arcade',
        arcade: {
          gravity: { y: 0 },
          debug: false
        }
      },
      scene: [MainScene, GameOverScene]
    }

    const game = new Phaser.Game(config)

    return () => {
      game.destroy(true)
    }
  }, [])

  return null
} 