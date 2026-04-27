const DURATION = 1400;

const formatNumber = (value: number, grouped: boolean) =>
  grouped ? new Intl.NumberFormat("ru-RU").format(value) : String(value);

const renderNumber = (node: HTMLElement, value: number) => {
  const prefix = node.dataset.prefix || "";
  const postfix = node.dataset.postfix || "";
  const grouped = node.dataset.grouped === "true";

  node.textContent = `${prefix}${formatNumber(value, grouped)}${postfix}`;
};

const animateNumber = (node: HTMLElement) => {
  const target = Number.parseInt(node.dataset.target || "0", 10);

  if (!Number.isFinite(target)) {
    return;
  }

  if (window.matchMedia("(prefers-reduced-motion: reduce)").matches) {
    renderNumber(node, target);
    return;
  }

  const startedAt = performance.now();

  const tick = (timestamp: number) => {
    const progress = Math.min((timestamp - startedAt) / DURATION, 1);
    const nextValue = Math.round(target * (1 - (1 - progress) ** 3));
    renderNumber(node, nextValue);

    if (progress < 1) {
      requestAnimationFrame(tick);
      return;
    }

    renderNumber(node, target);
  };

  requestAnimationFrame(tick);
};

export const initCompanyStatsCounter = () => {
  const observers: IntersectionObserver[] = [];

  for (const section of document.querySelectorAll(".company-stats-section")) {
    if (
      !(section instanceof HTMLElement) ||
      section.dataset.counterStarted === "true"
    ) {
      continue;
    }

    const numbers = [
      ...section.querySelectorAll("[data-company-stat-number]"),
    ].filter((node): node is HTMLElement => node instanceof HTMLElement);

    if (!numbers.length) {
      continue;
    }

    for (const number of numbers) {
      renderNumber(number, 0);
    }

    if (!("IntersectionObserver" in window)) {
      numbers.forEach(animateNumber);
      section.dataset.counterStarted = "true";
      continue;
    }

    const observer = new IntersectionObserver(
      (entries) => {
        if (!entries.some((entry) => entry.isIntersecting)) {
          return;
        }

        numbers.forEach(animateNumber);
        section.dataset.counterStarted = "true";
        observer.disconnect();
      },
      {
        threshold: 0.25,
        rootMargin: "0px 0px -12% 0px",
      },
    );

    observer.observe(section);
    observers.push(observer);
  }

  return () => {
    for (const observer of observers) {
      observer.disconnect();
    }
  };
};
