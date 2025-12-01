export const toNumberOrNull = (value: string) => {
  if (!value) return null;
  const parsed = Number(value);
  return Number.isNaN(parsed) ? null : parsed;
};

export const toOptionalString = (value: string) => {
  const trimmed = value.trim();
  return trimmed ? trimmed : null;
};

export const sanitizeNotes = (notes: string | null) => {
  if (!notes) {
    return null;
  }
  const trimmed = notes.trim();
  return trimmed.length ? trimmed : null;
};

