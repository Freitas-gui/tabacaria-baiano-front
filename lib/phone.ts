export function unmaskPhone(value: string): string {
  return value.replace(/\D/g, "");
}

export function formatBrazilianPhone(value: string): string {
  const digits = unmaskPhone(value).slice(0, 11);

  if (digits.length <= 2) {
    return digits;
  }

  if (digits.length <= 6) {
    return `${digits.slice(0, 2)} ${digits.slice(2)}`;
  }

  if (digits.length <= 10) {
    return `${digits.slice(0, 2)} ${digits.slice(2, 6)}-${digits.slice(6)}`;
  }

  return `${digits.slice(0, 2)} ${digits.slice(2, 6)}-${digits.slice(6)}`;
}

export function isValidBrazilianPhone(value: string): boolean {
  const digits = unmaskPhone(value);
  return digits.length === 10 || digits.length === 11;
}
