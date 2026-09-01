let counter = 0;

/** Short, stable, collision-free ids for placements and log entries. */
export function nid(prefix: string): string {
  counter += 1;
  return `${prefix}_${Date.now().toString(36)}${counter.toString(36)}`;
}
