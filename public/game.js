// Инициализация Telegram WebApp
console.log("game.js loaded");
console.log("startGame function exists:", typeof startGame === 'function');
console.log("Проверка доступности изображений:");
['/assets/images/cat/0.png', '/assets/images/good/burger.png'].forEach(url => {
    fetch(url).then(r => 
        console.log(url, r.ok ? '✅ Доступно' : '❌ Не найдено')
    );
});
const tg = window.Telegram.WebApp;
tg.expand(); // Разворачиваем на весь экран

// Получаем элементы DOM
const canvas = document.getElementById('gameCanvas');
const ctx = canvas.getContext('2d');
const menuScreen = document.getElementById('menu');
const gameOverScreen = document.getElementById('game-over');
const startButton = document.getElementById('startButton');
const restartButton = document.getElementById('restartButton');
const finalScoreElement = document.getElementById('final-score');

// Настройка размеров canvas
function resizeCanvas() {
    canvas.width = window.innerWidth;
    canvas.height = window.innerHeight;
}

window.addEventListener('resize', resizeCanvas);
resizeCanvas();

// Игровые переменные
let score = 10;
let happiness = 3;
let gameRunning = false;
let animationFrameId;

// Загрузчик изображений
class ResourceLoader {
    static baseUrl = window.location.origin;
    
    static async loadAll() {
        try {
            const [catFrames, goodFood, badFood] = await Promise.all([
                this.loadCatFrames(),
                this.loadFood('good'),
                this.loadFood('bad')
            ]);
            
            return { catFrames, goodFood, badFood };
        } catch (e) {
            console.error("Resource loading failed:", e);
            return this.createFallbackAssets();
        }
    }
    
    static async loadCatFrames() {
        const frames = [];
        for (let i = 0; i < 5; i++) {
            frames.push(await this.loadImage(`/assets/images/cat/${i}.png`, 100, 64, 'pink'));
        }
        return frames;
    }
    
    static async loadFood(type) {
        const items = type === 'good' 
            ? ['burger', 'fish', 'milk'] 
            : ['lemon', 'onion', 'pepper'];
            
        return Promise.all(
            items.map(name => 
                this.loadImage(`/assets/images/${type}/${name}.png`, 48, 48, type === 'good' ? 'green' : 'red')
            )
        );
    }
    
    static loadImage(src, width, height, fallbackColor) {
        return new Promise(resolve => {
            const img = new Image();
            img.src = this.baseUrl + src;
            img.onload = () => resolve(img);
            img.onerror = () => {
                console.warn(`Using fallback for ${src}`);
                resolve(this.createFallbackImage(width, height, fallbackColor));
            };
        });
    }
    
    static createFallbackImage(width, height, color) {
        const canvas = document.createElement('canvas');
        canvas.width = width;
        canvas.height = height;
        const ctx = canvas.getContext('2d');
        ctx.fillStyle = color;
        ctx.fillRect(0, 0, width, height);
        return canvas;
    }
    
    static createFallbackAssets() {
        return {
            catFrames: Array(5).fill().map(() => this.createFallbackImage(100, 64, 'pink')),
            goodFood: Array(3).fill().map(() => this.createFallbackImage(48, 48, 'green')),
            badFood: Array(3).fill().map(() => this.createFallbackImage(48, 48, 'red'))
        };
    }
}

// ===== ОСНОВНОЙ КОД ИГРЫ =====
let assets, cat, foods = [], stars = [], happinessStars = [];
let score = 10, happiness = 3, gameRunning = false, animationFrameId;

async function initGame() {
    try {
        // Загрузка ресурсов
        assets = await ResourceLoader.loadAll();
        console.log("Assets loaded:", assets);
        
        // Инициализация объектов
        cat = new Cat(assets.catFrames);
        stars = Array.from({length: CONFIG.starCount}, () => ({
            x: Math.random() * canvas.width,
            y: Math.random() * canvas.height,
            speed: 1 + Math.random() * 4,
            size: 1 + Math.random() * 2
        }));
        
        console.log("Game initialized");
    } catch (e) {
        console.error("Init error:", e);
    }
}

function startGame() {
    if (gameRunning) return;
    
    menuScreen.classList.remove('visible');
    gameOverScreen.classList.remove('visible');
    gameRunning = true;
    
    if (!assets) {
        console.warn("Assets not loaded, retrying...");
        initGame().then(gameLoop);
    } else {
        gameLoop();
    }
}

function gameLoop() {
    if (!gameRunning) return;
    
    try {
        // Очистка экрана
        ctx.fillStyle = '#0a0a28';
        ctx.fillRect(0, 0, canvas.width, canvas.height);
        
        // Отрисовка звезд фона
        ctx.fillStyle = '#ffffff';
        stars.forEach(star => {
            star.x -= star.speed;
            if (star.x < 0) star.x = canvas.width;
            ctx.beginPath();
            ctx.arc(star.x, star.y, star.size, 0, Math.PI * 2);
            ctx.fill();
        });
        
        // Обновление и отрисовка кота
        cat.update();
        cat.draw();
        
        // Генерация и отрисовка еды
        if (Math.random() < CONFIG.foodSpawnRate) {
            foods.push(new Food(
                Math.random() > 0.2 ? 'good' : 'bad',
                assets
            ));
        }
        
        foods.forEach((food, index) => {
            food.update();
            food.draw();
            
            if (checkCollision(cat, food)) {
                if (food.type === 'good') {
                    score += 1;
                } else {
                    score -= 1;
                    happiness -= 1;
                }
                foods.splice(index, 1);
            }
            
            if (food.x < -food.size) {
                foods.splice(index, 1);
            }
        });
        
        // Отрисовка интерфейса
        ctx.fillStyle = '#ffffff';
        ctx.font = '24px Arial';
        ctx.fillText(`Счет: ${score}`, 20, 40);
        ctx.fillText(`Счастье: ${happiness}`, 20, 80);
        
        // Проверка конца игры
        if (score <= 0 || happiness <= 0) {
            endGame();
            return;
        }
        
        animationFrameId = requestAnimationFrame(gameLoop);
    } catch (e) {
        console.error("Game loop error:", e);
        endGame();
    }
}

function endGame() {
    gameRunning = false;
    cancelAnimationFrame(animationFrameId);
    finalScoreElement.textContent = `Счет: ${score}`;
    gameOverScreen.classList.add('visible');
    
    if (window.tg?.sendData) {
        tg.sendData(JSON.stringify({ score }));
    }
}
// Класс кота
class Cat {
    constructor(frames) {
        this.width = 100;
        this.height = 64;
        this.x = 50;
        this.y = canvas.height / 2 - this.height / 2;
        this.speed = 5;
        this.frameIndex = 0;
        this.frameCount = 0;
        this.frameSpeed = 5;
        this.frames = frames;
    }

    update() {
        // Анимация
        this.frameCount++;
        if (this.frameCount >= this.frameSpeed) {
            this.frameCount = 0;
            this.frameIndex = (this.frameIndex + 1) % this.frames.length;
        }
    }

    draw() {
        ctx.drawImage(this.frames[this.frameIndex], this.x, this.y, this.width, this.height);
    }

    getRect() {
        return {
            x: this.x,
            y: this.y,
            width: this.width,
            height: this.height
        };
    }
}

// Класс еды
class Food {
    constructor(goodFoods, badFoods) {
        this.size = 48;
        this.x = canvas.width;
        this.y = Math.random() * (canvas.height - 100) + 50;
        this.speed = 4 + score * 0.1;
        this.type = Math.random() > 0.2 ? 'good' : 'bad';
        
        if (this.type === 'good' && goodFoods.length > 0) {
            this.image = goodFoods[Math.floor(Math.random() * goodFoods.length)];
        } else if (badFoods.length > 0) {
            this.image = badFoods[Math.floor(Math.random() * badFoods.length)];
        } else {
            // Запасной вариант
            const canvas = document.createElement('canvas');
            canvas.width = this.size;
            canvas.height = this.size;
            const ctx = canvas.getContext('2d');
            ctx.fillStyle = this.type === 'good' ? 'green' : 'red';
            ctx.fillRect(0, 0, this.size, this.size);
            this.image = canvas;
        }
    }

    update() {
        this.x -= this.speed;
    }

    draw() {
        ctx.drawImage(this.image, this.x, this.y, this.size, this.size);
    }

    getRect() {
        return {
            x: this.x,
            y: this.y,
            width: this.size,
            height: this.size
        };
    }
}

// Класс звезд счастья
class HappinessStar {
    constructor() {
        this.size = 15;
        this.x = canvas.width;
        this.y = Math.random() * (canvas.height - 100) + 50;
        this.speed = 7;
    }

    update() {
        this.x -= this.speed;
    }

    draw() {
        ctx.fillStyle = '#ffff00';
        ctx.beginPath();
        ctx.arc(this.x + this.size/2, this.y + this.size/2, this.size, 0, Math.PI * 2);
        ctx.fill();
    }

    getRect() {
        return {
            x: this.x,
            y: this.y,
            width: this.size,
            height: this.size
        };
    }
}

// Функция проверки столкновений
function checkCollision(rect1, rect2) {
    return (
        rect1.x < rect2.x + rect2.width &&
        rect1.x + rect1.width > rect2.x &&
        rect1.y < rect2.y + rect2.height &&
        rect1.y + rect1.height > rect2.y
    );
}

// Инициализация игры
let assets, cat, foods, stars, happinessStars, lastHappinessStarTime;

async function initGame() {
    // Загрузка ресурсов
    assets = await AssetLoader.load();
    
    cat = new Cat(assets.catFrames);
    foods = [];
    stars = [];
    happinessStars = [];
    score = 10;
    happiness = 3;
    lastHappinessStarTime = Date.now();
    
    // Создаем звезды фона
    for (let i = 0; i < 50; i++) {
        stars.push({
            x: Math.random() * canvas.width,
            y: Math.random() * canvas.height,
            speed: 1 + Math.random() * 4,
            size: 1 + Math.random() * 2
        });
    }
}

// Игровой цикл
function gameLoop() {
    if (!gameRunning) return;
    
    // Очистка экрана
    ctx.fillStyle = '#0a0a28';
    ctx.fillRect(0, 0, canvas.width, canvas.height);
    
    // Отрисовка фоновых звезд
    ctx.fillStyle = '#ffffff';
    stars.forEach(star => {
        star.x -= star.speed;
        if (star.x < 0) {
            star.x = canvas.width;
            star.y = Math.random() * canvas.height;
        }
        ctx.beginPath();
        ctx.arc(star.x, star.y, star.size, 0, Math.PI * 2);
        ctx.fill();
    });
    
    // Обновление и отрисовка кота
    cat.update();
    cat.draw();
    
    // Генерация еды
    if (Math.random() < 0.02) {
        foods.push(new Food(assets.goodFood, assets.badFood));
    }
    
    // Обновление и отрисовка еды
    foods.forEach((food, index) => {
        food.update();
        food.draw();
        
        // Проверка столкновений с котом
        if (checkCollision(cat.getRect(), food.getRect())) {
            if (food.type === 'good') {
                score += 1;
            } else {
                score -= 1;
                happiness -= 1;
            }
            foods.splice(index, 1);
        }
        
        // Удаление еды за пределами экрана
        if (food.x < -food.size) {
            foods.splice(index, 1);
        }
    });
    
    // Генерация звезд счастья
    if (Date.now() - lastHappinessStarTime > 20000 && Math.random() < 0.01) {
        happinessStars.push(new HappinessStar());
        lastHappinessStarTime = Date.now();
    }
    
    // Обновление и отрисовка звезд счастья
    happinessStars.forEach((star, index) => {
        star.update();
        star.draw();
        
        // Проверка столкновений с котом
        if (checkCollision(cat.getRect(), star.getRect())) {
            happiness = Math.min(3, happiness + 1);
            happinessStars.splice(index, 1);
        }
        
        // Удаление звезд за пределами экрана
        if (star.x < -star.size) {
            happinessStars.splice(index, 1);
        }
    });
    
    // Отрисовка интерфейса
    ctx.fillStyle = '#ffffff';
    ctx.font = '24px Arial';
    ctx.fillText(`Счет: ${score}`, 20, 40);
    ctx.fillText(`Счастье: ${happiness}`, 20, 80);
    
    // Проверка условий окончания игры
    if (score <= 0 || happiness <= 0) {
        endGame();
        return;
    }
    
    animationFrameId = requestAnimationFrame(gameLoop);
}

function startGame() {
    menuScreen.classList.remove('visible');
    gameOverScreen.classList.remove('visible');
    initGame();
    gameRunning = true;
    gameLoop();
}
function endGame() {
    gameRunning = false;
    cancelAnimationFrame(animationFrameId);
    finalScoreElement.textContent = `Счет: ${score}`;
    gameOverScreen.classList.add('visible');
    
    // Можно отправить результат в Telegram
    if (tg.initDataUnsafe?.user?.id) {
        tg.sendData(JSON.stringify({ score: score }));
    }
}

// Обработчики событий
startButton.addEventListener('click', startGame);
restartButton.addEventListener('click', startGame);

// Управление с клавиатуры (для тестирования)
window.addEventListener('keydown', (e) => {
    if (!gameRunning) return;
    
    const speed = cat.speed;
    switch(e.key) {
        case 'ArrowUp':
        case 'w':
            cat.y = Math.max(0, cat.y - speed);
            break;
        case 'ArrowDown':
        case 's':
            cat.y = Math.min(canvas.height - cat.height, cat.y + speed);
            break;
        case 'ArrowLeft':
        case 'a':
            cat.x = Math.max(0, cat.x - speed);
            break;
        case 'ArrowRight':
        case 'd':
            cat.x = Math.min(canvas.width - cat.width, cat.x + speed);
            break;
    }
});

// Сенсорное управление для мобильных устройств
let touchStartX = 0;
let touchStartY = 0;

canvas.addEventListener('touchstart', (e) => {
    if (!gameRunning) return;
    e.preventDefault();
    const touch = e.touches[0];
    touchStartX = touch.clientX;
    touchStartY = touch.clientY;
});

canvas.addEventListener('touchmove', (e) => {
    if (!gameRunning) return;
    e.preventDefault();
    const touch = e.touches[0];
    const deltaX = touch.clientX - touchStartX;
    const deltaY = touch.clientY - touchStartY;
    
    cat.x = Math.max(0, Math.min(canvas.width - cat.width, cat.x + deltaX));
    cat.y = Math.max(0, Math.min(canvas.height - cat.height, cat.y + deltaY));
    
    touchStartX = touch.clientX;
    touchStartY = touch.clientY;
});

// Показываем меню при загрузкеsss
menuScreen.classList.add('visible');