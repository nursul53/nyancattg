// main.js — игровая логика и визуал
import { initInput, getInputState, setTouchDirection } from "./input.js";
import { loadAssets } from "./assets.js";

const canvas = document.getElementById("game");
const ctx = canvas.getContext("2d");

canvas.width = window.innerWidth;
canvas.height = window.innerHeight;

let WIDTH = canvas.width;
let HEIGHT = canvas.height;

let score = 10;
let happiness = 3;
let omnomnometr = [];
let foodTimer = 0;
let foods = [];
let stars = [];
let happinessStars = [];
let lastHappinessStar = Date.now();
let gameOver = false;

let cat = {
  x: 50,
  y: HEIGHT / 2,
  width: 100,
  height: 64,
  speed: 5,
  frameIndex: 0,
  frameTimer: 0,
  frameSpeed: 0.2,
};

let images = {};
let sounds = {};

function randomInt(min, max) {
  return Math.floor(Math.random() * (max - min + 1)) + min;
}

class Food {
  constructor(kind) {
    this.kind = kind;
    this.image = kind === 'good' ? images.good[randomInt(0, images.good.length - 1)] : images.bad[randomInt(0, images.bad.length - 1)];
    this.width = 48;
    this.height = 48;
    this.x = WIDTH + 50;
    this.y = randomInt(50, HEIGHT - 50);
    this.speed = 4 + score * 0.1;
  }

  update() {
    this.x -= this.speed;
  }

  draw() {
    ctx.drawImage(this.image, this.x, this.y, this.width, this.height);
  }

  collidesWith(rect) {
    return this.x < rect.x + rect.width &&
           this.x + this.width > rect.x &&
           this.y < rect.y + rect.height &&
           this.y + this.height > rect.y;
  }
}

class Star {
  constructor() {
    this.x = randomInt(0, WIDTH);
    this.y = randomInt(0, HEIGHT);
    this.speed = randomInt(1, 5);
    this.size = randomInt(1, 2);
  }

  update() {
    this.x -= this.speed;
    if (this.x < 0) {
      this.x = WIDTH;
      this.y = randomInt(0, HEIGHT);
    }
  }

  draw() {
    ctx.fillStyle = "white";
    ctx.beginPath();
    ctx.arc(this.x, this.y, this.size, 0, 2 * Math.PI);
    ctx.fill();
  }
}

class HappinessStar {
  constructor() {
    this.x = WIDTH + 50;
    this.y = randomInt(50, HEIGHT - 50);
    this.speed = 7;
    this.size = 15;
  }

  update() {
    this.x -= this.speed;
  }

  draw() {
    ctx.fillStyle = "yellow";
    ctx.beginPath();
    ctx.arc(this.x + this.size / 2, this.y + this.size / 2, this.size, 0, 2 * Math.PI);
    ctx.fill();
    ctx.fillStyle = "white";
    ctx.beginPath();
    ctx.arc(this.x + this.size / 2, this.y + this.size / 2, this.size / 2, 0, 2 * Math.PI);
    ctx.fill();
  }

  collidesWith(rect) {
    return this.x < rect.x + rect.width &&
           this.x + this.size > rect.x &&
           this.y < rect.y + rect.height &&
           this.y + this.size > rect.y;
  }
}

function drawBackground() {
  ctx.fillStyle = "#0a0a28";
  ctx.fillRect(0, 0, WIDTH, HEIGHT);
}

function drawCat() {
  const frame = images.cat[Math.floor(cat.frameIndex) % images.cat.length];
  ctx.drawImage(frame, cat.x, cat.y, cat.width, cat.height);
}

function drawUI() {
  ctx.fillStyle = "white";
  ctx.font = "24px Arial";
  ctx.fillText(`Счёт: ${score}`, WIDTH / 2 - 50, 30);
  ctx.fillText(`Счастье: ${happiness}`, WIDTH - 150, 30);

  for (let i = 0; i < Math.min(omnomnometr.length, 10); i++) {
    ctx.drawImage(omnomnometr[i], 10 + i * 30, 40, 32, 32);
  }
}

function update() {
  if (gameOver) return;

  const input = getInputState();

  if (input.up && cat.y > 0) cat.y -= cat.speed;
  if (input.down && cat.y + cat.height < HEIGHT) cat.y += cat.speed;
  if (input.left && cat.x > 0) cat.x -= cat.speed;
  if (input.right && cat.x + cat.width < WIDTH) cat.x += cat.speed;

  cat.frameIndex += cat.frameSpeed;

  foodTimer -= 1 / 60;
  if (foodTimer <= 0) {
    const kind = Math.random() < 0.7 ? 'good' : 'bad';
    foods.push(new Food(kind));
    foodTimer = Math.random() * 0.5 + Math.max(0.2, 2 - score * 0.05);
  }

  foods.forEach((food, index) => {
    food.update();
    if (food.collidesWith(cat)) {
      if (food.kind === "good") {
        sounds.eatGood?.play();
        score++;
        omnomnometr.push(food.image);
        if (omnomnometr.length > 10) omnomnometr.shift();
      } else {
        sounds.eatBad?.play();
        score--;
        happiness--;
        omnomnometr = [];
      }
      foods.splice(index, 1);
    } else if (food.x < -50) {
      foods.splice(index, 1);
    }
  });

  if (Date.now() - lastHappinessStar > randomInt(20000, 30000)) {
    happinessStars.push(new HappinessStar());
    lastHappinessStar = Date.now();
  }

  happinessStars.forEach((star, index) => {
    star.update();
    if (star.collidesWith(cat)) {
      sounds.star?.play();
      happiness = Math.min(3, happiness + 1);
      happinessStars.splice(index, 1);
    } else if (star.x < -50) {
      happinessStars.splice(index, 1);
    }
  });

  if (score < 1 || happiness <= 0) {
    gameOver = true;
    sounds.gameOver?.play();
  }

  stars.forEach(s => s.update());
}

function drawStars() {
  stars.forEach(s => s.draw());
}

function drawFoods() {
  foods.forEach(f => f.draw());
}

function drawHappinessStars() {
  happinessStars.forEach(s => s.draw());
}

function gameLoop() {
  update();
  drawBackground();
  drawStars();
  drawHappinessStars();
  drawCat();
  drawFoods();
  drawUI();
  requestAnimationFrame(gameLoop);
}

loadAssets().then((assets) => {
  images = assets.images;
  sounds = assets.sounds;
  for (let i = 0; i < 50; i++) stars.push(new Star());
  initInput(canvas);
  gameLoop();
});
