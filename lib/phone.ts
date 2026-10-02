export function unmaskPhone(value: string): string {
  return value.replace(/\D/g, "");
}

/**
 * Masks a Brazilian phone progressively as the user types:
 * "(73" → "(73) 9910" → "(73) 9910-0046" (landline) → "(73) 99100-0465" (mobile).
 */
export function formatBrazilianPhone(value: string): string {
  let digits = unmaskPhone(value);
  // Autofill/paste may bring the +55 country code; the store only ships in Brazil.
  if (digits.length > 11 && digits.startsWith("55")) {
    digits = digits.slice(2);
  }
  digits = digits.slice(0, 11);

  if (digits.length === 0) {
    return "";
  }

  if (digits.length <= 2) {
    return `(${digits}`;
  }

  const ddd = digits.slice(0, 2);
  const number = digits.slice(2);

  if (number.length <= 4) {
    return `(${ddd}) ${number}`;
  }

  const splitAt = number.length === 9 ? 5 : 4;
  return `(${ddd}) ${number.slice(0, splitAt)}-${number.slice(splitAt)}`;
}

export function isValidBrazilianPhone(value: string): boolean {
  const digits = unmaskPhone(value);
  return digits.length === 10 || digits.length === 11;
}
