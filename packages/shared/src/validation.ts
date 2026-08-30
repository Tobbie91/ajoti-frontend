export const PERSON_NAME_REGEX = /^[\p{L}\p{M}]+(?:[ '\-][\p{L}\p{M}]+)*$/u;

export const PHONE_RULES: Record<
  string,
  { nationalLength: number; example: string }
> = {
  "+234": { nationalLength: 10, example: "8012345678" },
  "+1": { nationalLength: 10, example: "2025550123" },
  "+44": { nationalLength: 10, example: "7400123456" },
  "+233": { nationalLength: 9, example: "241234567" },
  "+254": { nationalLength: 9, example: "712345678" },
  "+27": { nationalLength: 9, example: "821234567" },
};

export function formatCalendarDate(value: Date): string {
  const year = value.getFullYear();
  const month = String(value.getMonth() + 1).padStart(2, "0");
  const day = String(value.getDate()).padStart(2, "0");
  return `${year}-${month}-${day}`;
}

export function parseCalendarDate(value: string): Date | null {
  if (!/^\d{4}-\d{2}-\d{2}$/.test(value)) return null;
  const [year, month, day] = value.split("-").map(Number);
  const date = new Date(0);
  date.setHours(0, 0, 0, 0);
  date.setFullYear(year, month - 1, day);
  if (
    date.getFullYear() !== year ||
    date.getMonth() !== month - 1 ||
    date.getDate() !== day
  )
    return null;
  return date;
}

export function parseDisplayCalendarDate(value: string): Date | null {
  const match = /^(\d{2})\/(\d{2})\/(\d{4})$/.exec(value.trim());
  if (!match) return null;

  const [, dayText, monthText, yearText] = match;
  return parseCalendarDate(`${yearText}-${monthText}-${dayText}`);
}

export function latestAdultDob(minimumAge = 18, today = new Date()): Date {
  return new Date(
    today.getFullYear() - minimumAge,
    today.getMonth(),
    today.getDate(),
  );
}

export function earliestReasonableDob(
  maximumAge = 120,
  today = new Date(),
): Date {
  return new Date(
    today.getFullYear() - maximumAge,
    today.getMonth(),
    today.getDate(),
  );
}

export function isAdultDob(
  value: Date | null,
  minimumAge = 18,
  today = new Date(),
): boolean {
  return Boolean(value && value <= latestAdultDob(minimumAge, today));
}

export function validatePersonName(
  value: string,
  label: string,
): string | undefined {
  const normalized = value.trim().normalize("NFC");
  if (!normalized) return `${label} is required.`;
  if (normalized.length < 2 || normalized.length > 30)
    return `${label} must be between 2 and 30 characters.`;
  if (!PERSON_NAME_REGEX.test(normalized))
    return `${label} can only contain letters, spaces, hyphens, or apostrophes.`;
  return undefined;
}

export function validatePhone(value: string): string | undefined {
  if (!value) return "Phone number is required.";
  const code = Object.keys(PHONE_RULES).find((candidate) =>
    value.startsWith(candidate),
  );
  if (!code) return "Select a supported country code.";
  const national = value.slice(code.length);
  const rule = PHONE_RULES[code];
  if (!/^\d+$/.test(national) || national.length !== rule.nationalLength) {
    return `Enter ${rule.nationalLength} digits after ${code}, e.g. ${code}${rule.example}.`;
  }
  return undefined;
}

export function normalizePhoneForComparison(value: string): string {
  const digits = value.replace(/\D/g, "");
  if (digits.startsWith("234"))
    return `+234${digits.slice(3).replace(/^0+/, "")}`;
  if (digits.startsWith("0")) return `+234${digits.replace(/^0+/, "")}`;
  return `+${digits}`;
}
