import { initAccordionGroup } from "../common/accordion";

export const initFaqSections = () => {
  return initAccordionGroup({
    rootSelector: ".faq-section",
    itemSelector: ".faq-item",
    triggerSelector: ".faq-item__summary",
    panelSelector: ".faq-item__content",
    panelInnerSelector: ".faq-item__content-inner",
    openClass: "is-open",
  });
};
