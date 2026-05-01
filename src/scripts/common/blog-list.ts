const BLOG_LIST_SELECTOR = "[data-blog-list]";
const BLOG_MAIN_SELECTOR = "[data-blog-main]";
const BLOG_ITEM_SELECTOR = "[data-blog-item]";
const BLOG_SENTINEL_SELECTOR = "[data-blog-sentinel]";
const BLOG_SENTINEL_TEXT_SELECTOR = "[data-blog-sentinel-text]";
const BLOG_EMPTY_SELECTOR = "[data-blog-empty]";
const BLOG_LAYOUT_SELECTOR = ".blog-page__layout";
const BLOG_PINNED_LIST_SELECTOR = ".blog-page__pinned-list";
const BLOG_REGULAR_LIST_SELECTOR = ".blog-page__list";
const BLOG_DIRECTIONS_SELECTOR = ".blog-page__directions";
const BLOG_DIRECTION_FILTER_SELECTOR = "[data-blog-direction-filter]";
const BLOG_CATEGORY_SELECTOR = "[data-blog-category-link]";
const BLOG_SEARCH_SELECTOR = "[data-blog-search]";
const BLOG_SEARCH_FORM_SELECTOR = ".blog-page__search";
const BLOG_ITEM_FILTER_REVEALED_CLASS = "blog-card-item--filter-revealed";
const BLOG_ITEM_REVEALED_CLASS = "blog-card-item--revealed";
const ALL_FILTER = "all";
const PAGE_SIZE = 6;
const LOAD_FEEDBACK_DELAY = 650;
const SEARCH_DEBOUNCE_DELAY = 250;
const MIN_SEARCH_QUERY_LENGTH = 3;
const LOAD_IDLE_TEXT = "Прокрутите ниже, чтобы загрузить ещё";
const LOAD_ACTIVE_TEXT = "Загружаем статьи";

type BlogFilterState = {
  category: string;
  direction: string;
  query: string;
};

const getFilterState = (): BlogFilterState => {
  const params = new URLSearchParams(window.location.search);

  return {
    category: params.get("category") || ALL_FILTER,
    direction: params.get("direction") || ALL_FILTER,
    query: (params.get("q") || "").trim(),
  };
};

const updateUrl = (
  state: BlogFilterState,
  mode: "push" | "replace" = "push",
) => {
  const params = new URLSearchParams();

  if (state.direction !== ALL_FILTER) {
    params.set("direction", state.direction);
  }

  if (state.category !== ALL_FILTER) {
    params.set("category", state.category);
  }

  if (state.query) {
    params.set("q", state.query);
  }

  const nextUrl = `${window.location.pathname}${params.toString() ? `?${params}` : ""}`;
  window.history[mode === "replace" ? "replaceState" : "pushState"](
    {},
    "",
    nextUrl,
  );
};

const setActiveFilter = (
  root: HTMLElement,
  selector: string,
  dataKey: "blogDirectionFilter" | "blogCategoryLink",
  value: string,
) => {
  let activeIndex = 0;

  root.querySelectorAll<HTMLAnchorElement>(selector).forEach((link, index) => {
    const isActive = link.dataset[dataKey] === value;

    link.classList.toggle("is-active", isActive);

    if (isActive) {
      activeIndex = index;
      link.setAttribute("aria-current", "page");
      link.setAttribute("aria-disabled", "true");
      return;
    }

    link.removeAttribute("aria-current");
    link.removeAttribute("aria-disabled");
  });

  return activeIndex;
};

const setDirectionTagsVisible = (items: HTMLElement[], visible: boolean) => {
  items.forEach((item) => {
    item.querySelectorAll<HTMLElement>('[data-blog-tag="direction"]').forEach((tag) => {
      tag.hidden = !visible;
    });
  });
};

export const initBlogList = () => {
  document.querySelectorAll<HTMLElement>(BLOG_LIST_SELECTOR).forEach((root) => {
    if (root.dataset.blogListBound === "true") {
      return;
    }

    root.dataset.blogListBound = "true";

    const main = root.querySelector<HTMLElement>(BLOG_MAIN_SELECTOR);
    const layout = root.closest<HTMLElement>(BLOG_LAYOUT_SELECTOR);
    const pinnedList = root.querySelector<HTMLElement>(
      BLOG_PINNED_LIST_SELECTOR,
    );
    const regularList = root.querySelector<HTMLElement>(
      BLOG_REGULAR_LIST_SELECTOR,
    );
    const sentinel = root.querySelector<HTMLElement>(BLOG_SENTINEL_SELECTOR);
    const sentinelText = root.querySelector<HTMLElement>(
      BLOG_SENTINEL_TEXT_SELECTOR,
    );
    const empty = root.querySelector<HTMLElement>(BLOG_EMPTY_SELECTOR);
    const searchInput = root.querySelector<HTMLInputElement>(
      BLOG_SEARCH_SELECTOR,
    );
    const searchForm = root.querySelector<HTMLFormElement>(
      BLOG_SEARCH_FORM_SELECTOR,
    );
    const directionsNav = root.querySelector<HTMLElement>(
      BLOG_DIRECTIONS_SELECTOR,
    );
    const allItems = [
      ...root.querySelectorAll<HTMLElement>(BLOG_ITEM_SELECTOR),
    ];
    const pinnedItem =
      allItems.find((item) => item.classList.contains("blog-card-item--pinned")) ||
      null;

    if (!main || !pinnedList || !regularList || !sentinel) {
      return;
    }

    let observer: IntersectionObserver | null = null;
    let hiddenItems: HTMLElement[] = [];
    let isLoadingNextItems = false;
    let loadFeedbackTimeout: number | undefined;
    let searchDebounceTimeout: number | undefined;

    const revealItem = (
      item: HTMLElement,
      className = BLOG_ITEM_REVEALED_CLASS,
      delayIndex = 0,
    ) => {
      item.classList.remove(className);
      item.style.setProperty("--blog-card-reveal-index", String(delayIndex));
      item.hidden = false;

      requestAnimationFrame(() => {
        item.classList.add(className);
      });
    };

    const scrollToBlogLayout = () => {
      if (!layout) {
        return;
      }

      const prefersReducedMotion = window.matchMedia(
        "(prefers-reduced-motion: reduce)",
      ).matches;

      layout.scrollIntoView({
        behavior: prefersReducedMotion ? "auto" : "smooth",
        block: "start",
      });
    };

    const getSearchQuery = () => {
      const query = searchInput?.value.trim() || "";

      return query.length >= MIN_SEARCH_QUERY_LENGTH ? query : "";
    };

    const showNextItems = () => {
      if (isLoadingNextItems) {
        return;
      }

      isLoadingNextItems = true;
      sentinel.dataset.blogLoading = "true";
      if (sentinelText) {
        sentinelText.textContent = LOAD_ACTIVE_TEXT;
      }
      observer?.disconnect();

      loadFeedbackTimeout = window.setTimeout(() => {
        hiddenItems.splice(0, PAGE_SIZE).forEach((item) => {
          revealItem(item);
        });

        if (!hiddenItems.length) {
          isLoadingNextItems = false;
          delete sentinel.dataset.blogLoading;
          sentinel.setAttribute("hidden", "");
          return;
        }

        isLoadingNextItems = false;
        delete sentinel.dataset.blogLoading;
        if (sentinelText) {
          sentinelText.textContent = LOAD_IDLE_TEXT;
        }
        resetObserver();
      }, LOAD_FEEDBACK_DELAY);
    };

    const resetObserver = () => {
      observer?.disconnect();

      if (!hiddenItems.length) {
        sentinel.setAttribute("hidden", "");
        return;
      }

      sentinel.removeAttribute("hidden");
      delete sentinel.dataset.blogLoading;
      if (sentinelText) {
        sentinelText.textContent = LOAD_IDLE_TEXT;
      }
      observer = new IntersectionObserver((entries) => {
        if (entries.some((entry) => entry.isIntersecting)) {
          showNextItems();
        }
      }, { rootMargin: "0px" });

      observer.observe(sentinel);
    };

    const applyFilters = () => {
      if (loadFeedbackTimeout) {
        window.clearTimeout(loadFeedbackTimeout);
        loadFeedbackTimeout = undefined;
      }
      isLoadingNextItems = false;
      delete sentinel.dataset.blogLoading;

      const state = getFilterState();

      if (searchInput && document.activeElement !== searchInput) {
        searchInput.value = state.query;
      }

      const activeDirectionIndex = setActiveFilter(
        root,
        BLOG_DIRECTION_FILTER_SELECTOR,
        "blogDirectionFilter",
        state.direction,
      );
      directionsNav?.style.setProperty(
        "--blog-direction-active-index",
        String(activeDirectionIndex),
      );
      setActiveFilter(
        root,
        BLOG_CATEGORY_SELECTOR,
        "blogCategoryLink",
        state.category,
      );

      const matchesState = (item: HTMLElement) => {
        const matchesDirection =
          state.direction === ALL_FILTER ||
          item.dataset.blogDirection === state.direction;
      const matchesCategory =
        state.category === ALL_FILTER ||
        item.dataset.blogCategory === state.category;
      const matchesQuery =
          !state.query ||
          item.dataset.blogTitle?.includes(state.query.toLowerCase());

        return matchesDirection && matchesCategory && matchesQuery;
      };

      const pinnedVisibleItem = pinnedItem && matchesState(pinnedItem) ? pinnedItem : null;
      const regularItems = allItems.filter((item) => item !== pinnedItem && matchesState(item));

      pinnedList.replaceChildren();
      regularList.replaceChildren();

      empty?.toggleAttribute("hidden", Boolean(pinnedVisibleItem) || regularItems.length > 0);
      setDirectionTagsVisible(allItems, state.direction === ALL_FILTER);

      if (pinnedVisibleItem) {
        const card = pinnedVisibleItem.querySelector<HTMLElement>(".blog-card");

        pinnedVisibleItem.classList.add("blog-card-item--pinned");
        pinnedVisibleItem.classList.remove(BLOG_ITEM_REVEALED_CLASS);
        pinnedVisibleItem.classList.remove(BLOG_ITEM_FILTER_REVEALED_CLASS);
        card?.classList.add("blog-card--pinned");
        revealItem(pinnedVisibleItem, BLOG_ITEM_FILTER_REVEALED_CLASS);
        pinnedList.append(pinnedVisibleItem);
      }

      let revealIndex = 0;

      regularItems.forEach((item, index) => {
        const card = item.querySelector<HTMLElement>(".blog-card");

        item.classList.remove("blog-card-item--pinned");
        card?.classList.remove("blog-card--pinned");
        item.classList.remove(BLOG_ITEM_REVEALED_CLASS);
        item.classList.remove(BLOG_ITEM_FILTER_REVEALED_CLASS);
        if (index >= PAGE_SIZE) {
          item.hidden = true;
        } else {
          revealItem(item, BLOG_ITEM_FILTER_REVEALED_CLASS, revealIndex);
          revealIndex += 1;
        }
        regularList.append(item);
      });

      hiddenItems = [
        ...regularList.querySelectorAll<HTMLElement>(
          `${BLOG_ITEM_SELECTOR}[hidden]`,
        ),
      ];
      resetObserver();
    };

    root
      .querySelectorAll<HTMLAnchorElement>(BLOG_DIRECTION_FILTER_SELECTOR)
      .forEach((link) => {
        link.addEventListener("click", (event) => {
          event.preventDefault();
          if (link.classList.contains("is-active")) {
            return;
          }
          const state = getFilterState();

          updateUrl({
            ...state,
            category: ALL_FILTER,
            direction: link.dataset.blogDirectionFilter || ALL_FILTER,
          });
          applyFilters();
          scrollToBlogLayout();
        });
      });

    root
      .querySelectorAll<HTMLAnchorElement>(BLOG_CATEGORY_SELECTOR)
      .forEach((link) => {
        link.addEventListener("click", (event) => {
          event.preventDefault();
          if (link.classList.contains("is-active")) {
            return;
          }
          const state = getFilterState();

          updateUrl({
            ...state,
            category: link.dataset.blogCategoryLink || ALL_FILTER,
          });
          applyFilters();
          scrollToBlogLayout();
        });
      });

    searchForm?.addEventListener("submit", (event) => {
      event.preventDefault();
      if (searchDebounceTimeout) {
        window.clearTimeout(searchDebounceTimeout);
        searchDebounceTimeout = undefined;
      }
      const state = getFilterState();

      updateUrl({
            ...state,
            query: getSearchQuery(),
          });
      applyFilters();
      if (getSearchQuery()) {
        scrollToBlogLayout();
      }
    });

    searchInput?.addEventListener("input", () => {
      if (searchDebounceTimeout) {
        window.clearTimeout(searchDebounceTimeout);
      }

      searchDebounceTimeout = window.setTimeout(() => {
        const state = getFilterState();
        const nextQuery = getSearchQuery();

        if (state.query === nextQuery) {
          return;
        }

        updateUrl(
          {
            ...state,
            query: nextQuery,
          },
          "replace",
        );
        applyFilters();
        if (nextQuery) {
          scrollToBlogLayout();
        }
      }, SEARCH_DEBOUNCE_DELAY);
    });

    window.addEventListener("popstate", applyFilters);
    applyFilters();
  });
};
