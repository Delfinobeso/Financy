const PIN_KEY = "financy-pin";

async function hashPin(pin: string): Promise<string> {
  const encoder = new TextEncoder();
  const data = encoder.encode(pin + "financy-salt");
  const hashBuffer = await crypto.subtle.digest("SHA-256", data);
  const hashArray = Array.from(new Uint8Array(hashBuffer));
  return hashArray.map((b) => b.toString(16).padStart(2, "0")).join("");
}

export function getStoredHash(): string | null {
  if (typeof window === "undefined") return null;
  return localStorage.getItem(PIN_KEY);
}

export async function setPin(pin: string): Promise<void> {
  if (typeof window === "undefined") return;
  const hash = await hashPin(pin);
  localStorage.setItem(PIN_KEY, hash);
}

export function clearPin(): void {
  if (typeof window === "undefined") return;
  localStorage.removeItem(PIN_KEY);
}

export function isPinEnabled(): boolean {
  return getStoredHash() !== null;
}

export async function verifyPin(pin: string): Promise<boolean> {
  const stored = getStoredHash();
  if (!stored) return false;
  const hash = await hashPin(pin);
  return hash === stored;
}
