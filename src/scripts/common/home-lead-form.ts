import { setupDropdown } from "./dropdown";
import {
  getFormPayload,
  isTextInputValid,
  setFieldInvalidState,
} from "./form-state";
import { runOnPageLoad } from "./lifecycle";
import { bindPhoneInput, normalizePhoneDigits } from "./phone-mask";

type DropdownController = NonNullable<ReturnType<typeof setupDropdown>>;

const setDropdownPanelState = (root: HTMLElement, isOpen: boolean) => {
  const panel = root.closest<HTMLElement>(".lead-form-section__panel");
  const section = root.closest<HTMLElement>(".lead-form-section");

  if (panel) {
    panel.dataset.dropdownOpen = isOpen ? "true" : "false";
  }

  if (section) {
    section.dataset.dropdownOpen = isOpen ? "true" : "false";
  }
};

const resetLeadFormState = (
  section: HTMLElement,
  form: HTMLFormElement,
  dropdown: DropdownController | null,
) => {
  form.reset();
  form.dataset.state = "visible";
  form.dataset.animate = "true";

  section
    .querySelectorAll<HTMLElement>("[data-required-field]")
    .forEach((field) => {
      setFieldInvalidState(field, false);
    });

  dropdown?.reset();
};

const validateField = (
  field: HTMLElement,
  phoneInput: HTMLInputElement | null,
) => {
  if (field.matches(".lead-form-section__consent")) {
    const checkbox = field.querySelector<HTMLInputElement>(
      'input[type="checkbox"]',
    );
    const isValid = Boolean(checkbox?.checked);
    setFieldInvalidState(field, !isValid);
    return isValid;
  }

  const input = field.querySelector<HTMLInputElement>(
    'input:not([type="hidden"])',
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
      "[data-dropdown-input]",
    );
    const isValid = Boolean(dropdownInput?.value.trim());
    setFieldInvalidState(field, !isValid);
    return isValid;
  }

  return true;
};

const setupHomeLeadForm = () => {
  const cleanupTasks: Array<() => void> = [];

  const addListener = (
    target: EventTarget,
    type: string,
    listener: EventListener,
  ) => {
    target.addEventListener(type, listener);
    cleanupTasks.push(() => target.removeEventListener(type, listener));
  };

  for (const section of document.querySelectorAll(".lead-form-section")) {
    if (
      !(section instanceof HTMLElement) ||
      section.dataset.formBound === "true"
    ) {
      continue;
    }

    const form = section.querySelector<HTMLFormElement>("[data-lead-form]");
    const success = section.querySelector<HTMLElement>(
      "[data-lead-form-success]",
    );
    const successClose = section.querySelector<HTMLButtonElement>(
      "[data-lead-form-success-close]",
    );
    const phoneInput =
      section.querySelector<HTMLInputElement>("[data-lead-phone]");
    const dropdownRoot = section.querySelector<HTMLElement>(
      "[data-dropdown-root]",
    );

    if (
      !(form instanceof HTMLFormElement) ||
      !(success instanceof HTMLElement)
    ) {
      continue;
    }

    const dropdown = dropdownRoot
      ? setupDropdown(dropdownRoot, {
          outsideClickRoot: section,
          onOpenChange: (isOpen) => setDropdownPanelState(dropdownRoot, isOpen),
          onChange: () => setFieldInvalidState(dropdownRoot, false),
        })
      : null;

    if (dropdown) {
      cleanupTasks.push(dropdown.cleanup);
    }

    const showSuccessState = () => {
      delete form.dataset.animate;
      form.dataset.state = "hidden";
      success.dataset.state = "visible";
    };

    const showFormState = () => {
      success.dataset.state = "hidden";
      resetLeadFormState(section, form, dropdown);
    };

    addListener(form, "submit", ((event: SubmitEvent) => {
      event.preventDefault();

      let isValid = true;

      section
        .querySelectorAll<HTMLElement>(
          "[data-required-field], [data-validate-field]",
        )
        .forEach((field) => {
          if (!validateField(field, phoneInput ?? null)) {
            isValid = false;
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

    section
      .querySelectorAll<HTMLElement>(
        "[data-required-field], [data-validate-field]",
      )
      .forEach((field) => {
        const input = field.querySelector<HTMLInputElement>(
          'input:not([type="hidden"]):not([type="checkbox"])',
        );
        const checkbox = field.querySelector<HTMLInputElement>(
          'input[type="checkbox"]',
        );

        if (input) {
          addListener(input, "input", (() =>
            validateField(field, phoneInput ?? null)) as EventListener);
          addListener(input, "blur", (() =>
            validateField(field, phoneInput ?? null)) as EventListener);
        }

        if (checkbox) {
          addListener(checkbox, "change", (() =>
            validateField(field, phoneInput ?? null)) as EventListener);
        }
      });

    if (phoneInput) {
      cleanupTasks.push(bindPhoneInput(phoneInput));
    }

    section.dataset.formBound = "true";
    cleanupTasks.push(() => {
      delete section.dataset.formBound;
    });
  }

  return () => {
    for (const cleanup of cleanupTasks) {
      cleanup();
    }
  };
};

runOnPageLoad(setupHomeLeadForm);
