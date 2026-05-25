export type FormErrors<T extends string> = Partial<Record<T, string>>;

const emailPattern = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;

export function isValidEmail(value: string) {
  return emailPattern.test(value.trim());
}

export function isValidPhilippinePhone(value: string) {
  const normalized = value.replace(/[\s-]/g, '');

  return /^09\d{9}$/.test(normalized) || /^\+639\d{9}$/.test(normalized);
}

export function isValidEmailOrPhone(value: string) {
  return isValidEmail(value) || isValidPhilippinePhone(value);
}

export function isSixDigitOtp(value: string) {
  return /^\d{6}$/.test(value.trim());
}

export function required(value: string) {
  return value.trim().length > 0;
}
