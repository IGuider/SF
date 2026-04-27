const SECTION_SELECTOR = ".steps-section";
const NUMBER_SELECTOR = "[data-steps-number]";
const DESKTOP_QUERY = "(min-width: 561px)";
const ANIMATION_DURATION_MS = 2200;

const easeOutCubic = (value: number) => 1 - (1 - value) ** 3;

const activateAllNumbers = (numbers: HTMLElement[]) => {
  for (const number of numbers) {
    number.classList.add("is-activated");
  }
};

const resetNumbers = (numbers: HTMLElement[]) => {
  for (const number of numbers) {
    number.classList.remove("is-activated");
  }
};

const completeSectionAnimation = (
  section: HTMLElement,
  numbers: HTMLElement[],
) => {
  section.style.setProperty("--steps-timeline-progress", "1");
  activateAllNumbers(numbers);
  section.dataset.stepsAnimated = "true";
};

const animateSection = (section: HTMLElement) => {
  if (
    section.dataset.stepsAnimating === "true" ||
    section.dataset.stepsAnimated === "true"
  ) {
    return;
  }

  const timeline = section.querySelector(".steps-section__timeline");
  const numbers = [...section.querySelectorAll<HTMLElement>(NUMBER_SELECTOR)];

  if (!(timeline instanceof HTMLElement) || numbers.length === 0) {
    return;
  }

  if (
    window.matchMedia("(prefers-reduced-motion: reduce)").matches ||
    !window.matchMedia(DESKTOP_QUERY).matches
  ) {
    if (window.matchMedia(DESKTOP_QUERY).matches) {
      completeSectionAnimation(section, numbers);
    }

    return;
  }

  const timelineRect = timeline.getBoundingClientRect();

  if (timelineRect.width <= 0) {
    completeSectionAnimation(section, numbers);
    return;
  }

  resetNumbers(numbers);

  const checkpoints = numbers
    .map((number) => {
      const rect = number.getBoundingClientRect();
      const center = rect.left + rect.width / 2;
      return {
        number,
        progress: Math.min(
          Math.max((center - timelineRect.left) / timelineRect.width, 0),
          1,
        ),
      };
    })
    .sort((left, right) => left.progress - right.progress);

  section.dataset.stepsAnimating = "true";

  let activatedCount = 0;
  let startTime = 0;

  const tick = (timestamp: number) => {
    if (startTime === 0) {
      startTime = timestamp;
    }

    const rawProgress = Math.min(
      (timestamp - startTime) / ANIMATION_DURATION_MS,
      1,
    );
    const progress = easeOutCubic(rawProgress);

    section.style.setProperty("--steps-timeline-progress", progress.toString());

    while (
      activatedCount < checkpoints.length &&
      progress >= checkpoints[activatedCount].progress
    ) {
      checkpoints[activatedCount]?.number.classList.add("is-activated");
      activatedCount += 1;
    }

    if (rawProgress < 1) {
      window.requestAnimationFrame(tick);
      return;
    }

    delete section.dataset.stepsAnimating;
    completeSectionAnimation(section, numbers);
  };

  window.requestAnimationFrame(tick);
};

export const initStepsSection = () => {
  const sections = document.querySelectorAll<HTMLElement>(SECTION_SELECTOR);
  const observers: IntersectionObserver[] = [];

  for (const section of sections) {
    if (section.dataset.stepsBound === "true") {
      if (section.dataset.stepsAnimated === "true") {
        section.style.setProperty("--steps-timeline-progress", "1");
        activateAllNumbers([
          ...section.querySelectorAll<HTMLElement>(NUMBER_SELECTOR),
        ]);
      }

      continue;
    }

    const numbers = [...section.querySelectorAll<HTMLElement>(NUMBER_SELECTOR)];

    if (
      !("IntersectionObserver" in window) ||
      !window.matchMedia(DESKTOP_QUERY).matches
    ) {
      if (window.matchMedia(DESKTOP_QUERY).matches) {
        completeSectionAnimation(section, numbers);
      }

      section.dataset.stepsBound = "true";
      continue;
    }

    if (window.matchMedia("(prefers-reduced-motion: reduce)").matches) {
      completeSectionAnimation(section, numbers);
      section.dataset.stepsBound = "true";
      continue;
    }

    const observer = new IntersectionObserver(
      (entries) => {
        for (const entry of entries) {
          if (!entry.isIntersecting) {
            continue;
          }

          animateSection(section);
          observer.disconnect();
        }
      },
      {
        threshold: 0.35,
      },
    );

    observer.observe(section);
    observers.push(observer);
    section.dataset.stepsBound = "true";
  }

  return () => {
    for (const observer of observers) {
      observer.disconnect();
    }
  };
};
