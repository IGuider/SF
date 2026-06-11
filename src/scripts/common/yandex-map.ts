const MAP_FRAME_SELECTOR = "[data-yandex-map-frame]";

export const initYandexMap = () => {
  const frame = document.querySelector<HTMLElement>(MAP_FRAME_SELECTOR);

  if (!frame || frame.dataset.yandexMapBound === "true") {
    return;
  }

  const src = frame.dataset.yandexMapSrc;

  if (!src) {
    return;
  }

  frame.dataset.yandexMapBound = "true";
  frame.replaceChildren();

  const script = document.createElement("script");
  script.type = "text/javascript";
  script.charset = "utf-8";
  script.async = true;
  script.src = src;
  frame.append(script);

  return () => {
    delete frame.dataset.yandexMapBound;
    frame.replaceChildren();
  };
};
