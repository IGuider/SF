import { runOnPageLoad } from "../common/lifecycle";

const ACTIVE_STATE = "active";
const EXITING_STATE = "exiting";
const MOTION_SETTLED_STATE = "settled";
const MOTION_SETTLING_STATE = "settling";
const MOTION_DURATION = 420;

const motionCleanupByRoot = new WeakMap<HTMLElement, number>();

const animatePanelChange = (root: HTMLElement, direction: "next" | "previous") => {
  if (window.matchMedia("(prefers-reduced-motion: reduce)").matches) {
    return;
  }

  const previousCleanup = motionCleanupByRoot.get(root);

  if (previousCleanup) {
    window.clearTimeout(previousCleanup);
  }

  root.dataset.financingDirection = direction;
  root.dataset.financingMotion = MOTION_SETTLING_STATE;

  window.requestAnimationFrame(() => {
    root.dataset.financingMotion = MOTION_SETTLED_STATE;

    const cleanup = window.setTimeout(() => {
      delete root.dataset.financingMotion;
      delete root.dataset.financingDirection;
      motionCleanupByRoot.delete(root);
    }, MOTION_DURATION);

    motionCleanupByRoot.set(root, cleanup);
  });
};

const syncTabs = (root: HTMLElement, nextTabId: string) => {
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
    return;
  }

  const currentIndex = currentPanel ? panels.indexOf(currentPanel) : -1;
  const nextIndex = panels.indexOf(nextPanel);
  const direction = nextIndex > currentIndex ? "next" : "previous";

  tabs.forEach((tab) => {
    const isActive = tab.dataset.financingTab === nextTabId;

    tab.setAttribute("aria-selected", String(isActive));
    tab.tabIndex = isActive ? 0 : -1;
  });

  if (currentPanel) {
    currentPanel.dataset.state = EXITING_STATE;
    currentPanel.hidden = true;
  }

  nextPanel.hidden = false;
  nextPanel.dataset.state = ACTIVE_STATE;
  animatePanelChange(root, direction);
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

    panels.forEach((panel) => {
      panel.hidden = panel.dataset.state !== ACTIVE_STATE;
    });

    const onClick = (event: Event) => {
      const tab = event.currentTarget;

      if (!(tab instanceof HTMLButtonElement)) {
        return;
      }

      const nextTabId = tab.dataset.financingTab;

      if (nextTabId) {
        syncTabs(root, nextTabId);
      }
    };

    const onKeyDown = (event: KeyboardEvent) => {
      const currentIndex = tabs.findIndex((tab) => tab === event.currentTarget);

      if (currentIndex === -1) {
        return;
      }

      const lastIndex = tabs.length - 1;
      let nextIndex = currentIndex;

      if (event.key === "ArrowRight") {
        nextIndex = currentIndex === lastIndex ? 0 : currentIndex + 1;
      } else if (event.key === "ArrowLeft") {
        nextIndex = currentIndex === 0 ? lastIndex : currentIndex - 1;
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
        syncTabs(root, nextTabId);
      }
    };

    tabs.forEach((tab) => {
      tab.addEventListener("click", onClick);
      tab.addEventListener("keydown", onKeyDown);
    });

    cleanups.push(() => {
      tabs.forEach((tab) => {
        tab.removeEventListener("click", onClick);
        tab.removeEventListener("keydown", onKeyDown);
      });

      delete root.dataset.financingTabsBound;
      delete root.dataset.financingMotion;
      delete root.dataset.financingDirection;
    });
  });

  return () => {
    cleanups.forEach((cleanup) => cleanup());
  };
};

runOnPageLoad(initFinancingTabs);
