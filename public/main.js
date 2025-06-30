// ===== ОСНОВНОЙ КОД ИГРЫ =====
const canvas = document.getElementById('gameCanvas');
const ctx = canvas.getContext('2d');

// Настройки игры
const config = {
  width: 800,
  height: 600,
  catSpeed: 5
};

// Размеры canvas
canvas.width = config.width;
canvas.height = config.height;

// ===== КЛАСС КОТА =====
class Cat {
  constructor() {
    this.width = 100;
    this.height = 64;
    this.x = 50;
    this.y = canvas.height / 2 - this.height / 2;
    this.speed = config.catSpeed;
    this.image = new Image();
    this.image.src = 'assets/images/cat/0.png'; // Основной кадр кота
  }

  draw() {
    ctx.drawImage(this.image, this.x, this.y, this.width, this.height);
  }

  update(keys) {
    if (keys.ArrowUp || keys.w) this.y -= this.speed;
    if (keys.ArrowDown || keys.s) this.y += this.speed;
    if (keys.ArrowLeft || keys.a) this.x -= this.speed;
    if (keys.ArrowRight || keys.d) this.x += this.speed;
    
    // Границы экрана
    this.x = Math.max(0, Math.min(canvas.width - this.width, this.x));
    this.y = Math.max(0, Math.min(canvas.height - this.height, this.y));
  }
}

// ===== КЛАСС ЕДЫ =====
class Food {
  constructor(type) {
    this.size = 48;
    this.x = canvas.width;
    this.y = Math.random() * (canvas.height - 100) + 50;
    this.speed = 3;
    this.type = type; // 'good' или 'bad'
    this.image = new Image();
    this.image.src = type === 'good' 
      ? 'assets/images/good/burger.png' 
      : 'assets/images/bad/lemon.png';
  }

  draw() {
    ctx.drawImage(this.image, this.x, this.y, this.size, this.size);
  }

  update() {
    this.x -= this.speed;
  }
}

// ===== ОСНОВНАЯ ЛОГИКА ИГРЫ =====
let cat = new Cat();
let foods = [];
let score = 0;
let keys = {};

// Обработчики событий
window.addEventListener('keydown', (e) => keys[e.key] = true);
window.addEventListener('keyup', (e) => keys[e.key] = false);

// Генерация еды
function spawnFood() {
  const type = Math.random() > 0.3 ? 'good' : 'bad';
  foods.push(new Food(type));
}

// Проверка столкновений
function checkCollisions() {
  foods.forEach((food, index) => {
    if (
      cat.x < food.x + food.size &&
      cat.x + cat.width > food.x &&
      cat.y < food.y + food.size &&
      cat.y + cat.height > food.y
    ) {
      score += food.type === 'good' ? 1 : -1;
      foods.splice(index, 1);
    }
  });
}

// Игровой цикл
function gameLoop() {
  // Очистка экрана
  ctx.fillStyle = '#0a0a28';
  ctx.fillRect(0, 0, canvas.width, canvas.height);
  
  // Обновление и отрисовка
  cat.update(keys);
  cat.draw();
  
  // Еда
  if (Math.random() < 0.02) spawnFood();
  foods.forEach(food => {
    food.update();
    food.draw();
  });
  
  checkCollisions();
  
  // Интерфейс
  ctx.fillStyle = 'white';
  ctx.font = '24px Arial';
  ctx.fillText(`Счет: ${score}`, 20, 30);
  
  requestAnimationFrame(gameLoop);
}

// Запуск игры
gameLoop();