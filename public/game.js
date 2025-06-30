// ===== ГЛОБАЛЬНЫЕ ПЕРЕМЕННЫЕ =====
console.log("game.js started");
window.gameJsReady = true;

const canvas = document.getElementById('gameCanvas');
const ctx = canvas.getContext('2d');
const menuScreen = document.getElementById('menu');
const gameOverScreen = document.getElementById('game-over');
const startButton = document.getElementById('startButton');
const restartButton = document.getElementById('restartButton');
const finalScoreElement = document.getElementById('final-score');

// ===== КОНФИГУРАЦИЯ =====
const CONFIG = {
    width: 800,
    height: 600,
    catSpeed: 5,
    foodSpawnRate: 0.02,
    starCount: 50
};

// ===== ЗАГРУЗЧИК РЕСУРСОВ =====
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

// ===== КЛАССЫ ИГРЫ =====
class Cat {
    constructor(frames) {
        this.frames = frames;
        this.width = 100;
        this.height = 64;
        this.x = 50;
        this.y = canvas.height / 2 - this.height / 2;
        this.speed = CONFIG.catSpeed;
        this.frameIndex = 0;
        this.frameCount = 0;
    }
    
    update() {
        this.frameCount = (this.frameCount + 1) % 10;
        if (this.frameCount === 0) {
            this.frameIndex = (this.frameIndex + 1) % this.frames.length;
        }
    }
    
    draw() {
        ctx.drawImage(this.frames[this.frameIndex], this.x, this.y, this.width, this.height);
    }
}

class Food {
    constructor(type, assets) {
        this.type = type;
        this.size = 48;
        this.x = canvas.width;
        this.y = Math.random() * (canvas.height - 100) + 50;
        this.speed = 4 + score * 0.1;
        this.image = type === 'good' 
            ? assets.goodFood[Math.floor(Math.random() * assets.goodFood.length)]
            : assets.badFood[Math.floor(Math.random() * assets.badFood.length)];
    }
    
    update() {
        this.x -= this.speed;
    }
    
    draw() {
        ctx.drawImage(this.image, this.x, this.y, this.size, this.size);
    }
}

// ===== ВСПОМОГАТЕЛЬНЫЕ ФУНКЦИИ =====
function checkCollision(obj1, obj2) {
    return (
        obj1.x < obj2.x + obj2.size &&
        obj1.x + obj1.width > obj2.x &&
        obj1.y < obj2.y + obj2.size &&
        obj1.y + obj1.height > obj2.y
    );
}

// ===== ИНИЦИАЛИЗАЦИЯ =====
function setup() {
    // Настройка canvas
    canvas.width = CONFIG.width;
    canvas.height = CONFIG.height;
    
    // Обработчики событий
    startButton.addEventListener('click', startGame);
    restartButton.addEventListener('click', startGame);
    
    // Сенсорное управление
    canvas.addEventListener('touchstart', handleTouchStart);
    canvas.addEventListener('touchmove', handleTouchMove);
    
    // Загрузка ресурсов
    initGame().then(() => console.log("Ready!"));
    
    // Показать меню
    menuScreen.classList.add('visible');
}

// Запуск при полной загрузке
if (document.readyState === 'complete') {
    setup();
} else {
    window.addEventListener('load', setup);
}