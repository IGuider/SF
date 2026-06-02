import { runOnPageLoad } from "../common/lifecycle";

const ACTIVE_STATE = "active";
const IDLE_STATE = "idle";
const MOTION_SETTLED_STATE = "settled";
const MOTION_SETTLING_STATE = "settling";
const AUTO_ROTATION_DELAY = 5000;
const MOTION_DURATION = 420;
const MOBILE_TABS_QUERY = "(max-width: 768px)";
const SWIPE_MIN_DISTANCE = 44;
const SWIPE_MAX_VERTICAL_RATIO = 0.75;

type FinancingMotionCleanup = {
  finish: () => void;
  timeoutId: number;
};

const motionCleanupByRoot = new WeakMap<HTMLElement, FinancingMotionCleanup>();
const mobileTabsQuery = window.matchMedia(MOBILE_TABS_QUERY);
const reducedMotionQuery = window.matchMedia(
  "(prefers-reduced-motion: reduce)",
);

type FinancingDirection = "next" | "previous";
type FinancingMotionSource = "default" | "carousel";

type FinancingSwipeState = {
  pointerId: number;
  startX: number;
  startY: number;
  latestX: number;
  latestY: number;
};

const getActivePanelIndex = (panels: HTMLElement[]) =>
  panels.findIndex((panel) => panel.dataset.state === ACTIVE_STATE);

const getWrappedIndex = (index: number, count: number) =>
  ((index % count) + count) % count;

const isInteractiveSwipeTarget = (target: EventTarget | null) =>
  target instanceof Element &&
  Boolean(
    target.closest(
      'a, button, input, select, textarea, label, [role="button"], [role="link"]',
    ),
  );

const isElementInViewport = (element: HTMLElement) => {
  const rect = element.getBoundingClientRect();
  const viewportHeight =
    window.innerHeight || document.documentElement.clientHeight;
  const viewportWidth =
    window.innerWidth || document.documentElement.clientWidth;

  return (
    rect.bottom > 0 &&
    rect.right > 0 &&
    rect.top < viewportHeight &&
    rect.left < viewportWidth
  );
};

const centerTabInList = (tab: HTMLButtonElement) => {
  const tabList = tab.closest(".procurement-financing__tabs");

  if (!(tabList instanceof HTMLElement)) {
    return;
  }

  const centeredScrollLeft =
    tab.offsetLeft - (tabList.clientWidth - tab.offsetWidth) / 2;
  const maxScrollLeft = tabList.scrollWidth - tabList.clientWidth;
  const nextScrollLeft = Math.max(
    0,
    Math.min(centeredScrollLeft, maxScrollLeft),
  );

  tabList.scrollTo({
    behavior: reducedMotionQuery.matches ? "auto" : "smooth",
    left: nextScrollLeft,
  });
};

const animatePanelChange = (
  root: HTMLElement,
  direction: FinancingDirection,
  source: FinancingMotionSource = "default",
) => {
  if (reducedMotionQuery.matches) {
    return;
  }

  const previousCleanup = motionCleanupByRoot.get(root);

  if (previousCleanup) {
    window.clearTimeout(previousCleanup.timeoutId);
    previousCleanup.finish();
  }

  root.dataset.financingDirection = direction;
  root.dataset.financingMotion = MOTION_SETTLING_STATE;
  root.dataset.financingMotionSource = source;

  window.requestAnimationFrame(() => {
    root.dataset.financingMotion = MOTION_SETTLED_STATE;

    const finish = () => {
      delete root.dataset.financingMotion;
      delete root.dataset.financingDirection;
      delete root.dataset.financingMotionSource;
      motionCleanupByRoot.delete(root);
    };
    const timeoutId = window.setTimeout(finish, MOTION_DURATION);

    motionCleanupByRoot.set(root, { finish, timeoutId });
  });
};

const syncTabs = (
  root: HTMLElement,
  nextTabId: string,
  directionOverride?: FinancingDirection,
  motionSource?: FinancingMotionSource,
) => {
  const tabs = Array.from(
    root.querySelectorAll<HTMLButtonElement>("[data-financing-tab]"),
  );
  const panels = Array.from(
    root.querySelectorAll<HTMLElement>("[data-financing-panel]"),
  );
  const currentPanel = panels.find(
    (panel) => panel.dataset.state === ACTIVE_STATE,
  );
  const nextPanel = panels.find(
    (panel) => panel.dataset.financingPanel === nextTabId,
  );

  if (!nextPanel || currentPanel === nextPanel) {
    return false;
  }

  const currentIndex = currentPanel ? panels.indexOf(currentPanel) : -1;
  const nextIndex = panels.indexOf(nextPanel);
  const direction =
    directionOverride ?? (nextIndex > currentIndex ? "next" : "previous");

  tabs.forEach((tab) => {
    const isActive = tab.dataset.financingTab === nextTabId;

    tab.setAttribute("aria-selected", String(isActive));
    tab.tabIndex = isActive ? 0 : -1;

    if (isActive && mobileTabsQuery.matches) {
      centerTabInList(tab);
    }
  });

  if (currentPanel) {
    currentPanel.dataset.state = IDLE_STATE;
    currentPanel.hidden = true;
  }

  nextPanel.hidden = false;
  nextPanel.dataset.state = ACTIVE_STATE;
  animatePanelChange(root, direction, motionSource);

  return true;
};

const initFinancingTabs = () => {
  const roots = Array.from(
    document.querySelectorAll<HTMLElement>("[data-financing-tabs-root]"),
  );
  const cleanups: Array<() => void> = [];

  roots.forEach((root) => {
    if (root.dataset.financingTabsBound === "true") {
      return;
    }

    root.dataset.financingTabsBound = "true";

    const tabs = Array.from(
      root.querySelectorAll<HTMLButtonElement>("[data-financing-tab]"),
    );
    const panels = Array.from(
      root.querySelectorAll<HTMLElement>("[data-financing-panel]"),
    );
    const tabsBody = root.querySelector<HTMLElement>(
      "[data-financing-tabs-body]",
    );
    let rotationTimer: number | undefined;
    let swipeState: FinancingSwipeState | null = null;
    let isRootVisible = isElementInViewport(root);
    let visibilityObserver: IntersectionObserver | undefined;
    let removeVisibilityFallback: (() => void) | undefined;

    panels.forEach((panel) => {
      panel.hidden = panel.dataset.state !== ACTIVE_STATE;
    });

    const stopAutoRotation = () => {
      if (!rotationTimer) {
        return;
      }

      window.clearInterval(rotationTimer);
      rotationTimer = undefined;
    };

    const getRelativeTab = (offset: number) => {
      const activeIndex = getActivePanelIndex(panels);

      if (activeIndex === -1 || panels.length === 0) {
        return undefined;
      }

      const nextPanel =
        panels[getWrappedIndex(activeIndex + offset, panels.length)];
      return tabs.find(
        (tab) => tab.dataset.financingTab === nextPanel.dataset.financingPanel,
      );
    };

    const switchRelativeTab = (
      offset: number,
      direction: FinancingDirection,
      motionSource: FinancingMotionSource = "carousel",
    ) => {
      const nextTab = getRelativeTab(offset);
      const nextTabId = nextTab?.dataset.financingTab;

      if (!nextTabId) {
        return false;
      }

      return syncTabs(root, nextTabId, direction, motionSource);
    };

    const shouldAutoRotate = () =>
      tabs.length > 1 &&
      mobileTabsQuery.matches &&
      !reducedMotionQuery.matches &&
      !document.hidden &&
      isRootVisible;

    const startAutoRotation = () => {
      stopAutoRotation();

      if (!shouldAutoRotate()) {
        return;
      }

      rotationTimer = window.setInterval(() => {
        switchRelativeTab(1, "next");
      }, AUTO_ROTATION_DELAY);
    };

    const restartAutoRotation = () => {
      stopAutoRotation();
      startAutoRotation();
    };

    const onClick = (event: Event) => {
      const tab = event.currentTarget;

      if (!(tab instanceof HTMLButtonElement)) {
        return;
      }

      const nextTabId = tab.dataset.financingTab;

      if (nextTabId) {
        syncTabs(root, nextTabId);
        restartAutoRotation();
      }
    };

    const onKeyDown = (event: KeyboardEvent) => {
      const currentIndex = tabs.findIndex((tab) => tab === event.currentTarget);

      if (currentIndex === -1) {
        return;
      }

      const lastIndex = tabs.length - 1;
      let nextIndex = currentIndex;

      let direction: FinancingDirection | undefined;

      if (event.key === "ArrowRight") {
        nextIndex = currentIndex === lastIndex ? 0 : currentIndex + 1;
        direction = "next";
      } else if (event.key === "ArrowLeft") {
        nextIndex = currentIndex === 0 ? lastIndex : currentIndex - 1;
        direction = "previous";
      } else if (event.key === "Home") {
        nextIndex = 0;
      } else if (event.key === "End") {
        nextIndex = lastIndex;
      } else {
        return;
      }

      event.preventDefault();

      const nextTab = tabs[nextIndex];
      const nextTabId = nextTab.dataset.financingTab;

      nextTab.focus();

      if (nextTabId) {
        syncTabs(root, nextTabId, direction);
        restartAutoRotation();
      }
    };

    const onPointerDown = (event: PointerEvent) => {
      if (
        !mobileTabsQuery.matches ||
        (event.pointerType === "mouse" && event.button !== 0) ||
        tabs.length <= 1 ||
        isInteractiveSwipeTarget(event.target)
      ) {
        return;
      }

      swipeState = {
        pointerId: event.pointerId,
        startX: event.clientX,
        startY: event.clientY,
        latestX: event.clientX,
        latestY: event.clientY,
      };

      tabsBody?.setPointerCapture?.(event.pointerId);
      stopAutoRotation();
    };

    const onPointerMove = (event: PointerEvent) => {
      if (!swipeState || swipeState.pointerId !== event.pointerId) {
        return;
      }

      swipeState.latestX = event.clientX;
      swipeState.latestY = event.clientY;
    };

    const finishSwipe = (event: PointerEvent) => {
      if (!swipeState || swipeState.pointerId !== event.pointerId) {
        return;
      }

      const offsetX = swipeState.latestX - swipeState.startX;
      const offsetY = swipeState.latestY - swipeState.startY;
      const isHorizontalSwipe =
        Math.abs(offsetX) >= SWIPE_MIN_DISTANCE &&
        Math.abs(offsetY) <= Math.abs(offsetX) * SWIPE_MAX_VERTICAL_RATIO;

      if (isHorizontalSwipe) {
        switchRelativeTab(
          offsetX < 0 ? 1 : -1,
          offsetX < 0 ? "next" : "previous",
          "carousel",
        );
      }

      tabsBody?.releasePointerCapture?.(event.pointerId);
      swipeState = null;
      restartAutoRotation();
    };

    const cancelSwipe = (event: PointerEvent) => {
      if (!swipeState || swipeState.pointerId !== event.pointerId) {
        return;
      }

      tabsBody?.releasePointerCapture?.(event.pointerId);
      swipeState = null;
      restartAutoRotation();
    };

    const onAutoRotationStateChange = () => {
      swipeState = null;
      restartAutoRotation();
    };

    const setRootVisibility = (isVisible: boolean) => {
      if (isRootVisible === isVisible) {
        return;
      }

      isRootVisible = isVisible;
      onAutoRotationStateChange();
    };

    if ("IntersectionObserver" in window) {
      visibilityObserver = new IntersectionObserver(
        (entries) => {
          const entry = entries[0];

          if (!entry) {
            return;
          }

          setRootVisibility(
            entry.isIntersecting && entry.intersectionRatio > 0,
          );
        },
        { threshold: 0.1 },
      );
      visibilityObserver.observe(root);
    } else {
      const syncRootVisibility = () => {
        setRootVisibility(isElementInViewport(root));
      };

      window.addEventListener("scroll", syncRootVisibility, { passive: true });
      window.addEventListener("resize", syncRootVisibility);
      removeVisibilityFallback = () => {
        window.removeEventListener("scroll", syncRootVisibility);
        window.removeEventListener("resize", syncRootVisibility);
      };
    }

    tabs.forEach((tab) => {
      tab.addEventListener("click", onClick);
      tab.addEventListener("keydown", onKeyDown);
    });

    tabsBody?.addEventListener("pointerdown", onPointerDown);
    tabsBody?.addEventListener("pointermove", onPointerMove);
    tabsBody?.addEventListener("pointerup", finishSwipe);
    tabsBody?.addEventListener("pointercancel", cancelSwipe);
    mobileTabsQuery.addEventListener("change", onAutoRotationStateChange);
    reducedMotionQuery.addEventListener("change", onAutoRotationStateChange);
    document.addEventListener("visibilitychange", onAutoRotationStateChange);
    startAutoRotation();

    cleanups.push(() => {
      const motionCleanup = motionCleanupByRoot.get(root);

      if (motionCleanup) {
        window.clearTimeout(motionCleanup.timeoutId);
        motionCleanup.finish();
      }

      stopAutoRotation();
      tabs.forEach((tab) => {
        tab.removeEventListener("click", onClick);
        tab.removeEventListener("keydown", onKeyDown);
      });

      tabsBody?.removeEventListener("pointerdown", onPointerDown);
      tabsBody?.removeEventListener("pointermove", onPointerMove);
      tabsBody?.removeEventListener("pointerup", finishSwipe);
      tabsBody?.removeEventListener("pointercancel", cancelSwipe);
      mobileTabsQuery.removeEventListener("change", onAutoRotationStateChange);
      reducedMotionQuery.removeEventListener(
        "change",
        onAutoRotationStateChange,
      );
      document.removeEventListener(
        "visibilitychange",
        onAutoRotationStateChange,
      );
      visibilityObserver?.disconnect();
      removeVisibilityFallback?.();
      delete root.dataset.financingTabsBound;
      delete root.dataset.financingMotion;
      delete root.dataset.financingDirection;
      delete root.dataset.financingMotionSource;
    });
  });

  return () => {
    cleanups.forEach((cleanup) => cleanup());
  };
};

runOnPageLoad(initFinancingTabs);
