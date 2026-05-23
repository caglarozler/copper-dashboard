# Copper Futures Dashboard

Аналитический дашборд по фьючерсам на медь (HG1!) — цены, уровни, сценарии входа, соотношения с золотом и серебром.

## 🚀 Быстрый старт через Claude Code

1. **Распакуй архив** в удобную папку (например, `~/projects/copper-dashboard`)
2. **Открой папку в терминале:**
   ```bash
   cd ~/projects/copper-dashboard
   ```
3. **Запусти Claude Code:**
   ```bash
   claude
   ```
4. **Скажи Claude:**
   > Прочитай CLAUDE.md и выполни все шаги. Используй имя репозитория `copper-dashboard`. Деплой на GitHub Pages.

Claude Code сделает всё сам. Тебе нужно будет один раз залогиниться в GitHub через браузер (Claude подскажет когда).

## 📦 Структура

```
copper-dashboard/
├── src/
│   ├── App.jsx          ← главный компонент (правь его для обновлений)
│   ├── main.jsx
│   └── index.css
├── .github/workflows/
│   └── deploy.yml       ← авто-деплой при push
├── index.html
├── package.json
├── vite.config.js
├── CLAUDE.md            ← инструкции для Claude Code
└── README.md
```

## 🔄 Как обновлять дашборд

После начальной настройки:

1. Открой `src/App.jsx` и правь данные (цены, уровни, прогнозы)
2. Сохрани изменения
3. В терминале:
   ```bash
   git add .
   git commit -m "Update copper levels"
   git push
   ```
4. Через ~1 минуту обновлённый дашборд появится на сайте

## 🛠 Локальная разработка

```bash
npm install
npm run dev      # http://localhost:5173/copper-dashboard/
```

## 📍 Где лежат данные для обновления

Все ключевые переменные в `src/App.jsx` в самом верху файла:

- `priceData` — недельная история цен меди
- `rawRatio` — данные по золоту и серебру для ratio-графиков
- `levels` — уровни поддержки/сопротивления
- `scenarios` — сценарии входа в лонг (entry, stop, take-profit)
- `fundamentals` — фундаментальные факторы

Меняешь только цифры — структура остаётся.
