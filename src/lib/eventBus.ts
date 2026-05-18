type Listener = (detail?: unknown) => void;

const bus: Record<string, Set<Listener>> = {};

export function emit(event: string, detail?: unknown) {
  const listeners = bus[event];
  if (!listeners) return;
  listeners.forEach(fn => fn(detail));
}

export function on(event: string, fn: Listener) {
  if (!bus[event]) bus[event] = new Set();
  bus[event].add(fn);
  return () => {
    bus[event]?.delete(fn);
  };
}
