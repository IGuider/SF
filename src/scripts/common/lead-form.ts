import { setupDropdown } from "./dropdown";
import {
  getFormPayload,
  isTextInputValid,
  setFieldInvalidState,
} from "./form-state";
import { runOnPageLoad } from "./lifecycle";
import { bindPhoneInput, normalizePhoneDigits } from "./phone-mask";

type DropdownController = NonNullable<ReturnType<typeof setupDropdown>>;

const getValidationFields = (root: HTMLElement) =>
  root.querySelectorAll<HTMLElement>(
    "[data-required-field], [data-validate-field]",
  );

const setDropdownPanelState = (
  root: HTMLElement,
  dropdownRoot: HTMLElement,
  isOpen: boolean,
) => {
  const panel =
    dropdownRoot.closest<HTMLElement>("[data-lead-form-panel]") ??
    root.querySelector<HTMLElement>("[data-lead-form-panel]");

  root.dataset.dropdownOpen = isOpen ? "true" : "false";

  if (panel) {
    panel.dataset.dropdownOpen = isOpen ? "true" : "false";
  }
};

const resetLeadFormState = (
  root: HTMLElement,
  form: HTMLFormElement,
  dropdowns: DropdownController[],
) => {
  form.reset();
  form.dataset.state = "visible";
  form.dataset.animate = "true";

  getValidationFields(root).forEach((field) => {
    setFieldInvalidState(field, false);
  });

  dropdowns.forEach((dropdown) => dropdown.reset());
};

const validateField = (field: HTMLElement) => {
  const checkbox = field.querySelector<HTMLInputElement>(
    'input[type="checkbox"][required]',
  );

  if (checkbox) {
    const isValid = checkbox.checked;
    setFieldInvalidState(field, !isValid);
    return isValid;
  }

  const dropdownInput =
    field.querySelector<HTMLInputElement>("[data-dropdown-input]");

  if (dropdownInput) {
    const isValid = Boolean(dropdownInput.value.trim());
    setFieldInvalidState(field, !isValid);
    return isValid;
  }

  const input = field.querySelector<HTMLInputElement>(
    'input:not([type="hidden"]):not([type="checkbox"])',
  );

  if (input) {
    const isPhoneField = input.matches("[data-lead-phone]");
    const isPhoneValid =
      !isPhoneField || normalizePhoneDigits(input.value).length === 11;
    const isValid = isTextInputValid(input) && isPhoneValid;
    setFieldInvalidState(field, !isValid);
    return isValid;
  }

  return true;
};

const triggerInvalidFieldAnimation = (field: HTMLElement) => {
  delete field.dataset.shake;
  void field.offsetWidth;
  field.dataset.shake = "true";
  window.setTimeout(() => {
    delete field.dataset.shake;
  }, 420);
};

export const setupLeadForms = () => {
  const cleanupTasks: Array<() => void> = [];

  const addListener = (
    target: EventTarget,
    type: string,
    listener: EventListener,
  ) => {
    target.addEventListener(type, listener);
    cleanupTasks.push(() => target.removeEventListener(type, listener));
  };

  for (const root of document.querySelectorAll<HTMLElement>(
    "[data-lead-form-root]",
  )) {
    if (root.dataset.leadFormBound === "true") {
      continue;
    }

    const form = root.querySelector<HTMLFormElement>("[data-lead-form]");
    const success = root.querySelector<HTMLElement>(
      "[data-lead-form-success]",
    );
    const successClose = root.querySelector<HTMLButtonElement>(
      "[data-lead-form-success-close]",
    );

    if (!(form instanceof HTMLFormElement)) {
      continue;
    }

    const dropdowns: DropdownController[] = [];

    root.querySelectorAll<HTMLElement>("[data-dropdown-root]").forEach(
      (dropdownRoot) => {
        const dropdown = setupDropdown(dropdownRoot, {
          outsideClickRoot: root,
          onOpenChange: (isOpen) =>
            setDropdownPanelState(root, dropdownRoot, isOpen),
          onChange: () => setFieldInvalidState(dropdownRoot, false),
        });

        if (!dropdown) {
          return;
        }

        dropdowns.push(dropdown);
        cleanupTasks.push(dropdown.cleanup);
      },
    );

    const showSuccessState = () => {
      if (!success) {
        return;
      }

      delete form.dataset.animate;
      form.dataset.state = "hidden";
      success.dataset.state = "visible";
    };

    const showFormState = () => {
      if (success) {
        success.dataset.state = "hidden";
      }

      resetLeadFormState(root, form, dropdowns);
    };

    addListener(form, "submit", ((event: SubmitEvent) => {
      event.preventDefault();

      let isValid = true;

      getValidationFields(root).forEach((field) => {
        if (!validateField(field)) {
          isValid = false;
          triggerInvalidFieldAnimation(field);
        }
      });

      if (!isValid) {
        return;
      }

      form.dispatchEvent(
        new CustomEvent("simplefinance:lead-form-submit", {
          detail: getFormPayload(form),
          bubbles: true,
        }),
      );
      showSuccessState();
    }) as EventListener);

    if (successClose) {
      addListener(successClose, "click", showFormState as EventListener);
    }

    addListener(form, "animationend", ((event: AnimationEvent) => {
      if (event.animationName !== "lead-form-form-enter") {
        return;
      }

      delete form.dataset.animate;
    }) as EventListener);

    getValidationFields(root).forEach((field) => {
      const input = field.querySelector<HTMLInputElement>(
        'input:not([type="hidden"]):not([type="checkbox"])',
      );
      const checkbox = field.querySelector<HTMLInputElement>(
        'input[type="checkbox"]',
      );

      if (input) {
        addListener(input, "input", (() =>
          validateField(field)) as EventListener);
        addListener(input, "blur", (() =>
          validateField(field)) as EventListener);
      }

      if (checkbox) {
        addListener(checkbox, "change", (() =>
          validateField(field)) as EventListener);
      }
    });

    root.querySelectorAll<HTMLInputElement>("[data-lead-phone]").forEach(
      (phoneInput) => {
        if (phoneInput.dataset.phoneMaskBound === "true") {
          return;
        }

        cleanupTasks.push(bindPhoneInput(phoneInput));
        phoneInput.dataset.phoneMaskBound = "true";
        cleanupTasks.push(() => {
          delete phoneInput.dataset.phoneMaskBound;
        });
      },
    );

    root.dataset.leadFormBound = "true";
    cleanupTasks.push(() => {
      delete root.dataset.leadFormBound;
    });
  }

  return () => {
    for (const cleanup of cleanupTasks) {
      cleanup();
    }
  };
};

runOnPageLoad(setupLeadForms);
