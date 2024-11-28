import Phaser from 'phaser';

export class MainScene extends Phaser.Scene {
  private player!: Phaser.GameObjects.Sprite;
  private obstacles!: Phaser.GameObjects.Group;
  //   private ground!: Phaser.GameObjects.TileSprite
  private score: number = 0;
  private lives: number = 3;
  private scoreText!: Phaser.GameObjects.Text;
  private livesText!: Phaser.GameObjects.Text;
  private distanceText!: Phaser.GameObjects.Text;
  private gyroEnabled: boolean = false;
  private gameSpeed: number = 5;
  private distance: number = 0;
  private playerSpeed: number = 0;
  private groundFar!: Phaser.GameObjects.TileSprite;
  private groundNear!: Phaser.GameObjects.TileSprite;
  private lastSpawnTime: number = 0;
  private spawnInterval: number = 2000;
  private minSpawnInterval: number = 800;
  private difficultyLevel: number = 1;
  //   private baseEnemyCount: number = 1

  constructor() {
    super({ key: 'MainScene' });
  }

  preload() {
    const graphics = this.add.graphics();

    graphics.fillStyle(0x4444ff);
    graphics.beginPath();
    graphics.moveTo(16, 0);
    graphics.lineTo(32, 32);
    graphics.lineTo(0, 32);
    graphics.closePath();
    graphics.fill();
    graphics.generateTexture('player', 32, 32);

    graphics.clear();
    graphics.fillStyle(0xff0000);
    graphics.fillRect(0, 0, 32, 32);
    graphics.generateTexture('zombie', 32, 32);

    graphics.clear();
    graphics.fillStyle(0x00ff00);
    graphics.lineStyle(2, 0x00aa00);
    graphics.strokeCircle(16, 16, 14);
    graphics.fillCircle(16, 16, 14);
    graphics.generateTexture('bonus', 32, 32);

    graphics.clear();
    graphics.fillStyle(0xff0066);
    graphics.lineStyle(2, 0xff0000);

    // Draw heart shape
    graphics.beginPath();
    graphics.moveTo(16, 20);
    graphics.lineTo(8, 12);
    graphics.arc(6, 12, 2, 0, Math.PI, true);
    graphics.lineTo(16, 4);
    graphics.lineTo(24, 12);
    graphics.arc(26, 12, 2, 0, Math.PI, true);
    graphics.lineTo(16, 20);
    graphics.closePath();
    graphics.fill();
    graphics.stroke();

    graphics.generateTexture('heart', 32, 32);

    graphics.clear();
    graphics.fillStyle(0x553311);
    graphics.fillRect(0, 0, 128, 512);
    graphics.lineStyle(1, 0x442200);
    for (let i = 0; i < 512; i += 32) {
      graphics.lineBetween(0, i, 128, i);
    }
    for (let i = 0; i < 128; i += 16) {
      graphics.lineBetween(i, 0, i, 512);
    }
    graphics.generateTexture('ground-far', 128, 512);

    graphics.clear();
    graphics.fillStyle(0x664422);
    graphics.fillRect(0, 0, 128, 512);
    graphics.lineStyle(2, 0x553311);
    for (let i = 0; i < 512; i += 64) {
      graphics.lineBetween(0, i, 128, i);
    }
    for (let i = 0; i < 128; i += 32) {
      graphics.lineBetween(i, 0, i, 512);
    }
    graphics.generateTexture('ground-near', 128, 512);

    graphics.destroy();
  }

  create() {
    // Initialize Telegram WebApp
    if (window.Telegram?.WebApp) {
      const webapp = window.Telegram.WebApp;
      webapp.expand(); // Make app fullscreen
      webapp.enableClosingConfirmation(); // Prevent accidental closes

      // Request fullscreen mode
      try {
        webapp.requestFullscreen();
      } catch (error) {
        console.warn('Fullscreen not supported:', error);
      }

      // Lock to portrait orientation for consistent gameplay
      if (webapp.DeviceOrientation) {
        try {
          webapp.lockOrientation();
        } catch (error) {
          console.warn('Orientation lock not supported:', error);
        }
      }
    }

    // Disable vertical swipes to prevent accidental closing
    window.Telegram?.WebApp?.disableVerticalSwipes();

    const width = this.cameras.main.width;
    const height = this.cameras.main.height;

    this.groundFar = this.add
      .tileSprite(0, 0, width, height, 'ground-far')
      .setOrigin(0, 0)
      .setAlpha(0.7);

    this.groundNear = this.add
      .tileSprite(0, 0, width, height, 'ground-near')
      .setOrigin(0, 0);

    this.player = this.add
      .sprite(width * 0.5, height * 0.8, 'player')
      .setScale(2)
      .setTint(0x4444ff);

    this.setupUI();

    this.obstacles = this.add.group();

    for (let i = 0; i < 5; i++) {
      this.spawnZombie();
    }

    this.setupControls();
  }

  setupUI() {
    const padding = 100;
    const textConfig = {
      fontSize: '32px',
      color: '#fff',
      stroke: '#000',
      strokeThickness: 4,
    };

    this.scoreText = this.add.text(
      16,
      padding,
      `Score:${this.score > 0 ? ' ' + this.score : ''}`,
      textConfig
    );
    this.livesText = this.add.text(
      16,
      padding + 40,
      `Lives: ${this.lives}`,
      textConfig
    );
    this.distanceText = this.add
      .text(
        this.cameras.main.centerX,
        padding,
        `${Math.floor(this.distance)}m`,
        textConfig
      )
      .setOrigin(0.5, 0);
  }

  spawnZombie(count: number = 1) {
    const width = this.cameras.main.width;

    for (let i = 0; i < count; i++) {
      const section = width / count;
      const baseX = section * i;
      const x = baseX + Phaser.Math.Between(section * 0.2, section * 0.8);

      const zombie = this.add.sprite(x, -50, 'zombie');
      zombie.setScale(0.5);

      this.obstacles.add(zombie);
      zombie.setData('startX', x);

      const baseSpeed = 0.8 + this.difficultyLevel * 0.1;
      zombie.setData(
        'speed',
        Phaser.Math.FloatBetween(baseSpeed, baseSpeed * 1.5)
      );
      zombie.setData(
        'followStrength',
        Phaser.Math.FloatBetween(0.2, 0.3 + this.difficultyLevel * 0.05)
      );

      const duration = Math.max(2000 - this.difficultyLevel * 100, 1200);

      this.tweens.add({
        targets: zombie,
        y: this.cameras.main.height + 100,
        scaleX: 2,
        scaleY: 2,
        duration: duration,
        ease: 'Quad.in',
        onUpdate: () => {
          const progress = (zombie.y + 50) / (this.cameras.main.height + 150);
          const followStrength = zombie.getData('followStrength') * progress;

          const targetX = Phaser.Math.Linear(
            zombie.getData('startX'),
            this.player.x,
            followStrength
          );

          zombie.x = Phaser.Math.Linear(zombie.x, targetX, 0.1);
        },
        onComplete: () => zombie.destroy(),
      });
    }
  }

  spawnBonus() {
    const width = this.cameras.main.width;
    const x = Phaser.Math.Between(width * 0.1, width * 0.9);
    const bonus = this.add.sprite(x, -50, 'bonus');
    bonus.setScale(0.8);

    this.obstacles.add(bonus);
    bonus.setData('type', 'bonus');

    bonus.setBlendMode(Phaser.BlendModes.ADD);

    this.tweens.add({
      targets: bonus,
      y: this.cameras.main.height + 100,
      scale: 1.5,
      duration: 3000,
      ease: 'Linear',
      onComplete: () => bonus.destroy(),
    });
  }

  spawnHeart() {
    const width = this.cameras.main.width;
    const x = Phaser.Math.Between(width * 0.1, width * 0.9);
    const heart = this.add.sprite(x, -50, 'heart');
    heart.setScale(0.8);

    this.obstacles.add(heart);
    heart.setData('type', 'heart');

    // Add pulsing effect
    this.tweens.add({
      targets: heart,
      scale: 1,
      duration: 500,
      yoyo: true,
      repeat: -1,
      ease: 'Sine.easeInOut',
    });

    // Movement tween
    this.tweens.add({
      targets: heart,
      y: this.cameras.main.height + 100,
      scale: 1.5,
      duration: 3000,
      ease: 'Linear',
      onComplete: () => heart.destroy(),
    });
  }

  setupControls() {
    const keyboard = this.input.keyboard;
    if (keyboard) {
      keyboard.on('keydown-LEFT', () => {
        this.playerSpeed = -10;
      });
      keyboard.on('keydown-RIGHT', () => {
        this.playerSpeed = 10;
      });
      keyboard.on('keyup', () => {
        this.playerSpeed = 0;
      });
    }

    // Check if running in Telegram Web App
    if (window.Telegram?.WebApp) {
      const webapp = window.Telegram.WebApp;

      if (webapp.DeviceOrientation) {
        try {
          // Start device orientation tracking
          webapp.DeviceOrientation.start({
            refresh_rate: 60,
            need_absolute: false,
          });

          this.gyroEnabled = true;

          // Add event listener for orientation changes
          webapp.onEvent('deviceOrientationChanged', () => {
            const orientation = webapp.DeviceOrientation;
            if (
              orientation &&
              orientation.gamma !== null &&
              orientation.beta !== null
            ) {
              // Use beta for vertical orientation detection
              if (Math.abs(orientation.beta) > 60) {
                this.playerSpeed = -orientation.gamma * 25.5;
              } else {
                this.playerSpeed = orientation.gamma * 25.5;
              }
            }
          });
        } catch (error) {
          console.error('Failed to start device orientation:', error);
        }
      }
    } else if (window.DeviceOrientationEvent) {
      // Fallback to browser DeviceOrientation API
      if ((DeviceOrientationEvent as any).requestPermission) {
        (DeviceOrientationEvent as any)
          .requestPermission()
          .then((response: string) => {
            if (response === 'granted') {
              window.addEventListener(
                'deviceorientation',
                this.handleOrientation.bind(this)
              );
              this.gyroEnabled = true;
            }
          })
          .catch(console.error);
      } else {
        window.addEventListener(
          'deviceorientation',
          this.handleOrientation.bind(this)
        );
        this.gyroEnabled = true;
      }
    }
  }

  handleOrientation(event: DeviceOrientationEvent) {
    if (!this.gyroEnabled) return;

    const gamma = event.gamma;
    const beta = event.beta;

    if (gamma !== null && beta !== null) {
      if (Math.abs(beta) > 60) {
        this.playerSpeed = -gamma * 1.5;
      } else {
        this.playerSpeed = gamma * 1.5;
      }
    }
  }

  update(time: number) {
    this.groundFar.tilePositionY += this.gameSpeed * 2;
    this.groundNear.tilePositionY += this.gameSpeed * 4;

    const width = this.cameras.main.width;
    this.player.x = Phaser.Math.Clamp(
      this.player.x + this.playerSpeed,
      width * 0.1,
      width * 0.9
    );

    const currentLevel = Math.floor(this.score / 500) + 1;
    if (currentLevel !== this.difficultyLevel) {
      this.difficultyLevel = currentLevel;
      this.increaseDifficulty();
    }

    if (time > this.lastSpawnTime + this.spawnInterval) {
      const baseCount = this.getEnemyCount();
      const randomExtra = Phaser.Math.Between(
        0,
        Math.floor(this.difficultyLevel / 2)
      );
      const enemyCount = baseCount + randomExtra;

      this.spawnZombie(enemyCount);
      this.lastSpawnTime = time;

      const bonusChance = Math.min(15 + this.difficultyLevel * 2, 30);
      if (Phaser.Math.Between(0, 100) < bonusChance) {
        this.spawnBonus();
      }

      const heartChance = Math.min(10 + this.difficultyLevel * 2, 30);
      if (Phaser.Math.Between(0, 100) < heartChance) {
        this.spawnHeart();
        if (Phaser.Math.Between(0, 100) < 30) {
          this.time.delayedCall(500, () => this.spawnHeart());
        }
      }
    }

    this.obstacles.getChildren().forEach((obstacle: any) => {
      if (obstacle.y > 0) {
        const distance = Phaser.Math.Distance.Between(
          this.player.x,
          this.player.y,
          obstacle.x,
          obstacle.y
        );

        if (distance < 60) {
          if (!obstacle.getData('hit')) {
            if (obstacle.getData('type') === 'bonus') {
              this.distance += 100;
              this.scoreText.setText(
                `Score:${this.score > 0 ? ' ' + this.score : ''}`
              );

              this.tweens.add({
                targets: obstacle,
                scale: 2,
                alpha: 0,
                duration: 200,
                onComplete: () => obstacle.destroy(),
              });

              const flash = this.add.circle(
                obstacle.x,
                obstacle.y,
                30,
                0x00ff00,
                0.5
              );
              this.tweens.add({
                targets: flash,
                scale: 2,
                alpha: 0,
                duration: 300,
                onComplete: () => flash.destroy(),
              });

              obstacle.setData('hit', true);
            } else if (obstacle.getData('type') === 'heart') {
              // Handle heart pickup
              this.lives++;
              this.livesText.setText(`Lives: ${this.lives}`);

              // Heart collection effect
              this.tweens.add({
                targets: obstacle,
                scale: 2,
                alpha: 0,
                duration: 200,
                onComplete: () => obstacle.destroy(),
              });

              // Show +1 life text
              const lifeText = this.add
                .text(obstacle.x, obstacle.y, '+1 Life', {
                  fontSize: '24px',
                  color: '#ff0066',
                  stroke: '#000',
                  strokeThickness: 4,
                })
                .setOrigin(0.5);

              this.tweens.add({
                targets: lifeText,
                y: lifeText.y - 50,
                alpha: 0,
                duration: 1000,
                onComplete: () => lifeText.destroy(),
              });

              obstacle.setData('hit', true);
            } else {
              this.handleCollision(obstacle);
              obstacle.setData('hit', true);
            }
          }
        }
      }
    });

    this.distance += this.gameSpeed * 0.1;
    this.distanceText.setText(`${Math.floor(this.distance)}m`);
    this.gameSpeed += 0.001;
  }

  handleCollision(zombie: Phaser.GameObjects.Sprite) {
    this.lives--;
    this.livesText.setText(`Lives: ${this.lives}`);

    this.cameras.main.shake(200, 0.01);

    this.tweens.add({
      targets: zombie,
      alpha: 0,
      scale: 4,
      tint: 0xff0000,
      duration: 200,
      onComplete: () => zombie.destroy(),
    });

    if (this.lives <= 0) {
      this.time.delayedCall(500, () => {
        this.scene.start('GameOverScene', {
          score: this.score,
          distance: Math.floor(this.distance),
          lives: 0,
        });
      });
    }
  }

  getEnemyCount(): number {
    if (this.score < 500) {
      return Phaser.Math.Between(1, 2);
    } else if (this.score < 1000) {
      return Phaser.Math.Between(2, 3);
    } else if (this.score < 2000) {
      return Phaser.Math.Between(2, 4);
    } else if (this.score < 3000) {
      return Phaser.Math.Between(3, 4);
    } else {
      return Phaser.Math.Between(3, 5);
    }
  }

  increaseDifficulty() {
    this.gameSpeed *= 1.1;

    this.spawnInterval = Math.max(
      this.spawnInterval - 100,
      this.minSpawnInterval
    );

    const text = this.add
      .text(
        this.cameras.main.centerX,
        this.cameras.main.centerY,
        `Difficulty ${this.difficultyLevel}!`,
        {
          fontSize: '48px',
          color: '#ff0000',
          stroke: '#000',
          strokeThickness: 4,
        }
      )
      .setOrigin(0.5);

    this.tweens.add({
      targets: text,
      scale: { from: 0.5, to: 1.5 },
      alpha: { from: 1, to: 0 },
      duration: 1000,
      ease: 'Quad.out',
      onComplete: () => text.destroy(),
    });
  }

  init(data?: { lives: number }) {
    // Reset all game values
    this.score = 0;
    this.distance = 0;
    this.gameSpeed = 5;
    this.difficultyLevel = 1;
    this.lives = data?.lives || 3; // Use passed lives or default to 3
  }

  // Add cleanup in scene shutdown
  shutdown() {
    if (window.Telegram?.WebApp) {
      const webapp = window.Telegram.WebApp;

      // Exit fullscreen and unlock orientation when game ends
      try {
        webapp.exitFullscreen();
        webapp.unlockOrientation();
      } catch (error) {
        console.warn('Error cleaning up:', error);
      }
    }
  }
}
