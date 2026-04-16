const normalizePhoneDigits = (value: string) => {
	const digits = value.replace(/\D/g, '');

	if (!digits) {
		return '';
	}

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

	if (!digits) {
		return '';
	}

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
	if (digitIndex <= 0) {
		return 0;
	}

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

const removePhoneDigit = (input: HTMLInputElement, direction: 'backward' | 'forward') => {
	const selectionStart = input.selectionStart ?? input.value.length;
	const selectionEnd = input.selectionEnd ?? selectionStart;
	const digits = normalizePhoneDigits(input.value);

	if (!digits) {
		return;
	}

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

		if (startDigitIndex <= 1) {
			return;
		}

		nextDigits = `${digits.slice(0, removeIndex)}${digits.slice(removeIndex + 1)}`;
		caretDigitIndex = removeIndex;
	} else {
		const removeIndex = Math.max(1, startDigitIndex);

		if (removeIndex >= digits.length) {
			return;
		}

		nextDigits = `${digits.slice(0, removeIndex)}${digits.slice(removeIndex + 1)}`;
		caretDigitIndex = removeIndex;
	}

	input.value = formatPhoneValue(nextDigits);

	window.requestAnimationFrame(() => {
		const nextCursor = getCursorFromDigitIndex(input.value, caretDigitIndex);
		input.setSelectionRange(nextCursor, nextCursor);
	});
};

const setFieldInvalidState = (field: HTMLElement | null, isInvalid: boolean) => {
	if (!field) {
		return;
	}

	field.dataset.invalid = isInvalid ? 'true' : 'false';
};

const closeDropdown = (root: HTMLElement) => {
	const trigger = root.querySelector<HTMLElement>('[data-dropdown-trigger]');
	const menu = root.querySelector<HTMLElement>('[data-dropdown-menu]');

	if (!trigger || !menu) {
		return;
	}

	trigger.setAttribute('aria-expanded', 'false');
	menu.dataset.state = 'closed';
	menu.setAttribute('aria-hidden', 'true');
};

const syncSelectedDropdownOption = (root: HTMLElement, value: string) => {
	root.querySelectorAll<HTMLElement>('[data-dropdown-option]').forEach((option) => {
		option.dataset.selected = option.dataset.value === value ? 'true' : 'false';
	});
};

const validateField = (field: HTMLElement, phoneInput: HTMLInputElement | null) => {
	if (field.matches('.lead-form-section__consent')) {
		const checkbox = field.querySelector<HTMLInputElement>('input[type="checkbox"]');
		const isValid = Boolean(checkbox?.checked);
		setFieldInvalidState(field, !isValid);
		return isValid;
	}

	const input = field.querySelector<HTMLInputElement>('input:not([type="hidden"])');

	if (input) {
		const isPhoneField = input === phoneInput;
		const hasValue = input.value.trim().length > 0;
		const isPhoneValid = !isPhoneField || normalizePhoneDigits(input.value).length === 11;
		const isValid = hasValue && isPhoneValid;
		setFieldInvalidState(field, !isValid);
		return isValid;
	}

	if (field.matches('[data-dropdown-root]')) {
		const dropdownInput = field.querySelector<HTMLInputElement>('[data-dropdown-input]');
		const isValid = Boolean(dropdownInput?.value.trim());
		setFieldInvalidState(field, !isValid);
		return isValid;
	}

	return true;
};

const setupHomeLeadForm = () => {
	for (const section of document.querySelectorAll('.lead-form-section')) {
		if (!(section instanceof HTMLElement) || section.dataset.formBound === 'true') {
			continue;
		}

		const form = section.querySelector<HTMLFormElement>('[data-lead-form]');
		const content = section.querySelector<HTMLElement>('[data-lead-form-content]');
		const success = section.querySelector<HTMLElement>('[data-lead-form-success]');
		const phoneInput = section.querySelector<HTMLInputElement>('[data-lead-phone]');
		const dropdownRoot = section.querySelector<HTMLElement>('[data-dropdown-root]');
		const dropdownTrigger = section.querySelector<HTMLElement>('[data-dropdown-trigger]');
		const dropdownMenu = section.querySelector<HTMLElement>('[data-dropdown-menu]');
		const dropdownLabel = section.querySelector<HTMLElement>('[data-dropdown-label]');
		const dropdownInput = section.querySelector<HTMLInputElement>('[data-dropdown-input]');

		if (!(form instanceof HTMLFormElement) || !(content instanceof HTMLElement) || !(success instanceof HTMLElement)) {
			continue;
		}

		const showSuccessState = () => {
			content.dataset.state = 'success';
			success.dataset.state = 'visible';
		};

		form.addEventListener('submit', (event) => {
			event.preventDefault();

			let isValid = true;

			section.querySelectorAll<HTMLElement>('[data-required-field]').forEach((field) => {
				if (!validateField(field, phoneInput ?? null)) {
					isValid = false;
				}
			});

			if (!isValid) {
				return;
			}

			showSuccessState();
			form.reset();
		});

		section.querySelectorAll<HTMLElement>('[data-required-field]').forEach((field) => {
			const input = field.querySelector<HTMLInputElement>('input:not([type="hidden"]):not([type="checkbox"])');
			const checkbox = field.querySelector<HTMLInputElement>('input[type="checkbox"]');

			if (input) {
				input.addEventListener('input', () => validateField(field, phoneInput ?? null));
				input.addEventListener('blur', () => validateField(field, phoneInput ?? null));
			}

			if (checkbox) {
				checkbox.addEventListener('change', () => validateField(field, phoneInput ?? null));
			}
		});

		if (
			dropdownRoot &&
			dropdownTrigger &&
			dropdownMenu &&
			dropdownLabel &&
			dropdownInput
		) {
			dropdownTrigger.addEventListener('click', () => {
				const isExpanded = dropdownTrigger.getAttribute('aria-expanded') === 'true';

				if (isExpanded) {
					closeDropdown(dropdownRoot);
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
					syncSelectedDropdownOption(dropdownRoot, value);
					closeDropdown(dropdownRoot);
				});
			});

			section.addEventListener('click', (event) => {
				const target = event.target;

				if (!(target instanceof Node) || dropdownRoot.contains(target)) {
					return;
				}

				closeDropdown(dropdownRoot);
			});
		}

		if (phoneInput) {
			phoneInput.addEventListener('input', () => {
				phoneInput.value = formatPhoneValue(phoneInput.value);
			});

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
		}

		section.dataset.formBound = 'true';
	}
};

setupHomeLeadForm();
document.addEventListener('astro:after-swap', setupHomeLeadForm);
