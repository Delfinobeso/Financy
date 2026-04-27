const PIN_KEY = "financy-pin";

export function getPin(): string | null {
  if (typeof window === "undefined") return null;
  return localStorage.getItem(PIN_KEY);
}

export function setPin(pin: string): void {
  if (typeof window === "undefined") return;
  localStorage.setItem(PIN_KEY, pin);
}

export function clearPin(): void {
  if (typeof window === "undefined") return;
  localStorage.removeItem(PIN_KEY);
}

export function isPinEnabled(): boolean {
  return getPin() !== null;
}

export function verifyPin(pin: string): boolean {
  return getPin() === pin;
}
