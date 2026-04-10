const triggerSelector = '.consultation-dialog-trigger';
const closeAnimationDuration = 220;
const successAutoCloseDelay = 3000;

const formatAmountValue = (value: string) => {
  const digits = value.replace(/\D/g, '');
  if (!digits) return '';

  return new Intl.NumberFormat('ru-RU').format(Number(digits));
};

const readAmountFromSource = (selector: string) => {
  const source = document.querySelector<HTMLInputElement>(selector);
  if (!source) return '';

  if ('value' in source && typeof source.value === 'string') {
    return source.value.trim();
  }

  return source.textContent?.trim() ?? '';
};

const normalizePhoneDigits = (value: string) => {
  const digits = value.replace(/\D/g, '');

  if (!digits) return '';

  if (digits[0] === '8') {
    return `7${digits.slice(1, 11)}`;
  }

  if (digits[0] === '7') {
    return digits.slice(0, 11);
  }

  return `7${digits.slice(0, 10)}`;
};

const formatPhoneValue = (value: string) => {
  const digits = normalizePhoneDigits(value);

  if (!digits) return '';

  const localDigits = digits.slice(1);
  const parts = [
    localDigits.slice(0, 3),
    localDigits.slice(3, 6),
    localDigits.slice(6, 8),
    localDigits.slice(8, 10),
  ].filter(Boolean);

  let formatted = '+7';

  if (parts[0]) {
    formatted += ` (${parts[0]}`;
    if (parts[0].length === 3) {
      formatted += ')';
    }
  }

  if (parts[1]) {
    formatted += ` ${parts[1]}`;
  }

  if (parts[2]) {
    formatted += `-${parts[2]}`;
  }

  if (parts[3]) {
    formatted += `-${parts[3]}`;
  }

  return formatted;
};

const countDigitsBeforeCursor = (value: string, cursor: number) =>
  value.slice(0, cursor).replace(/\D/g, '').length;

const getCursorFromDigitIndex = (value: string, digitIndex: number) => {
  if (digitIndex <= 0) return 0;

  let seenDigits = 0;
  for (let index = 0; index < value.length; index += 1) {
    if (/\d/.test(value[index])) {
      seenDigits += 1;

      if (seenDigits >= digitIndex) {
        return index + 1;
      }
    }
  }

  return value.length;
};

const setupConsultationDialog = () => {
  const dialog = document.querySelector<HTMLDialogElement>('#consultation-dialog');
  const amountInput = document.querySelector<HTMLInputElement>('#consultation-amount');
  const phoneInput = document.querySelector<HTMLInputElement>('#consultation-phone');
  const content = dialog?.querySelector<HTMLElement>('[data-dialog-content]');
  const success = dialog?.querySelector<HTMLElement>('[data-dialog-success]');

  if (!dialog) return;

  let successTimeoutId: number | null = null;

  const clearSuccessTimeout = () => {
    if (successTimeoutId === null) return;
    window.clearTimeout(successTimeoutId);
    successTimeoutId = null;
  };

  const setDialogView = (view: 'form' | 'success') => {
    if (content) {
      content.dataset.state = view;
    }

    if (success) {
      success.dataset.state = view === 'success' ? 'visible' : 'hidden';
    }
  };

  const resetFormState = () => {
    const form = dialog.querySelector<HTMLFormElement>('[data-dialog-form]');
    const dropdownRoot = dialog.querySelector<HTMLElement>('[data-dropdown-root]');
    const dropdownLabel = dialog.querySelector<HTMLElement>('[data-dropdown-label]');
    const dropdownInput = dialog.querySelector<HTMLInputElement>('#consultation-turnover');

    clearSuccessTimeout();
    setDialogView('form');
    form?.reset();

    if (phoneInput) {
      phoneInput.value = '';
    }

    if (amountInput) {
      amountInput.value = formatAmountValue(amountInput.value);
    }

    if (dropdownInput) {
      dropdownInput.value = '';
    }

    if (dropdownLabel) {
      dropdownLabel.textContent = '';
    }

    if (dropdownRoot) {
      dropdownRoot.dataset.hasValue = 'false';
      setFieldInvalidState(dropdownRoot, false);
    }

    dialog.querySelectorAll<HTMLElement>('[data-required-field]').forEach((field) => {
      setFieldInvalidState(field, false);
    });

    syncSelectedDropdownOption('');
    closeDropdown();
  };

  const showSuccessState = () => {
    setDialogView('success');
    clearSuccessTimeout();
    successTimeoutId = window.setTimeout(() => {
      closeDialog();
    }, successAutoCloseDelay);
  };

  const applyTriggerState = (trigger: HTMLElement) => {
    if (!amountInput) return;

    const amountSourceSelector = trigger.dataset.consultationAmountSource;
    amountInput.value = amountSourceSelector
      ? formatAmountValue(readAmountFromSource(amountSourceSelector))
      : '';
  };

  const applyPhoneMask = (input: HTMLInputElement) => {
    input.value = formatPhoneValue(input.value);
  };

  const removePhoneDigit = (
    input: HTMLInputElement,
    direction: 'backward' | 'forward',
  ) => {
    const selectionStart = input.selectionStart ?? input.value.length;
    const selectionEnd = input.selectionEnd ?? selectionStart;
    const digits = normalizePhoneDigits(input.value);

    if (!digits) return;

    const startDigitIndex = countDigitsBeforeCursor(input.value, selectionStart);
    const endDigitIndex = countDigitsBeforeCursor(input.value, selectionEnd);

    let nextDigits = digits;
    let caretDigitIndex = startDigitIndex;

    if (selectionStart !== selectionEnd) {
      const removeFrom = Math.max(1, startDigitIndex);
      const removeTo = Math.max(removeFrom, endDigitIndex);
      nextDigits = `${digits.slice(0, removeFrom)}${digits.slice(removeTo)}`;
      caretDigitIndex = removeFrom;
    } else if (direction === 'backward') {
      const removeIndex = Math.max(1, startDigitIndex - 1);
      if (startDigitIndex <= 1) return;
      nextDigits = `${digits.slice(0, removeIndex)}${digits.slice(removeIndex + 1)}`;
      caretDigitIndex = removeIndex;
    } else {
      const removeIndex = Math.max(1, startDigitIndex);
      if (removeIndex >= digits.length) return;
      nextDigits = `${digits.slice(0, removeIndex)}${digits.slice(removeIndex + 1)}`;
      caretDigitIndex = removeIndex;
    }

    input.value = formatPhoneValue(nextDigits);

    window.requestAnimationFrame(() => {
      const nextCursor = getCursorFromDigitIndex(input.value, caretDigitIndex);
      input.setSelectionRange(nextCursor, nextCursor);
    });
  };

  const closeDropdown = () => {
    const dropdownTrigger = dialog.querySelector<HTMLElement>('[data-dropdown-trigger]');
    const dropdownMenu = dialog.querySelector<HTMLElement>('[data-dropdown-menu]');

    if (!dropdownTrigger || !dropdownMenu) return;

    dropdownTrigger.setAttribute('aria-expanded', 'false');
    dropdownMenu.dataset.state = 'closed';
    dropdownMenu.setAttribute('aria-hidden', 'true');
  };

  const openDialog = (trigger: HTMLElement) => {
    resetFormState();
    applyTriggerState(trigger);
    dialog.dataset.state = 'open';
    dialog.showModal();
    document.body.classList.add('consultation-dialog-open');
  };

  const closeDialog = () => {
    if (!dialog.open) return;
    if (dialog.dataset.state === 'closing') return;

    clearSuccessTimeout();
    closeDropdown();
    dialog.dataset.state = 'closing';

    window.setTimeout(() => {
      dialog.close();
      dialog.dataset.state = 'closed';
      document.body.classList.remove('consultation-dialog-open');
    }, closeAnimationDuration);
  };

  const syncSelectedDropdownOption = (value: string) => {
    dialog.querySelectorAll<HTMLElement>('[data-dropdown-option]').forEach((option) => {
      option.dataset.selected = option.dataset.value === value ? 'true' : 'false';
    });
  };

  const setFieldInvalidState = (field: HTMLElement | null, isInvalid: boolean) => {
    if (!field) return;
    field.dataset.invalid = isInvalid ? 'true' : 'false';
  };

  const validateField = (field: HTMLElement) => {
    if (field.matches('.consultation-dialog__consent')) {
      const checkbox = field.querySelector<HTMLInputElement>('input[type="checkbox"]');
      const isValid = Boolean(checkbox?.checked);
      setFieldInvalidState(field, !isValid);
      return isValid;
    }

    const input = field.querySelector<HTMLInputElement>('input:not([type="hidden"]):not([disabled])');

    if (input) {
      const isPhoneField = input === phoneInput;
      const hasValue = input.value.trim().length > 0;
      const isPhoneValid = !isPhoneField || normalizePhoneDigits(input.value).length === 11;
      const isValid = hasValue && isPhoneValid;

      setFieldInvalidState(field, !isValid);
      return isValid;
    }

    if (field.matches('[data-dropdown-root]')) {
      const dropdownInput = field.querySelector<HTMLInputElement>('#consultation-turnover');
      const isValid = Boolean(dropdownInput?.value.trim());
      setFieldInvalidState(field, !isValid);
      return isValid;
    }

    return true;
  };

  const validateForm = () => {
    const requiredFields = dialog.querySelectorAll<HTMLElement>('[data-required-field]');
    let isValid = true;

    requiredFields.forEach((field) => {
      if (!validateField(field)) {
        isValid = false;
      }
    });

    return isValid;
  };

  document.querySelectorAll<HTMLElement>(triggerSelector).forEach((trigger) => {
    if (trigger.dataset.consultationBound === 'true') return;

    const clickable =
      trigger.firstElementChild instanceof HTMLElement ? trigger.firstElementChild : trigger;

    clickable.addEventListener('click', () => openDialog(trigger));
    trigger.dataset.consultationBound = 'true';
  });

  dialog.querySelectorAll<HTMLElement>('[data-dialog-close]').forEach((button) => {
    if (button.dataset.consultationBound === 'true') return;
    button.addEventListener('click', closeDialog);
    button.dataset.consultationBound = 'true';
  });

  const form = dialog.querySelector<HTMLFormElement>('[data-dialog-form]');
  if (form && form.dataset.consultationBound !== 'true') {
    form.addEventListener('submit', (event) => {
      event.preventDefault();

      if (!validateForm()) {
        return;
      }

      showSuccessState();
    });
    form.dataset.consultationBound = 'true';
  }

  dialog.querySelectorAll<HTMLElement>('[data-required-field]').forEach((field) => {
    if (field.dataset.validationBound === 'true') return;

    const input = field.querySelector<HTMLInputElement>('input:not([type="hidden"]):not([disabled])');
    const checkbox = field.querySelector<HTMLInputElement>('input[type="checkbox"]');

    if (input && input !== checkbox) {
      input.addEventListener('input', () => {
        validateField(field);
      });
      input.addEventListener('blur', () => {
        validateField(field);
      });
    }

    if (checkbox) {
      checkbox.addEventListener('change', () => {
        validateField(field);
      });
    }

    field.dataset.validationBound = 'true';
  });

  if (phoneInput && phoneInput.dataset.consultationBound !== 'true') {
    phoneInput.addEventListener('input', () => applyPhoneMask(phoneInput));
    phoneInput.addEventListener('keydown', (event) => {
      if (event.key === 'Backspace') {
        const selectionStart = phoneInput.selectionStart ?? 0;
        const previousCharacter = phoneInput.value[selectionStart - 1] ?? '';

        if (
          selectionStart !== (phoneInput.selectionEnd ?? selectionStart) ||
          /\D/.test(previousCharacter)
        ) {
          event.preventDefault();
          removePhoneDigit(phoneInput, 'backward');
        }
      }

      if (event.key === 'Delete') {
        const selectionStart = phoneInput.selectionStart ?? 0;
        const nextCharacter = phoneInput.value[selectionStart] ?? '';

        if (
          selectionStart !== (phoneInput.selectionEnd ?? selectionStart) ||
          /\D/.test(nextCharacter)
        ) {
          event.preventDefault();
          removePhoneDigit(phoneInput, 'forward');
        }
      }
    });
    phoneInput.addEventListener('focus', () => {
      if (!phoneInput.value.trim()) {
        phoneInput.value = '+7';
      }
    });
    phoneInput.addEventListener('blur', () => {
      if (phoneInput.value === '+7') {
        phoneInput.value = '';
      }
    });
    phoneInput.dataset.consultationBound = 'true';
  }

  if (amountInput && amountInput.dataset.consultationBound !== 'true') {
    amountInput.addEventListener('input', () => {
      amountInput.value = formatAmountValue(amountInput.value);
    });
    amountInput.dataset.consultationBound = 'true';
  }

  const dropdownRoot = dialog.querySelector<HTMLElement>('[data-dropdown-root]');
  const dropdownTrigger = dialog.querySelector<HTMLElement>('[data-dropdown-trigger]');
  const dropdownMenu = dialog.querySelector<HTMLElement>('[data-dropdown-menu]');
  const dropdownLabel = dialog.querySelector<HTMLElement>('[data-dropdown-label]');
  const dropdownInput = dialog.querySelector<HTMLInputElement>('#consultation-turnover');

  if (
    dropdownRoot &&
    dropdownTrigger &&
    dropdownMenu &&
    dropdownLabel &&
    dropdownInput &&
    dropdownTrigger.dataset.consultationBound !== 'true'
  ) {
    dropdownTrigger.addEventListener('click', () => {
      const isExpanded = dropdownTrigger.getAttribute('aria-expanded') === 'true';
      if (isExpanded) {
        closeDropdown();
        return;
      }

      dropdownTrigger.setAttribute('aria-expanded', 'true');
      dropdownMenu.dataset.state = 'open';
      dropdownMenu.setAttribute('aria-hidden', 'false');
    });

    dropdownMenu.querySelectorAll<HTMLElement>('[data-dropdown-option]').forEach((option) => {
      option.addEventListener('click', () => {
        const value = option.dataset.value ?? '';
        dropdownInput.value = value;
        dropdownLabel.textContent = value;
        dropdownRoot.dataset.hasValue = value ? 'true' : 'false';
        setFieldInvalidState(dropdownRoot, false);
        syncSelectedDropdownOption(value);
        closeDropdown();
      });
    });

    syncSelectedDropdownOption(dropdownInput.value);
    dropdownTrigger.dataset.consultationBound = 'true';
  }

  dialog.addEventListener('click', (event) => {
    if (event.target === dialog) {
      closeDialog();
      return;
    }

    const target = event.target;
    if (!(target instanceof Node)) return;

    if (dropdownRoot && !dropdownRoot.contains(target)) {
      closeDropdown();
    }
  });

  dialog.addEventListener('cancel', (event) => {
    event.preventDefault();
    closeDialog();
  });

  dialog.addEventListener('close', () => {
    resetFormState();
    closeDropdown();
    dialog.dataset.state = 'closed';
    document.body.classList.remove('consultation-dialog-open');
  });
};

setupConsultationDialog();
document.addEventListener('astro:after-swap', setupConsultationDialog);
