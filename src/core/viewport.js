// How big is the screen, really? In an installed app on iOS the browser can report
// a window shorter than the screen by exactly the status bar, even though the page
// is allowed to draw there. Trusting that number leaves a stripe along the bottom.
// Pure function, so it can be tested without a device.
export function measureViewport({ innerW, innerH, clientW = 0, clientH = 0, screenW = 0, screenH = 0, ios = false, standalone = false }) {
  // In a browser tab the toolbars are real: only the visible area is ours.
  if (!standalone) return { w: innerW, h: innerH };
  const w = Math.max(innerW, clientW);
  let h = Math.max(innerH, clientH);
  if (ios && screenW && screenH) {
    const landscape = w > h;
    const sw = landscape ? Math.max(screenW, screenH) : Math.min(screenW, screenH);
    const sh = landscape ? Math.min(screenW, screenH) : Math.max(screenW, screenH);
    // Only when the app owns the full width: in Split View or Stage Manager the
    // window is meant to be smaller than the screen.
    if (Math.abs(w - sw) <= 2 && sh > h && sh - h <= 80) h = sh;
  }
  return { w, h };
}
