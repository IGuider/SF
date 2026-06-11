const VISIBLE_DOCUMENTS_LIMIT = 5;
const DOCUMENT_REVEALED_CLASS = "documents-page__document--revealed";

export const initDocumentsLists = () => {
  const groups = Array.from(
    document.querySelectorAll<HTMLElement>(".documents-page__group"),
  );

  groups.forEach((group) => {
    if (group.dataset.documentsListBound === "true") {
      return;
    }

    const list = group.querySelector<HTMLElement>("[data-documents-list]");
    const button = group.querySelector<HTMLButtonElement>(
      "[data-documents-show-more]",
    );

    if (!list || !button) {
      return;
    }

    const documents = Array.from(
      list.querySelectorAll<HTMLElement>(".documents-page__document"),
    );

    if (documents.length <= VISIBLE_DOCUMENTS_LIMIT) {
      button.hidden = true;
      return;
    }

    group.dataset.documentsListBound = "true";
    group.dataset.documentsCollapsed = "true";

    const hiddenDocuments = documents.slice(VISIBLE_DOCUMENTS_LIMIT);
    hiddenDocuments.forEach((documentItem) => {
      documentItem.classList.remove(DOCUMENT_REVEALED_CLASS);
      documentItem.hidden = true;
    });

    button.addEventListener("click", () => {
      group.dataset.documentsCollapsed = "false";

      hiddenDocuments.forEach((documentItem, index) => {
        documentItem.style.setProperty("--documents-reveal-index", String(index));
        documentItem.hidden = false;
        documentItem.classList.add(DOCUMENT_REVEALED_CLASS);
      });

      button.hidden = true;
    });
  });
};
