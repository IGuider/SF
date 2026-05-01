import {
  formatAmountValue,
  setFieldInvalidState,
} from "./form-state";
import { runOnPageLoad } from "./lifecycle";

const triggerSelector = ".consultation-dialog-trigger";
const closeAnimationDuration = 220;
const successAutoCloseDelay = 3000;

const readAmountFromSource = (selector: string) => {
  const source = document.querySelector<HTMLInputElement>(selector);

  if (!source) {
    return "";
  }

  if ("value" in source && typeof source.value === "string") {
    return source.value.trim();
  }

  return source.textContent?.trim() ?? "";
};

const setupConsultationDialog = () => {
  const cleanupTasks: Array<() => void> = [];

  const addListener = (
    target: EventTarget,
    type: string,
    listener: EventListener,
  ) => {
    target.addEventListener(type, listener);
    cleanupTasks.push(() => target.removeEventListener(type, listener));
  };

  const dialog = document.querySelector<HTMLDialogElement>(
    "#consultation-dialog",
  );
  const amountInput = document.querySelector<HTMLInputElement>(
    "#consultation-amount",
  );
  const phoneInput = document.querySelector<HTMLInputElement>(
    "#consultation-phone",
  );
  const content = dialog?.querySelector<HTMLElement>("[data-dialog-content]");
  const success = dialog?.querySelector<HTMLElement>("[data-dialog-success]");

  if (!dialog) {
    return;
  }

  let successTimeoutId: number | null = null;
  let closeTimeoutId: number | null = null;

  const clearSuccessTimeout = () => {
    if (successTimeoutId === null) {
      return;
    }

    window.clearTimeout(successTimeoutId);
    successTimeoutId = null;
  };

  const clearCloseTimeout = () => {
    if (closeTimeoutId === null) {
      return;
    }

    window.clearTimeout(closeTimeoutId);
    closeTimeoutId = null;
  };

  const setDialogView = (view: "form" | "success") => {
    if (content) {
      content.dataset.state = view;
    }

    if (success) {
      success.dataset.state = view === "success" ? "visible" : "hidden";
    }
  };

  const resetFormState = () => {
    const form = dialog.querySelector<HTMLFormElement>("[data-lead-form]");

    clearSuccessTimeout();
    setDialogView("form");

    if (form) {
      form.reset();
      form.dataset.state = "visible";
      delete form.dataset.animate;
    }

    if (phoneInput) {
      phoneInput.value = "";
    }

    if (amountInput) {
      amountInput.value = formatAmountValue(amountInput.value);
    }

    dialog
      .querySelectorAll<HTMLElement>("[data-required-field]")
      .forEach((field) => {
        setFieldInvalidState(field, false);
      });
  };

  const closeDialog = () => {
    if (!dialog.open || dialog.dataset.state === "closing") {
      return;
    }

    clearSuccessTimeout();
    clearCloseTimeout();
    dialog.dataset.state = "closing";

    closeTimeoutId = window.setTimeout(() => {
      dialog.close();
      dialog.dataset.state = "closed";
      document.body.classList.remove("consultation-dialog-open");
      closeTimeoutId = null;
    }, closeAnimationDuration);
  };

  const showSuccessState = () => {
    setDialogView("success");
    clearSuccessTimeout();
    successTimeoutId = window.setTimeout(closeDialog, successAutoCloseDelay);
  };

  const applyTriggerState = (trigger: HTMLElement) => {
    if (!amountInput) {
      return;
    }

    const amountSourceSelector = trigger.dataset.consultationAmountSource;
    amountInput.value = amountSourceSelector
      ? formatAmountValue(readAmountFromSource(amountSourceSelector))
      : "";
  };

  const openDialog = (trigger: HTMLElement) => {
    resetFormState();
    applyTriggerState(trigger);
    dialog.dataset.state = "open";
    dialog.showModal();
    document.body.classList.add("consultation-dialog-open");
  };

  document.querySelectorAll<HTMLElement>(triggerSelector).forEach((trigger) => {
    if (trigger.dataset.consultationBound === "true") {
      return;
    }

    const clickable =
      trigger.firstElementChild instanceof HTMLElement
        ? trigger.firstElementChild
        : trigger;
    const handleTriggerClick = () => openDialog(trigger);

    clickable.addEventListener("click", handleTriggerClick);
    cleanupTasks.push(() => {
      clickable.removeEventListener("click", handleTriggerClick);
      delete trigger.dataset.consultationBound;
    });
    trigger.dataset.consultationBound = "true";
  });

  dialog
    .querySelectorAll<HTMLElement>("[data-dialog-close]")
    .forEach((button) => {
      if (button.dataset.consultationBound === "true") {
        return;
      }

      button.addEventListener("click", closeDialog);
      cleanupTasks.push(() => {
        button.removeEventListener("click", closeDialog);
        delete button.dataset.consultationBound;
      });
      button.dataset.consultationBound = "true";
    });

  const form = dialog.querySelector<HTMLFormElement>("[data-lead-form]");

  if (form && form.dataset.consultationBound !== "true") {
    addListener(form, "simplefinance:lead-form-submit", ((event: Event) => {
      const detail =
        event instanceof CustomEvent && typeof event.detail === "object"
          ? event.detail
          : {};
      form.dispatchEvent(
        new CustomEvent("simplefinance:consultation-form-submit", {
          detail,
          bubbles: true,
        }),
      );
      showSuccessState();
    }) as EventListener);

    form.dataset.consultationBound = "true";
    cleanupTasks.push(() => {
      delete form.dataset.consultationBound;
    });
  }

  if (amountInput && amountInput.dataset.consultationBound !== "true") {
    const handleAmountInput = () => {
      amountInput.value = formatAmountValue(amountInput.value);
    };

    amountInput.addEventListener("input", handleAmountInput);
    amountInput.dataset.consultationBound = "true";
    cleanupTasks.push(() => {
      amountInput.removeEventListener("input", handleAmountInput);
      delete amountInput.dataset.consultationBound;
    });
  }

  addListener(dialog, "click", ((event: MouseEvent) => {
    if (event.target === dialog) {
      closeDialog();
      return;
    }

  }) as EventListener);

  addListener(dialog, "cancel", ((event: Event) => {
    event.preventDefault();
    closeDialog();
  }) as EventListener);

  addListener(dialog, "close", (() => {
    resetFormState();
    dialog.dataset.state = "closed";
    document.body.classList.remove("consultation-dialog-open");
  }) as EventListener);

  return () => {
    clearSuccessTimeout();
    clearCloseTimeout();

    for (const cleanup of cleanupTasks) {
      cleanup();
    }

    document.body.classList.remove("consultation-dialog-open");
  };
};

runOnPageLoad(setupConsultationDialog);
