export function normalizeCommunityNickname(value: string): string {
  return value.trim().replace(/\s+/gu, ' ').slice(0, 24);
}
