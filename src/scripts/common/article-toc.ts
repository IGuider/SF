const TOC_SELECTOR = "[data-article-toc]";
const LINK_SELECTOR = "[data-article-toc-link]";
const ACTIVE_CLASS = "is-active";
const ACTIVE_SCROLL_LOCK_MS = 1200;
const SCROLL_OFFSET_EXTRA = 32;
const HASH_TARGET_RANGE = 320;

const getTargetId = (link: HTMLAnchorElement) => {
  const href = link.getAttribute("href");

  if (!href?.startsWith("#")) {
    return null;
  }

  try {
    return decodeURIComponent(href.slice(1));
  } catch {
    return href.slice(1);
  }
};

const getHashId = () => {
  if (!window.location.hash) {
    return null;
  }

  try {
    return decodeURIComponent(window.location.hash.slice(1));
  } catch {
    return window.location.hash.slice(1);
  }
};

export const initArticleToc = () => {
  const tocElements = Array.from(
    document.querySelectorAll<HTMLElement>(TOC_SELECTOR),
  ).filter((toc) => toc.dataset.articleTocBound !== "true");

  if (tocElements.length === 0) {
    return;
  }

  const cleanupCallbacks: Array<() => void> = [];

  tocElements.forEach((toc) => {
    const list = toc.querySelector<HTMLElement>("ul");
    const links = Array.from(
      toc.querySelectorAll<HTMLAnchorElement>(LINK_SELECTOR),
    );
    const targets = links
      .map((link) => {
        const id = getTargetId(link);
        const target = id ? document.getElementById(id) : null;

        return target ? { id, link, target } : null;
      })
      .filter(
        (item): item is { id: string; link: HTMLAnchorElement; target: HTMLElement } =>
          Boolean(item),
      );

    if (!list || targets.length === 0) {
      return;
    }

    toc.dataset.articleTocBound = "true";

    const setActive = (activeId: string) => {
      targets.forEach(({ id, link }) => {
        const isActive = id === activeId;

        link.classList.toggle(ACTIVE_CLASS, isActive);

        if (isActive) {
          link.setAttribute("aria-current", "true");
        } else {
          link.removeAttribute("aria-current");
        }
      });

      const activeLink = targets.find(({ id }) => id === activeId)?.link;
      const activeItem = activeLink?.closest<HTMLElement>("li");

      if (!activeItem) {
        return;
      }

      list.style.setProperty(
        "--article-toc-active-y",
        `${activeItem.offsetTop}px`,
      );
      list.style.setProperty(
        "--article-toc-active-height",
        `${activeItem.offsetHeight}px`,
      );
      list.style.setProperty("--article-toc-active-opacity", "1");
    };

    let activeScrollLockUntil = 0;
    let unlockTimeoutId = 0;

    const getActivationOffset = () => {
      const targetOffsets = targets.map(({ target }) => {
        const scrollMarginTop = Number.parseFloat(
          window.getComputedStyle(target).scrollMarginTop,
        );

        return Number.isFinite(scrollMarginTop) ? scrollMarginTop : 0;
      });

      return Math.max(...targetOffsets, 0) + SCROLL_OFFSET_EXTRA;
    };

    const updateActiveLink = () => {
      if (Date.now() < activeScrollLockUntil) {
        return;
      }

      const hashId = getHashId();
      const hashTarget = hashId
        ? targets.find(({ id }) => id === hashId)
        : undefined;

      if (hashTarget) {
        const hashTargetTop = hashTarget.target.getBoundingClientRect().top;

        if (hashTargetTop >= 0 && hashTargetTop <= HASH_TARGET_RANGE) {
          setActive(hashTarget.id);
          return;
        }
      }

      const activationOffset = getActivationOffset();
      const activeTarget =
        targets.findLast(({ target }) => {
          const targetTop = target.getBoundingClientRect().top + window.scrollY;

          return targetTop <= window.scrollY + activationOffset;
        }) ?? targets[0];

      setActive(activeTarget.id);
    };

    let frameId = 0;
    const requestUpdate = () => {
      if (frameId) {
        return;
      }

      frameId = window.requestAnimationFrame(() => {
        frameId = 0;
        updateActiveLink();
      });
    };

    const handleTocClick = (event: MouseEvent) => {
      const link = (event.target as Element | null)?.closest<HTMLAnchorElement>(
        LINK_SELECTOR,
      );

      if (!link || !toc.contains(link)) {
        return;
      }

      const activeId = getTargetId(link);

      if (!activeId) {
        return;
      }

      setActive(activeId);
      activeScrollLockUntil = Date.now() + ACTIVE_SCROLL_LOCK_MS;

      if (unlockTimeoutId) {
        window.clearTimeout(unlockTimeoutId);
      }

      unlockTimeoutId = window.setTimeout(() => {
        activeScrollLockUntil = 0;
        requestUpdate();
      }, ACTIVE_SCROLL_LOCK_MS);
    };

    toc.addEventListener("click", handleTocClick);
    window.addEventListener("scroll", requestUpdate, { passive: true });
    window.addEventListener("resize", requestUpdate);
    window.addEventListener("hashchange", requestUpdate);
    updateActiveLink();

    cleanupCallbacks.push(() => {
      if (frameId) {
        window.cancelAnimationFrame(frameId);
      }

      if (unlockTimeoutId) {
        window.clearTimeout(unlockTimeoutId);
      }

      toc.removeEventListener("click", handleTocClick);
      window.removeEventListener("scroll", requestUpdate);
      window.removeEventListener("resize", requestUpdate);
      window.removeEventListener("hashchange", requestUpdate);
      toc.dataset.articleTocBound = "false";
    });
  });

  if (cleanupCallbacks.length === 0) {
    return;
  }

  return () => cleanupCallbacks.forEach((cleanup) => cleanup());
};
