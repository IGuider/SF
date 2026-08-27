const REVEAL_SELECTOR = [
  ".hero-section",
  ".directions-section",
  ".why-trust-section",
  ".mission-section",
  ".company-facts-section",
  ".company-stats-section",
  ".business-value-section",
  ".company-values-section",
  ".strategic-leadership-section",
  ".lead-form-section",
  ".directions-card",
  ".why-trust-card",
  ".company-fact-card",
  ".company-stat-card",
  ".business-value-stat",
  ".company-value-card",
  ".leadership-card",
  ".feature-card",
  ".calculator-section__panel",
  ".products-card",
  ".clients-section",
  ".steps-section",
  ".blog-section",
  ".faq-section",
  ".blog-page__hero",
  ".blog-card-item",
  ".blog-page__sidebar",
  ".article-page__header",
  ".article-page__content > *",
  ".article-page__aside",
  ".article-page__lead",
  ".article-page__related",
  ".bg-feature-card",
  ".bg-financing-card",
  ".bg-partners",
  ".bg-consult",
  ".procurement-support-card",
  ".tender-participation-card",
  ".icon-feature-card",
  ".about-section__content",
  ".procurement-financing",
  ".procurement-why-card",
  ".personal-manager",
  ".useful-articles-section",
  ".vkl-page__title",
  ".vkl-page__group",
  ".documents-page__title",
  ".documents-page__group",
  ".documents-page__contacts",
  ".privacy-page__title",
  ".privacy-page__text-block",
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
