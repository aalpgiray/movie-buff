"use client";

// Simple event system for cross-component communication
type EventCallback = () => void;

const listeners: Set<EventCallback> = new Set();

export function onWatchlistChange(callback: EventCallback) {
  listeners.add(callback);
  return () => listeners.delete(callback);
}

export function emitWatchlistChange() {
  listeners.forEach((callback) => callback());
}
