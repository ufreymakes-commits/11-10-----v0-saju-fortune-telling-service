/**
 * Strict email format validator.
 *
 * Unlike a loose "has an @ and a dot" check, this requires:
 * - a valid local part (letters, digits, and common symbols, no spaces)
 * - a domain made of one or more labels separated by single dots
 *   (no leading/trailing/double dots, no leading/trailing hyphens in a label)
 * - a final top-level domain of at least 2 letters (e.g. .com, .co, .io)
 *
 * This rejects things like "test", "test@domain", "test@domain.c",
 * "test@@domain.com", and "test@domain..com" while still accepting
 * real-world addresses.
 */
export const EMAIL_REGEX =
  /^[a-zA-Z0-9.!#$%&'*+/=?^_`{|}~-]+@[a-zA-Z0-9](?:[a-zA-Z0-9-]{0,61}[a-zA-Z0-9])?(?:\.[a-zA-Z0-9](?:[a-zA-Z0-9-]{0,61}[a-zA-Z0-9])?)*\.[a-zA-Z]{2,}$/

export function isValidEmail(value: string): boolean {
  const trimmed = value.trim()
  return trimmed.length > 0 && trimmed.length <= 254 && EMAIL_REGEX.test(trimmed)
}
