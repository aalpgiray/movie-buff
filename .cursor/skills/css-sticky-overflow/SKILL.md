---
name: css-sticky-overflow
description: Fixes position sticky not working with overflow. Use when sticky headers/elements fail to stick, when debugging overflow and sticky, or when implementing sticky table headers with horizontal scroll.
---

# CSS Position Sticky with Overflow

## Why Sticky Fails

`position: sticky` sticks relative to the **nearest scrolling ancestor**. Any ancestor with `overflow: auto`, `scroll`, `hidden`, or `overlay` creates a scroll container and traps the sticky element.

### Common Causes

1. **overflow-x: auto forces overflow-y: auto** — When you set `overflow-x: auto`, the CSS spec makes `overflow-y: auto` if it was visible. The wrapper becomes a scroll container.
2. **overflow-y: clip falls back to hidden** — `overflow-y: clip` does not create a scroll container, but older browsers (Safari < 16) fall back to `hidden`, which does.
3. **Ancestor overflow** — `main`, `body`, or any parent with overflow traps sticky.

## Solution: Header Outside Overflow

Keep the sticky element **outside** any overflow wrapper:

```
<div>                    <!-- No overflow -->
  <div class="sticky">   <!-- Sticky header, overflow-visible -->
    <div>...</div>       <!-- Inner content; use transform for horizontal sync -->
  </div>
  <div class="overflow-x-auto">  <!-- Body scrolls horizontally -->
    <div>...</div>
  </div>
</div>
```

### Horizontal Scroll Sync

When the body scrolls horizontally, mirror the header with `transform`:

```tsx
useEffect(() => {
  const header = headerRef.current;
  const body = bodyRef.current;
  if (!header || !body) return;
  const sync = () => {
    const inner = header.firstElementChild as HTMLElement | null;
    if (inner) inner.style.transform = `translateX(-${body.scrollLeft}px)`;
  };
  body.addEventListener("scroll", sync);
  sync(); // initial
  return () => body.removeEventListener("scroll", sync);
}, [deps]);
```

Apply `transform` to the **inner** element, not the sticky div (transform on the sticky element can create a new containing block).

## Quick Fixes

- **Explicit overflow-visible** — Add `overflow-visible` to `main`/`body` if they inherit or compute overflow.
- **Avoid overflow on sticky** — The sticky element itself should have `overflow-visible`; do not use `overflow-x: auto` on it (that forces overflow-y: auto).

## Debugging

Check computed styles: any ancestor with `overflow-y: auto`, `scroll`, or `hidden` between the sticky element and the viewport will break sticky. Walk up the DOM and log `getComputedStyle(el).overflowY` to find the culprit.
