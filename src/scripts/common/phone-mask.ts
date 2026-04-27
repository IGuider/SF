export const normalizePhoneDigits = (value: string) => {
  const digits = value.replace(/\D/g, "");

  if (!digits) {
    return "";
  }

  if (digits[0] === "8") {
    return `7${digits.slice(1, 11)}`;
  }

  if (digits[0] === "7") {
    return digits.slice(0, 11);
  }

  return `7${digits.slice(0, 10)}`;
};

export const formatPhoneValue = (value: string) => {
  const digits = normalizePhoneDigits(value);

  if (!digits) {
    return "";
  }

  const localDigits = digits.slice(1);
  const parts = [
    localDigits.slice(0, 3),
    localDigits.slice(3, 6),
    localDigits.slice(6, 8),
    localDigits.slice(8, 10),
  ].filter(Boolean);

  let formatted = "+7";

  if (parts[0]) {
    formatted += ` (${parts[0]}`;

    if (parts[0].length === 3) {
      formatted += ")";
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
  value.slice(0, cursor).replace(/\D/g, "").length;

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

const removePhoneDigit = (
  input: HTMLInputElement,
  direction: "backward" | "forward",
) => {
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
  } else if (direction === "backward") {
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

export const bindPhoneInput = (input: HTMLInputElement) => {
  const handleInput = () => {
    input.value = formatPhoneValue(input.value);
  };

  const handleKeydown = (event: KeyboardEvent) => {
    if (event.key === "Backspace") {
      const selectionStart = input.selectionStart ?? 0;
      const previousCharacter = input.value[selectionStart - 1] ?? "";

      if (
        selectionStart !== (input.selectionEnd ?? selectionStart) ||
        /\D/.test(previousCharacter)
      ) {
        event.preventDefault();
        removePhoneDigit(input, "backward");
      }
    }

    if (event.key === "Delete") {
      const selectionStart = input.selectionStart ?? 0;
      const nextCharacter = input.value[selectionStart] ?? "";

      if (
        selectionStart !== (input.selectionEnd ?? selectionStart) ||
        /\D/.test(nextCharacter)
      ) {
        event.preventDefault();
        removePhoneDigit(input, "forward");
      }
    }
  };

  const handleFocus = () => {
    if (!input.value.trim()) {
      input.value = "+7";
    }
  };

  const handleBlur = () => {
    if (input.value === "+7") {
      input.value = "";
    }
  };

  input.addEventListener("input", handleInput);
  input.addEventListener("keydown", handleKeydown);
  input.addEventListener("focus", handleFocus);
  input.addEventListener("blur", handleBlur);

  return () => {
    input.removeEventListener("input", handleInput);
    input.removeEventListener("keydown", handleKeydown);
    input.removeEventListener("focus", handleFocus);
    input.removeEventListener("blur", handleBlur);
  };
};
