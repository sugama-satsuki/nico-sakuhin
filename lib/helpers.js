export const PLACEHOLDERS = ['🌸', '🌈', '🚀', '🐟', '🎨', '⭐', '🦋', '🌻', '🍀'];

export function formatDate(dateStr) {
  const d = new Date(dateStr);
  return `${d.getFullYear()}年${d.getMonth() + 1}月${d.getDate()}日`;
}

export function getPlaceholder(index) {
  return PLACEHOLDERS[index % PLACEHOLDERS.length];
}
