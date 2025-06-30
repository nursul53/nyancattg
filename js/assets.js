// assets.js
export async function loadAssets() {
  const loadImage = (src) =>
    new Promise((resolve, reject) => {
      const img = new Image();
      img.src = src;
      img.onload = () => resolve(img);
      img.onerror = reject;
    });

  const loadAudio = (src) =>
    new Promise((resolve, reject) => {
      const audio = new Audio();
      audio.src = src;
      audio.oncanplaythrough = () => resolve(audio);
      audio.onerror = reject;
    });

  // Загружаем массив кадров для кота (пример)
  const catFrames = await Promise.all([
    loadImage('/images/cat1.png'),
    loadImage('/images/cat2.png'),
    loadImage('/images/cat3.png'),
    loadImage('/images/cat4.png'),
  ]);

  // Загружаем хорошие и плохие "еды"
  const goodFoods = await Promise.all([
    loadImage('/images/good1.png'),
    loadImage('/images/good2.png'),
  ]);

  const badFoods = await Promise.all([
    loadImage('/images/bad1.png'),
    loadImage('/images/bad2.png'),
  ]);

  // Звуки (опционально)
  const sounds = {
    eatGood: await loadAudio('/sounds/eatGood.mp3'),
    eatBad: await loadAudio('/sounds/eatBad.mp3'),
    star: await loadAudio('/sounds/star.mp3'),
    gameOver: await loadAudio('/sounds/gameOver.mp3'),
  };

  return {
    images: {
      cat: catFrames,
      good: goodFoods,
      bad: badFoods,
    },
    sounds,
  };
}
