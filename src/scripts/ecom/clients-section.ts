import EmblaCarousel, { type EmblaCarouselType } from "embla-carousel";

const clientsMobileQuery = window.matchMedia("(max-width: 560px)");
const clientsEmblaMap = new WeakMap<
  HTMLElement,
  { embla: EmblaCarouselType; destroy: () => void }
>();
let clientsMediaQueryBound = false;

const getWrappedIndex = (index: number, count: number) =>
  ((index % count) + count) % count;

const getClientsNodes = (section: HTMLElement) => {
  const slider = section.querySelector("[data-clients-slider]");
  const slides = Array.from(section.querySelectorAll("[data-clients-slide]"));
  const paginationButtons = Array.from(
    section.querySelectorAll<HTMLButtonElement>(
      "[data-clients-pagination] .clients-section__pagination-button",
    ),
  );

  if (!(slider instanceof HTMLElement)) {
    return null;
  }

  return { slider, slides, paginationButtons };
};

const resetClientsState = (section: HTMLElement) => {
  const slides = section.querySelectorAll("[data-clients-slide]");
  const paginationButtons = section.querySelectorAll<HTMLButtonElement>(
    "[data-clients-pagination] .clients-section__pagination-button",
  );

  for (const [index, slide] of slides.entries()) {
    if (!(slide instanceof HTMLElement)) {
      continue;
    }

    slide.classList.remove("is-active", "is-prev", "is-next");
    slide.removeAttribute("aria-hidden");
    slide.tabIndex = index === 0 ? 0 : -1;
  }

  for (const [index, button] of paginationButtons.entries()) {
    button.classList.toggle("is-active", index === 0);
    button.setAttribute("aria-pressed", index === 0 ? "true" : "false");
  }
};

const updateClientsState = (section: HTMLElement, embla: EmblaCarouselType) => {
  const nodes = getClientsNodes(section);

  if (!nodes) {
    return;
  }

  const { slides, paginationButtons } = nodes;
  const slideCount = slides.length;
  const activeIndex = embla.selectedScrollSnap();
  const prevIndex = getWrappedIndex(activeIndex - 1, slideCount);
  const nextIndex = getWrappedIndex(activeIndex + 1, slideCount);

  for (const [index, slide] of slides.entries()) {
    if (!(slide instanceof HTMLElement)) {
      continue;
    }

    const isActive = index === activeIndex;
    slide.classList.toggle("is-active", isActive);
    slide.classList.toggle("is-prev", index === prevIndex);
    slide.classList.toggle("is-next", index === nextIndex);
    slide.setAttribute("aria-hidden", isActive ? "false" : "true");
    slide.tabIndex = isActive ? 0 : -1;
  }

  for (const [index, button] of paginationButtons.entries()) {
    const isActive = index === activeIndex;
    button.classList.toggle("is-active", isActive);
    button.setAttribute("aria-pressed", isActive ? "true" : "false");
  }
};

const syncClientsSections = () => {
  for (const section of document.querySelectorAll("[data-clients-section]")) {
    if (!(section instanceof HTMLElement)) {
      continue;
    }

    const nodes = getClientsNodes(section);
    if (!nodes) {
      continue;
    }

    const { slider, paginationButtons } = nodes;
    const existingEmbla = clientsEmblaMap.get(section);
    const slideCount = Number(section.dataset.clientsCount ?? "0");
    const hasMultipleSlides = slideCount > 1;

    if (!clientsMobileQuery.matches) {
      if (existingEmbla) {
        existingEmbla.destroy();
        clientsEmblaMap.delete(section);
      }

      resetClientsState(section);
      continue;
    }

    if (existingEmbla) {
      existingEmbla.embla.reInit({
        align: "center",
        containScroll: hasMultipleSlides ? false : "trimSnaps",
        dragFree: false,
        loop: hasMultipleSlides,
        slidesToScroll: 1,
        startIndex: 0,
        watchDrag: hasMultipleSlides,
      });
      updateClientsState(section, existingEmbla.embla);
      continue;
    }

    const embla = EmblaCarousel(slider, {
      align: "center",
      containScroll: hasMultipleSlides ? false : "trimSnaps",
      dragFree: false,
      loop: hasMultipleSlides,
      slidesToScroll: 1,
      startIndex: 0,
      watchDrag: hasMultipleSlides,
    });

    const syncState = () => updateClientsState(section, embla);
    const removeButtonListeners = paginationButtons.map((button, index) => {
      button.disabled = !hasMultipleSlides;

      const handleClick = () => {
        embla.scrollTo(index);
      };

      button.addEventListener("click", handleClick);

      return () => {
        button.removeEventListener("click", handleClick);
        button.disabled = false;
      };
    });

    embla.on("select", syncState);
    embla.on("reInit", syncState);

    syncState();

    clientsEmblaMap.set(section, {
      embla,
      destroy: () => {
        embla.off("select", syncState);
        embla.off("reInit", syncState);
        for (const removeListener of removeButtonListeners) {
          removeListener();
        }
        embla.destroy();
        resetClientsState(section);
      },
    });
  }
};

export const initClientsSection = () => {
  const boundSections: HTMLElement[] = [];

  for (const section of document.querySelectorAll("[data-clients-section]")) {
    if (!(section instanceof HTMLElement)) {
      continue;
    }

    if (section.dataset.clientsBound === "true") {
      continue;
    }

    section.dataset.clientsBound = "true";
    boundSections.push(section);
  }

  syncClientsSections();

  if (!clientsMediaQueryBound) {
    clientsMobileQuery.addEventListener("change", syncClientsSections);
    clientsMediaQueryBound = true;
  }

  return () => {
    for (const section of document.querySelectorAll("[data-clients-section]")) {
      if (!(section instanceof HTMLElement)) {
        continue;
      }

      const existingEmbla = clientsEmblaMap.get(section);

      if (existingEmbla) {
        existingEmbla.destroy();
        clientsEmblaMap.delete(section);
      }

      delete section.dataset.clientsBound;
    }

    for (const section of boundSections) {
      delete section.dataset.clientsBound;
    }

    if (clientsMediaQueryBound) {
      clientsMobileQuery.removeEventListener("change", syncClientsSections);
      clientsMediaQueryBound = false;
    }
  };
};
