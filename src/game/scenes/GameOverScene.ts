import Phaser from 'phaser';

export class GameOverScene extends Phaser.Scene {
  private score: number = 0;
  private distance: number = 0;
  private lives: number = 0;

  constructor() {
    super({ key: 'GameOverScene' });
  }

  init(data: { score: number; distance: number; lives: number }) {
    this.score = data.score;
    this.distance = data.distance;
    this.lives = data.lives;
  }

  create() {
    const centerX = this.cameras.main.centerX;
    const centerY = this.cameras.main.centerY;

    this.add
      .text(centerX, centerY - 150, 'Game Over', {
        fontSize: '64px',
        color: '#fff',
      })
      .setOrigin(0.5);

    this.add
      .text(centerX, centerY - 50, `Final Score: ${this.score}`, {
        fontSize: '32px',
        color: '#fff',
      })
      .setOrigin(0.5);

    this.add
      .text(centerX, centerY, `Distance: ${this.distance}m`, {
        fontSize: '32px',
        color: '#fff',
      })
      .setOrigin(0.5);

    const livesText = this.add
      .text(centerX, centerY + 50, `Lives: ${this.lives}`, {
        fontSize: '32px',
        color: '#fff',
      })
      .setOrigin(0.5);

    const buyButton = this.add
      .text(centerX, centerY + 100, 'Buy More Lives (+1)', {
        fontSize: '32px',
        color: '#fff',
        backgroundColor: '#4a4a4a',
        padding: { x: 20, y: 10 },
      })
      .setOrigin(0.5)
      .setInteractive();

    buyButton.on('pointerdown', () => {
      this.lives++;
      livesText.setText(`Lives: ${this.lives}`);
    });

    const restartButton = this.add
      .text(centerX, centerY + 200, 'Play Again', {
        fontSize: '32px',
        color: '#fff',
        backgroundColor: '#4a4a4a',
        padding: { x: 20, y: 10 },
      })
      .setOrigin(0.5)
      .setInteractive();

    restartButton.on('pointerdown', () => {
      this.scene.start('MainScene', { lives: this.lives });
    });
  }
}
