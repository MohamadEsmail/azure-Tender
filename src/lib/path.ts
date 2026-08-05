// Tiny get/set for dot/bracket field paths like "meta.contract_no" or
// "events[3].attendance.max". Avoids pulling in lodash for two functions.

type Any = Record<string, unknown> | unknown[] | undefined;

function tokens(path: string): (string | number)[] {
  return path
    .replace(/\[(\d+)\]/g, ".$1")
    .split(".")
    .filter(Boolean)
    .map((t) => (/^\d+$/.test(t) ? Number(t) : t));
}

export function getPath<T = unknown>(obj: Any, path: string): T | undefined {
  let cur: unknown = obj;
  for (const t of tokens(path)) {
    if (cur == null || typeof cur !== "object") return undefined;
    cur = (cur as Record<string | number, unknown>)[t];
  }
  return cur as T | undefined;
}

/** Immutable set — returns a shallow-cloned copy with `path` set to `value`. */
export function setPath<T extends object>(obj: T, path: string, value: unknown): T {
  const parts = tokens(path);
  const root: Record<string | number, unknown> | unknown[] = Array.isArray(obj)
    ? [...obj]
    : { ...(obj as Record<string, unknown>) };
  let cur = root as Record<string | number, unknown>;

  for (let i = 0; i < parts.length - 1; i++) {
    const key = parts[i];
    const existing = cur[key];
    const clone = Array.isArray(existing)
      ? [...existing]
      : existing && typeof existing === "object"
        ? { ...(existing as Record<string, unknown>) }
        : typeof parts[i + 1] === "number"
          ? []
          : {};
    cur[key] = clone;
    cur = clone as Record<string | number, unknown>;
  }
  cur[parts[parts.length - 1]] = value;
  return root as unknown as T;
}
