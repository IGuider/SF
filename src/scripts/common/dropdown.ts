type DropdownConfig = {
  inputSelector?: string;
  triggerSelector?: string;
  menuSelector?: string;
  labelSelector?: string;
  optionSelector?: string;
  outsideClickRoot?: HTMLElement;
  onOpenChange?: (isOpen: boolean) => void;
  onChange?: (value: string) => void;
};

const DEFAULT_INPUT_SELECTOR = "[data-dropdown-input]";
const DEFAULT_TRIGGER_SELECTOR = "[data-dropdown-trigger]";
const DEFAULT_MENU_SELECTOR = "[data-dropdown-menu]";
const DEFAULT_LABEL_SELECTOR = "[data-dropdown-label]";
const DEFAULT_OPTION_SELECTOR = "[data-dropdown-option]";

export const setupDropdown = (
  root: HTMLElement,
  config: DropdownConfig = {},
) => {
  const input = root.querySelector<HTMLInputElement>(
    config.inputSelector ?? DEFAULT_INPUT_SELECTOR,
  );
  const trigger = root.querySelector<HTMLElement>(
    config.triggerSelector ?? DEFAULT_TRIGGER_SELECTOR,
  );
  const menu = root.querySelector<HTMLElement>(
    config.menuSelector ?? DEFAULT_MENU_SELECTOR,
  );
  const label = root.querySelector<HTMLElement>(
    config.labelSelector ?? DEFAULT_LABEL_SELECTOR,
  );
  const options = [
    ...root.querySelectorAll<HTMLElement>(
      config.optionSelector ?? DEFAULT_OPTION_SELECTOR,
    ),
  ];

  if (!input || !trigger || !menu || !label) {
    return null;
  }

  const syncSelectedOption = (value: string) => {
    for (const option of options) {
      option.dataset.selected =
        option.dataset.value === value ? "true" : "false";
    }
  };

  const setOpen = (isOpen: boolean) => {
    trigger.setAttribute("aria-expanded", String(isOpen));
    menu.dataset.state = isOpen ? "open" : "closed";
    menu.setAttribute("aria-hidden", String(!isOpen));
    config.onOpenChange?.(isOpen);
  };

  const close = () => setOpen(false);

  const setValue = (value: string) => {
    input.value = value;
    label.textContent = value;
    root.dataset.hasValue = value ? "true" : "false";
    syncSelectedOption(value);
    config.onChange?.(value);
  };

  const handleTriggerClick = () => {
    const isExpanded = trigger.getAttribute("aria-expanded") === "true";
    setOpen(!isExpanded);
  };

  const optionCleanups = options.map((option) => {
    const handleOptionClick = () => {
      setValue(option.dataset.value ?? "");
      close();
    };

    option.addEventListener("click", handleOptionClick);

    return () => option.removeEventListener("click", handleOptionClick);
  });

  const handleOutsideClick = (event: Event) => {
    const target = event.target;

    if (!(target instanceof Node) || root.contains(target)) {
      return;
    }

    close();
  };

  trigger.addEventListener("click", handleTriggerClick);

  if (config.outsideClickRoot) {
    config.outsideClickRoot.addEventListener("click", handleOutsideClick);
  }

  syncSelectedOption(input.value);

  return {
    close,
    reset: () => {
      setValue("");
      close();
    },
    syncSelectedOption,
    cleanup: () => {
      trigger.removeEventListener("click", handleTriggerClick);

      for (const cleanup of optionCleanups) {
        cleanup();
      }

      if (config.outsideClickRoot) {
        config.outsideClickRoot.removeEventListener(
          "click",
          handleOutsideClick,
        );
      }
    },
  };
};
