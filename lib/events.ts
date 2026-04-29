// Simple event system for cross-component communication
// This module is only used by client components
type EventCallback = () => void;

const listeners: Set<EventCallback> = new Set();

export function onWatchlistChange(callback: EventCallback) {
  listeners.add(callback);
  return () => listeners.delete(callback);
}

export function emitWatchlistChange() {
  listeners.forEach((callback) => callback());
}
