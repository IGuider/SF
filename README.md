# SimpleFinance

Маркетинговый сайт SimpleFinance на Astro. Проект собирается как статический сайт, хранит повторяющийся контент в JSON-коллекциях `astro:content` и добавляет интерактивность небольшими клиентскими скриптами без отдельного клиентского фреймворка.

## Коротко

- Стек: Astro 6, TypeScript, SCSS, `astro:content`, npm.
- Node.js: `>=22.12.0`, как указано в `package.json`.
- Основные маршруты живут в `src/pages`, а страницы собираются из Astro-компонентов в `src/components`.
- Общая оболочка страниц: `src/components/common/SiteShell.astro` поверх `src/layouts/BaseLayout.astro`.
- Структурированный контент: JSON-файлы в `src/content`, схемы в `src/content.config.ts`.
- Чистая логика и форматирование: `src/lib`.
- Клиентские сценарии: `src/scripts`.
- Минимальная проверка для UI/контентных изменений: `npm run build`.
- Комплексная проверка перед завершением заметных изменений: `npm run check`.

## Команды

Все команды запускаются из корня проекта.

```bash
npm install
npm run dev
npm run build
npm run build:pretty
npm run preview
npm run test
npm run check
npm run format
npm run publish:pages
```

Что важно:

- `npm run dev` запускает локальный Astro dev server.
- `npm run build` собирает production-версию в `dist/`.
- `npm run build:pretty` собирает сайт и форматирует `dist/` через Prettier.
- `npm run preview` показывает собранную версию.
- `npm run test` запускает `node --test tests/*.test.*`.
- `npm run check` запускает тесты и production-сборку.
- `npm run format` форматирует проект через Prettier.
- `npm run publish:pages` публикует собранный `dist/` в ветку `gh-pages`.

## Структура

```text
src/
  assets/        Импортируемые изображения, SVG и PDF для сборки
  components/    Astro-компоненты страниц, секций и UI
  content/       JSON-коллекции для повторяющегося контента
  layouts/       Базовые layout-компоненты
  lib/           Чистая логика, расчеты, форматирование и helpers
  pages/         Astro-маршруты
  scripts/       Клиентские TypeScript-инициализаторы
  styles/        Глобальные стили и SCSS по компонентам
public/          Статические файлы, отдаваемые как есть
scripts/         Служебные Node.js-скрипты проекта
tests/           Node test suites для контента и расчетов
```

Компоненты сгруппированы по зонам:

- `src/components/common` - общие секции, оболочка сайта, header/footer, формы, документы, контакты.
- `src/components/ui` - небольшие переиспользуемые UI-примитивы.
- `src/components/home` - главная страница.
- `src/components/ecom` - направление для маркетплейсов.
- `src/components/goszakaz` - направление госзакупок.
- `src/components/bg` - банковские гарантии.
- `src/components/tender-loan` - тендерный заем.
- `src/components/blog` - блог, список статей и страница статьи.

## Маршруты

Маршруты должны оставаться тонкими: они задают мета-данные, подключают `SiteShell` и передают управление page-компоненту.

```text
/                  src/pages/index.astro             -> src/components/home/HomePage.astro
/ecom/             src/pages/ecom.astro              -> src/components/ecom/EcomPage.astro
/goszakaz/         src/pages/goszakaz.astro          -> src/components/goszakaz/GoszakazPage.astro
/bg/               src/pages/bg.astro                -> src/components/bg/BgPage.astro
/tendernyy-zaem/   src/pages/tendernyy-zaem.astro    -> src/components/tender-loan/TenderLoanPage.astro
/blog/             src/pages/blog.astro              -> src/components/blog/BlogIndexPage.astro
/blog/[slug]/      src/pages/blog/[slug].astro       -> src/components/blog/BlogArticlePage.astro
/contacts/         src/pages/contacts.astro          -> src/components/common/ContactsPage.astro
/documents/        src/pages/documents.astro         -> src/components/common/DocumentsPage.astro
/privacy/          src/pages/privacy.astro           -> src/components/common/PrivacyPage.astro
/requisites/       src/pages/requisites.astro        -> src/components/common/RequisitesPage.astro
/vkl/              src/pages/vkl.astro               -> src/components/common/VklPage.astro
/404.html          src/pages/404.astro               -> src/components/common/NotFoundPage.astro
```

`SiteShell` добавляет общую страницу:

- `BaseLayout` с `ClientRouter`, favicon, meta description, `reset.css` и `global.css`.
- `Header` с навигацией и социальными ссылками.
- Основной слот страницы.
- `ConsultationDialog`, `Footer`, `ScrollToTop`, `UxEnhancements`.

## Контент

Контентные коллекции описаны в `src/content.config.ts` и загружаются из JSON-файлов в `src/content`. Порядок элементов задается полем `order`, а не именем файла.

Основные коллекции:

- Общие: `steps`, `blog-posts`, `social-links`, `footer-links`, `turnover-options`.
- Главная: `home-directions`, `home-trust-items`, `home-stats`, `home-facts`, `home-faq`.
- ECOM: `feature-cards`, `products`, `clients`, `faq`.
- Госзаказ: `goszakaz-hero-badges`, `goszakaz-support-items`, `goszakaz-financing-tabs`, `goszakaz-why-items`, `goszakaz-useful-articles`, `goszakaz-faq`.
- Банковские гарантии: `bg-feature-cards`, `bg-financing-items`, `bg-faq`.
- Тендерный заем: `tender-loan-faq`.

Если нужно изменить карточки, FAQ, шаги, статьи, клиентов, социальные ссылки или футер, сначала ищите JSON в `src/content`. Не дублируйте эти данные прямо в компонентах.

Если меняется структура JSON:

- обновите схему в `src/content.config.ts`;
- обновите компоненты, которые читают эту коллекцию;
- проверьте сборку через `npm run build`;
- для более широкой проверки запустите `npm run check`.

## Страницы и секции

Основная композиция:

- `HomePage.astro`: `HeroSection`, направления, доверие, миссия, факты, статистика, шаги, лид-форма, блог, FAQ.
- `EcomPage.astro`: hero, преимущества, калькулятор, продукты, клиентские кейсы, шаги, блог, FAQ.
- `GoszakazPage.astro`: hero с бейджами из контента, поддержка закупок, вкладки финансирования, блок доверия, менеджер, полезные статьи, лид-форма, FAQ.
- `BgPage.astro`: hero, карточки преимуществ, виды гарантий, блок доверия, шаги, партнеры, менеджер, FAQ, консультационная форма.
- `TenderLoanPage.astro`: hero, описание продукта, кому нужен заем, участие, шаги, FAQ, лид-форма.
- `BlogIndexPage.astro`: список статей с фильтрами по направлению, категориям и поиску.
- `BlogArticlePage.astro`: статья из JSON-блоков, оглавление, связанные материалы и лид-блок.

Общие секции (`HeroSection`, `StepsSection`, `FaqSection`, `LeadFormSection`, `BlogSection`, `UsefulArticlesSection`, `PersonalManagerSection`) лучше расширять через props и существующие коллекции, а не копировать под новую страницу без причины.

## Логика

Чистые функции держатся отдельно от Astro markup и DOM-кода:

- `src/lib/calculator.ts` - источник правды для констант, тарифов, формул и форматирования калькулятора.
- `src/lib/blog.ts` - фильтры, сортировка, теги, пути и форматирование дат блога.

Калькулятор ECOM состоит из трех связанных частей:

- `src/lib/calculator.ts` - расчеты и начальное состояние.
- `src/components/ecom/CalculatorSection.astro` - серверная разметка и `data-*` параметры.
- `src/scripts/ecom/calculator-section.ts` - клиентское поведение.

При изменении калькулятора сверяйте все три слоя и запускайте `npm run check`.

## Клиентские скрипты

Скрипты лежат в `src/scripts` и подключаются из Astro-компонентов через небольшие inline `<script>` блоки. Общий lifecycle-helper находится в `src/scripts/common/lifecycle.ts`.

Правила для интерактивности:

- инициализируйте поведение через `runOnPageLoad`, если компонент должен работать после Astro page transitions;
- учитывайте `astro:after-swap` и cleanup перед `astro:before-swap`;
- защищайтесь от повторной привязки через `data-*` флаги вроде `data-calculator-bound`;
- используйте стабильные `data-*` hooks вместо хрупких цепочек CSS-селекторов;
- проверяйте найденные DOM-узлы перед использованием;
- уважайте `prefers-reduced-motion` для анимаций и reveal-эффектов;
- держите общие DOM-паттерны в `src/scripts/common`, а секционные сценарии в папках страницы.

Текущие группы скриптов:

- `src/scripts/common` - header, active nav, формы, диалог, FAQ, accordion, scroll reveal, scroll-to-top, документы, блог, карта, lifecycle.
- `src/scripts/ecom` - калькулятор, продукты, клиентский слайдер на Embla.
- `src/scripts/goszakaz` - вкладки финансирования.

## Стили и ассеты

- Глобальная база: `src/styles/reset.css`, `src/styles/global.css`.
- Стили секций и компонентов: `src/styles/components/...`.
- Общие SCSS partials: `src/styles/components/common/_section-mixins.scss`, `src/styles/components/common/_form-controls.scss`.
- Именование классов продолжает текущий стиль с префиксом блока, например `site-header__...`, `calculator-section__...`.
- Статические публичные файлы кладите в `public/`.
- Импортируемые Astro assets кладите в `src/assets/`.

Не добавляйте inline-стили без необходимости. Исключение - случаи, где Astro asset URL проще и безопаснее передать через inline custom property.

## Деплой

`astro.config.mjs` вычисляет `site` и `base` из переменных окружения GitHub Pages:

- `GITHUB_REPOSITORY_OWNER`
- `GITHUB_REPOSITORY`

Не заменяйте это жестко заданными production URL без отдельной причины. Скрипт `scripts/publish-pages.mjs` собирает сайт и принудительно пушит содержимое `dist/` в ветку `gh-pages`; относитесь к нему как к deployment-логике.

## Проверка перед завершением изменений

Минимальные ориентиры:

- UI или контент: `npm run build`.
- Контентные коллекции или схемы: `npm run build`, при заметных изменениях `npm run check`.
- Калькулятор или `src/lib/calculator.ts`: `npm run check`.
- Общие lifecycle/form helpers, маршруты, layout или `astro.config.mjs`: `npm run check`.

Тесты сейчас покрывают:

- уникальность и положительность `order` для основных контентных коллекций;
- валидные контексты социальных ссылок;
- базовые сценарии расчетов калькулятора.

## Что не коммитить

Не добавляйте в репозиторий локальные артефакты:

- `dist/`
- `.astro/`
- `node_modules/`
- `.ai/`
- `.anima/`
- `.devserver*`
- `.ssh-tunnel.*`
- `.localtunnel.log`
- `.lhr.log`
- `.playwright-cli/`
- `share-url.txt`
- `github-pages-url.txt`
- `output/`
- `package/`
- локальные логи и временные файлы IDE

Актуальные исключения описаны в `.gitignore`.

## Рабочие правила

- Сохраняйте `src/pages` тонкими.
- Для страниц с общей шапкой, футером, диалогом и UX-инициализацией используйте `SiteShell`.
- Повторяющийся UI-контент редактируйте через `src/content`.
- Расчеты и форматирование держите в `src/lib`.
- DOM-поведение держите в `src/scripts`, а не внутри больших inline-скриптов в компонентах.
- Стили добавляйте рядом с компонентом или секцией, которая ими владеет.
- Не меняйте `package-lock.json`, если не менялись зависимости.
- Будьте осторожны с `astro.config.mjs`, `src/content.config.ts` и `src/lib/calculator.ts`: у этих файлов широкий эффект на сборку и пользовательские сценарии.
