export function createTemporaryId(entity: 'member' | 'expense'): string {
  return `temp:${entity}:${crypto.randomUUID()}`;
}
