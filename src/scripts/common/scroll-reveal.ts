const REVEAL_SELECTOR = [
  ".hero-section",
  ".directions-section",
  ".why-trust-section",
  ".mission-section",
  ".company-facts-section",
  ".company-stats-section",
  ".lead-form-section",
  ".directions-card",
  ".why-trust-card",
  ".company-fact-card",
  ".company-stat-card",
  ".feature-card",
  ".calculator-section__panel",
  ".products-card",
  ".clients-section",
  ".steps-section",
  ".blog-section",
  ".faq-section",
].join(",");

const INITIAL_VISIBLE_RATIO = 0.96;
const REVEAL_ROOT_MARGIN = "0px 0px -4% 0px";
const REVEAL_THRESHOLD = 0.08;

let revealObserver: IntersectionObserver | null = null;

export const initScrollReveal = () => {
  revealObserver?.disconnect();

  const items = [...document.querySelectorAll<HTMLElement>(REVEAL_SELECTOR)];

  if (
    window.matchMedia("(prefers-reduced-motion: reduce)").matches ||
    !("IntersectionObserver" in window)
  ) {
    for (const item of items) {
      item.dataset.reveal = "true";
      item.dataset.revealState = "visible";
    }

    return;
  }

  revealObserver = new IntersectionObserver(
    (entries) => {
      for (const entry of entries) {
        if (!entry.isIntersecting) {
          continue;
        }

        const target = entry.target;

        if (target instanceof HTMLElement) {
          target.dataset.revealState = "visible";
          revealObserver?.unobserve(target);
        }
      }
    },
    {
      rootMargin: REVEAL_ROOT_MARGIN,
      threshold: REVEAL_THRESHOLD,
    },
  );

  for (const item of items) {
    item.dataset.reveal = "true";

    if (
      item.getBoundingClientRect().top <
      window.innerHeight * INITIAL_VISIBLE_RATIO
    ) {
      item.dataset.revealState = "visible";
      continue;
    }

    item.dataset.revealState = "hidden";
    revealObserver.observe(item);
  }

  return () => {
    revealObserver?.disconnect();
    revealObserver = null;
  };
};
