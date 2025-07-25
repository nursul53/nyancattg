# Nyan Cat Telegram Mini App

Игра Nyan Cat адаптированная для Telegram Mini Apps.

## Установка

1. Клонируйте репозиторий:
```bash
git clone https://github.com/yourusername/nyan-cat-telegram.git
cd nyan-cat-telegram
```

2. Установите зависимости:
```bash
npm install
```

3. Запустите сервер для разработки:
```bash
npm run dev
```

## Развертывание

1. Установите Vercel CLI:
```bash
npm install -g vercel
```

2. Выполните деплой:
```bash
vercel
```

## Настройка Telegram бота

1. Создайте бота через @BotFather
2. Настройте Web App:
```
/setinline - выбрать бота
/setmenubutton - добавить кнопку меню
```
3. Укажите URL вашего развернутого приложения

## Структура проекта

- `public/index.html` - Главная HTML страница
- `public/game.js` - Логика игры
- `public/style.css` - Стили
- `public/assets/` - Ресурсы (изображения, звуки)
- `index.js` - Сервер Node.js
- `now.json` - Конфигурация для Vercel
- `package.json` - Зависимости и скрипты

## Лицензия

MIT#   n y a n c a t t g  
 