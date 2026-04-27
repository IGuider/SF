export const setFieldInvalidState = (
  field: HTMLElement | null,
  isInvalid: boolean,
) => {
  if (!field) {
    return;
  }

  field.dataset.invalid = isInvalid ? "true" : "false";
};

export const formatAmountValue = (value: string) => {
  const digits = value.replace(/\D/g, "");

  if (!digits) {
    return "";
  }

  return new Intl.NumberFormat("ru-RU").format(Number(digits));
};

export const isTextInputValid = (input: HTMLInputElement) => {
  const value = input.value.trim();

  if (input.required && !value) {
    return false;
  }

  if (!value) {
    return true;
  }

  return input.validity.valid;
};

export const getFormPayload = (form: HTMLFormElement) => {
  const payload: Record<string, string | boolean> = {};
  const formData = new FormData(form);

  for (const [name, value] of formData.entries()) {
    if (typeof value === "string") {
      payload[name] = value.trim();
    }
  }

  form
    .querySelectorAll<HTMLInputElement>('input[type="checkbox"][name]')
    .forEach((checkbox) => {
      payload[checkbox.name] = checkbox.checked;
    });

  return payload;
};
