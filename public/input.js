// input.js — обработка клавиатуры и свайпов

let inputState = {
  up: false,
  down: false,
  left: false,
  right: false,
};

let touchStartX = 0;
let touchStartY = 0;
let touchEndX = 0;
let touchEndY = 0;
const swipeThreshold = 30; // минимальная дистанция для свайпа

export function initInput(canvas) {
  window.addEventListener("keydown", (e) => {
    switch (e.key) {
      case "ArrowUp":
      case "w":
        inputState.up = true;
        break;
      case "ArrowDown":
      case "s":
        inputState.down = true;
        break;
      case "ArrowLeft":
      case "a":
        inputState.left = true;
        break;
      case "ArrowRight":
      case "d":
        inputState.right = true;
        break;
    }
  });

  window.addEventListener("keyup", (e) => {
    switch (e.key) {
      case "ArrowUp":
      case "w":
        inputState.up = false;
        break;
      case "ArrowDown":
      case "s":
        inputState.down = false;
        break;
      case "ArrowLeft":
      case "a":
        inputState.left = false;
        break;
      case "ArrowRight":
      case "d":
        inputState.right = false;
        break;
    }
  });

  // Обработка касаний (свайпов)
  canvas.addEventListener("touchstart", (e) => {
    const touch = e.changedTouches[0];
    touchStartX = touch.clientX;
    touchStartY = touch.clientY;
  });

  canvas.addEventListener("touchmove", (e) => {
    e.preventDefault(); // предотвращаем прокрутку страницы при свайпе
  }, { passive: false });

  canvas.addEventListener("touchend", (e) => {
    const touch = e.changedTouches[0];
    touchEndX = touch.clientX;
    touchEndY = touch.clientY;
    handleSwipe();
  });
}

function handleSwipe() {
  const dx = touchEndX - touchStartX;
  const dy = touchEndY - touchStartY;

  // Сбрасываем состояние для свайпов, чтобы не было "залипания"
  inputState.up = false;
  inputState.down = false;
  inputState.left = false;
  inputState.right = false;

  if (Math.abs(dx) > Math.abs(dy)) {
    // Горизонтальный свайп
    if (dx > swipeThreshold) {
      inputState.right = true;
    } else if (dx < -swipeThreshold) {
      inputState.left = true;
    }
  } else {
    // Вертикальный свайп
    if (dy > swipeThreshold) {
      inputState.down = true;
    } else if (dy < -swipeThreshold) {
      inputState.up = true;
    }
  }

  // Состояние свайпа держим очень коротко (можно сбросить через 100 мс)
  setTimeout(() => {
    inputState.up = false;
    inputState.down = false;
    inputState.left = false;
    inputState.right = false;
  }, 100);
}

export function getInputState() {
  return inputState;
}
