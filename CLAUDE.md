# CLAUDE.md — Инструкции для Claude Code

## Контекст

Этот проект — React + Vite дашборд для анализа фьючерсов на медь (HG1!). Цель — задеплоить его на GitHub Pages с автоматическим обновлением при каждом push.

Пользователь хочет сделать всё с минимальным участием. Действуй автономно, спрашивай только когда абсолютно необходимо (логин в GitHub, имя репозитория).

## Стек

- **Frontend:** React 18 + Vite 5
- **Charts:** Recharts 2.12
- **Hosting:** GitHub Pages
- **Auto-deploy:** GitHub Actions (workflow уже готов в `.github/workflows/deploy.yml`)

## Что нужно сделать (по порядку)

### Шаг 1. Проверка окружения

```bash
node --version    # должно быть >= 18
npm --version
git --version
gh --version      # GitHub CLI; если нет — установи через brew/apt
```

Если `gh` не установлен:
- **macOS:** `brew install gh`
- **Linux (Ubuntu/Debian):** `sudo apt install gh` или см. https://github.com/cli/cli/blob/trunk/docs/install_linux.md
- **Windows:** `winget install --id GitHub.cli`

### Шаг 2. Установка зависимостей и локальная проверка

```bash
npm install
npm run dev
```

Должен открыться `http://localhost:5173/copper-dashboard/`. Убедись что дашборд рендерится. После проверки — `Ctrl+C`.

### Шаг 3. Аутентификация в GitHub

```bash
gh auth status     # проверить, есть ли уже логин
gh auth login      # если нет — войти (выбрать HTTPS + браузер)
```

**Это единственное действие, требующее участия пользователя** — открыть браузер и подтвердить логин.

### Шаг 4. Создание репозитория и первый push

```bash
git init
git add .
git commit -m "Initial commit: copper futures dashboard"
git branch -M main

# Создание repo на GitHub и push одной командой
gh repo create copper-dashboard --public --source=. --remote=origin --push
```

Если пользователь хочет другое имя репозитория — **обязательно** обнови `base` в `vite.config.js`:

```js
base: '/НОВОЕ-ИМЯ/',
```

### Шаг 5. Включение GitHub Pages

```bash
# Через API одной командой (не нужно лезть в браузер)
gh api -X POST "repos/{owner}/{repo}/pages" \
  -f "build_type=workflow" \
  --silent 2>/dev/null || \
  gh api -X PUT "repos/{owner}/{repo}/pages" \
  -f "build_type=workflow"
```

Если команда выше выдаёт ошибку — открой `https://github.com/USERNAME/copper-dashboard/settings/pages` и в разделе "Source" выбери **GitHub Actions**.

### Шаг 6. Запуск workflow

После push workflow стартует автоматически. Проверь статус:

```bash
gh run list --limit 1
gh run watch    # следить за прогрессом в реальном времени
```

Через ~1–2 минуты сайт будет доступен по адресу:

```
https://USERNAME.github.io/copper-dashboard/
```

Узнать точный URL:

```bash
gh api "repos/{owner}/{repo}/pages" --jq '.html_url'
```

## Как пользователь будет обновлять дашборд

После начальной настройки, для любого изменения:

```bash
# Редактируешь src/App.jsx
git add .
git commit -m "Update: описание изменения"
git push
```

Через ~1 минуту изменения автоматически появятся на сайте.

## Troubleshooting

### Build падает с "Cannot find package 'recharts'"
```bash
npm install recharts
```

### Сайт открывается, но пустой / 404 на ассеты
Проверь `base` в `vite.config.js` — должен совпадать с именем репозитория.

### Workflow не запускается
В Settings → Actions → General → Workflow permissions выбрать **Read and write permissions**.

### GitHub Pages не активируется через API
Сделать вручную: Settings → Pages → Source: **GitHub Actions**.

## Стиль работы

- Действуй последовательно — выполни шаг, покажи результат, переходи к следующему
- Не спрашивай разрешения на чтение файлов и проверочные команды (`ls`, `cat`, `gh auth status`)
- **Спрашивай** перед: `git push`, созданием публичного репозитория, изменением имени репозитория
- Если что-то падает — попробуй автоматически починить (например, `npm install` при отсутствии модуля), потом сообщи

## Конечный результат

Пользователь должен получить:
1. ✅ Локально работающий проект (`npm run dev`)
2. ✅ Публичный URL дашборда на GitHub Pages
3. ✅ Возможность обновления через `git push`
