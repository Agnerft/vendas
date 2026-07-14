export function onlyDigits(value: string): string {
  return value.replace(/\D/g, '');
}

export function normalizeBrazilianPhone(value: string): string {
  const digits = onlyDigits(value);

  if (digits.startsWith('55')) {
    return digits;
  }

  return `55${digits}`;
}

export function isValidBrazilianPhone(value: string): boolean {
  const normalized = normalizeBrazilianPhone(value);
  const withoutCountry = normalized.startsWith('55')
    ? normalized.slice(2)
    : normalized;

  return normalized.length >= 12 && normalized.length <= 13 && withoutCountry.length >= 10 && withoutCountry.length <= 11;
}

export function formatBrazilianPhone(value: string): string {
  const digits = onlyDigits(value);
  const withoutCountry = digits.startsWith('55') ? digits.slice(2) : digits;
  const ddd = withoutCountry.slice(0, 2);
  const number = withoutCountry.slice(2);

  if (!ddd) {
    return '';
  }

  if (number.length <= 4) {
    return `(${ddd}) ${number}`;
  }

  if (number.length <= 8) {
    return `(${ddd}) ${number.slice(0, 4)}-${number.slice(4)}`;
  }

  return `(${ddd}) ${number.slice(0, 5)}-${number.slice(5, 9)}`;
}

export function maskBrazilianPhoneInput(value: string): string {
  const digits = onlyDigits(value).replace(/^55/, '').slice(0, 11);
  return formatBrazilianPhone(digits);
}

export function getPhoneFromSearch(search: string): string | null {
  const params = new URLSearchParams(search);
  const rawPhone = params.get('telefone') ?? params.get('phone') ?? params.get('numero');

  if (!rawPhone) {
    return null;
  }

  const normalized = normalizeBrazilianPhone(rawPhone);
  return isValidBrazilianPhone(normalized) ? normalized : null;
}
