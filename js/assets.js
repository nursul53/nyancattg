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
    loadImage('assest/images/cat/0.png'),
    loadImage('assets/images/cat/1.png'),
    loadImage('assets/images/cat/2.png'),
    loadImage('assets/images/cat/3.png'),
  ]);

  // Загружаем хорошие и плохие "еды"
  const goodFoods = await Promise.all([
    loadImage('assets/images/good1.png'),
    loadImage('assets/images/good2.png'),
  ]);

  const badFoods = await Promise.all([
    loadImage('assets/images/bad1.png'),
    loadImage('assets/images/bad2.png'),
  ]);

  // Звуки (опционально)
  const sounds = {
    eatGood: await loadAudio('assets/sounds/eatGood.mp3'),
    eatBad: await loadAudio('assets/sounds/eatBad.mp3'),
    star: await loadAudio('assets/sounds/star.mp3'),
    gameOver: await loadAudio('assets/sounds/gameOver.mp3'),
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
