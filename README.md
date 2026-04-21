# SimpleFinance

Маркетинговый сайт на Astro для проекта `SimpleFinance`.

## Коротко
- Проект: статический маркетинговый сайт на Astro
- Основные страницы: `src/pages/index.astro`, `src/pages/ecom.astro`
- Компоновка страниц: `src/components/home/HomePage.astro`, `src/components/ecom/EcomPage.astro`
- Контент для повторяющихся блоков: `src/content/*`
- Компоненты интерфейса: `src/components/*`
- Клиентская интерактивность: `src/scripts/*`
- Чистая логика и расчёты: `src/lib/*`
- Локальный запуск: `npm run dev`
- Проверка перед завершением изменений: `npm run build`

Сайт состоит из двух основных страниц:
- главная страница `src/pages/index.astro`
- страница направления ECOM `src/pages/ecom.astro`

Маршруты остаются тонкими и в основном собирают страницу из крупных компонентов:
- `src/pages/index.astro` -> `src/components/home/HomePage.astro`
- `src/pages/ecom.astro` -> `src/components/ecom/EcomPage.astro`

Проект построен как статический сайт с серверным рендерингом Astro и небольшими клиентскими улучшениями для интерактивных блоков.

## Стек
- Astro 6
- TypeScript
- SCSS
- `astro:content` для структурированного контента из JSON
- `npm` как пакетный менеджер

## Требования
- Node.js `>=22.12.0`

## Команды
Все команды запускаются из корня проекта.

```bash
npm install
npm run dev
npm run build
npm run preview
```

Дополнительно:

```bash
npm run build:pretty
npm run publish:pages
```

Что делают команды:
- `npm run dev` — локальная разработка
- `npm run build` — production-сборка в `dist/`
- `npm run preview` — локальный просмотр собранной версии
- `npm run build:pretty` — сборка и форматирование содержимого `dist/`
- `npm run publish:pages` — публикация в ветку `gh-pages`

## Структура проекта
Основные директории:

```text
src/
  assets/        Импортируемые изображения и графика
  components/    Astro-компоненты интерфейса
  content/       JSON-контент для блоков сайта
  layouts/       Базовые layout-компоненты
  lib/           Чистая логика и расчёты
  pages/         Маршруты Astro
  scripts/       Клиентские скрипты для интерактивности
  styles/        Глобальные и компонентные стили
public/          Публичные статические файлы
scripts/         Вспомогательные скрипты проекта
```

## Где что менять
Если нужно изменить тексты, карточки, FAQ, шаги, клиентов, ссылки на соцсети или статьи, в первую очередь смотрите:
- `src/content/faq`
- `src/content/home-faq`
- `src/content/home-directions`
- `src/content/home-trust-items`
- `src/content/home-stats`
- `src/content/home-facts`
- `src/content/products`
- `src/content/clients`
- `src/content/steps`
- `src/content/blog-posts`
- `src/content/social-links`
- `src/content/feature-cards`

Схемы этих данных описаны в `src/content.config.ts`. Если меняется структура JSON, нужно синхронно обновлять и схему, и компоненты, которые читают данные.

Соответствие основных коллекций и секций:
- `src/content/home-directions` -> `src/components/home/DirectionsSection.astro`
- `src/content/home-trust-items` -> `src/components/home/WhyTrustSection.astro`
- `src/content/home-stats` -> `src/components/home/CompanyStatsSection.astro`
- `src/content/home-facts` -> `src/components/home/CompanyFactsSection.astro`
- `src/content/home-faq` -> `src/components/common/FaqSection.astro` на главной
- `src/content/faq` -> `src/components/common/FaqSection.astro` на ECOM-странице
- `src/content/steps` -> `src/components/common/StepsSection.astro`

Если нужно изменить логику калькулятора, смотрите:
- `src/lib/calculator.ts`
- `src/components/ecom/CalculatorSection.astro`
- `src/scripts/ecom/calculator-section.ts`

Если нужно изменить общую оболочку сайта, смотрите:
- `src/layouts/BaseLayout.astro`
- `src/components/common/SiteShell.astro`
- `src/components/common/Header.astro`
- `src/components/common/Footer.astro`

## Архитектурные принципы
- Страницы в `src/pages` должны оставаться тонкими и собираться из компонентов.
- Повторяющийся контент лучше хранить в `src/content`, а не хардкодить в Astro-компонентах.
- Чистую бизнес-логику и формулы нужно держать в `src/lib`.
- Клиентские интерактивные сценарии нужно держать в `src/scripts`.
- Стили нужно добавлять рядом с конкретной зоной ответственности, не раздувая глобальные файлы без необходимости.

## Работа с интерактивностью
В проекте используются небольшие клиентские скрипты, которые инициализируются из Astro-компонентов через inline `<script>`.

Пример общей секции с повторным использованием логики:
- `src/components/common/StepsSection.astro`
- `src/scripts/common/steps-section.ts`

Важно:
- учитывать повторную инициализацию после `astro:after-swap`
- не привязывать логику к хрупким селекторам, если можно использовать `data-*`
- проверять наличие DOM-элементов перед работой с ними
- уважать `prefers-reduced-motion` для анимаций и reveal-эффектов

## Стили
- Базовые стили: `src/styles/reset.css`, `src/styles/global.css`
- Стили блоков и компонентов: `src/styles/components/...`

В проекте уже используется именование классов с префиксами блоков, например:
- `site-header__...`
- `calculator-section__...`

Лучше продолжать этот же стиль, чем вводить параллельную систему именования.

## Деплой
Конфигурация в `astro.config.mjs` учитывает деплой на GitHub Pages и вычисляет `site` и `base` из переменных окружения GitHub.

Скрипт `npm run publish:pages`:
- собирает проект
- копирует `dist/` во временную директорию
- создаёт временный `gh-pages` репозиторий
- пушит результат в ветку `gh-pages`

Если меняете `astro.config.mjs`, учитывайте не только локальную разработку, но и публикацию в GitHub Pages.

## Что не стоит коммитить
В репозитории не должны оказываться локальные служебные артефакты:
- `dist/`
- `.astro/`
- `node_modules/`
- `.devserver*`
- `.playwright-cli/`
- `output/`
- `package/`
- `github-pages-url.txt`
- локальные логи
- tunnel/debug-файлы
- временные служебные файлы IDE и локальных инструментов

Актуальные исключения уже описаны в `.gitignore`.

## Проверка перед коммитом
Минимум перед завершением заметных изменений:

```bash
npm run build
```

Особенно важно проверять сборку, если менялись:
- JSON-контент и `src/content.config.ts`
- маршруты и layout-компоненты
- логика калькулятора
- пути к ассетам
- `astro.config.mjs`

## Для Codex и новых разработчиков
Проект уже содержит `AGENTS.md` с краткими правилами работы по структуре, интерактивности, контенту и деплою.

Если задача связана с контентом, сначала проверьте `src/content`.
Если задача связана с поведением интерфейса, сначала проверьте соответствующий компонент в `src/components` и его скрипт в `src/scripts`.
Если задача связана с расчётами, сначала проверьте `src/lib/calculator.ts`.
