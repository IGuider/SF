import { setupDropdown } from "./dropdown";
import {
  formatAmountValue,
  getFormPayload,
  isTextInputValid,
  setFieldInvalidState,
} from "./form-state";
import { runOnPageLoad } from "./lifecycle";
import { bindPhoneInput, normalizePhoneDigits } from "./phone-mask";

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

  const dropdownRoot = dialog.querySelector<HTMLElement>(
    "[data-dropdown-root]",
  );
  const dropdown = dropdownRoot
    ? setupDropdown(dropdownRoot, {
        inputSelector: "#consultation-turnover",
        onChange: () => setFieldInvalidState(dropdownRoot, false),
      })
    : null;

  if (dropdown) {
    cleanupTasks.push(dropdown.cleanup);
  }

  const setDialogView = (view: "form" | "success") => {
    if (content) {
      content.dataset.state = view;
    }

    if (success) {
      success.dataset.state = view === "success" ? "visible" : "hidden";
    }
  };

  const resetFormState = () => {
    const form = dialog.querySelector<HTMLFormElement>("[data-dialog-form]");

    clearSuccessTimeout();
    setDialogView("form");
    form?.reset();

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

    dropdown?.reset();
  };

  const closeDialog = () => {
    if (!dialog.open || dialog.dataset.state === "closing") {
      return;
    }

    clearSuccessTimeout();
    clearCloseTimeout();
    dropdown?.close();
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

  const validateField = (field: HTMLElement) => {
    if (field.matches(".consultation-dialog__consent")) {
      const checkbox = field.querySelector<HTMLInputElement>(
        'input[type="checkbox"]',
      );
      const isValid = Boolean(checkbox?.checked);
      setFieldInvalidState(field, !isValid);
      return isValid;
    }

    const input = field.querySelector<HTMLInputElement>(
      'input:not([type="hidden"]):not([disabled])',
    );

    if (input) {
      const isPhoneField = input === phoneInput;
      const isPhoneValid =
        !isPhoneField || normalizePhoneDigits(input.value).length === 11;
      const isValid = isTextInputValid(input) && isPhoneValid;

      setFieldInvalidState(field, !isValid);
      return isValid;
    }

    if (field.matches("[data-dropdown-root]")) {
      const dropdownInput = field.querySelector<HTMLInputElement>(
        "#consultation-turnover",
      );
      const isValid = Boolean(dropdownInput?.value.trim());
      setFieldInvalidState(field, !isValid);
      return isValid;
    }

    return true;
  };

  const validateForm = () => {
    const requiredFields = dialog.querySelectorAll<HTMLElement>(
      "[data-required-field]",
    );
    let isValid = true;

    requiredFields.forEach((field) => {
      if (!validateField(field)) {
        isValid = false;
      }
    });

    return isValid;
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

  const form = dialog.querySelector<HTMLFormElement>("[data-dialog-form]");

  if (form && form.dataset.consultationBound !== "true") {
    addListener(form, "submit", ((event: SubmitEvent) => {
      event.preventDefault();

      if (!validateForm()) {
        return;
      }

      form.dispatchEvent(
        new CustomEvent("simplefinance:consultation-form-submit", {
          detail: getFormPayload(form),
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

  dialog
    .querySelectorAll<HTMLElement>("[data-required-field]")
    .forEach((field) => {
      if (field.dataset.validationBound === "true") {
        return;
      }

      const input = field.querySelector<HTMLInputElement>(
        'input:not([type="hidden"]):not([disabled])',
      );
      const checkbox = field.querySelector<HTMLInputElement>(
        'input[type="checkbox"]',
      );

      if (input && input !== checkbox) {
        addListener(input, "input", (() =>
          validateField(field)) as EventListener);
        addListener(input, "blur", (() =>
          validateField(field)) as EventListener);
      }

      if (checkbox) {
        addListener(checkbox, "change", (() =>
          validateField(field)) as EventListener);
      }

      field.dataset.validationBound = "true";
      cleanupTasks.push(() => {
        delete field.dataset.validationBound;
      });
    });

  if (phoneInput && phoneInput.dataset.consultationBound !== "true") {
    cleanupTasks.push(bindPhoneInput(phoneInput));
    phoneInput.dataset.consultationBound = "true";
    cleanupTasks.push(() => {
      delete phoneInput.dataset.consultationBound;
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

    const target = event.target;

    if (!(target instanceof Node)) {
      return;
    }

    if (dropdownRoot && !dropdownRoot.contains(target)) {
      dropdown?.close();
    }
  }) as EventListener);

  addListener(dialog, "cancel", ((event: Event) => {
    event.preventDefault();
    closeDialog();
  }) as EventListener);

  addListener(dialog, "close", (() => {
    resetFormState();
    dropdown?.close();
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
