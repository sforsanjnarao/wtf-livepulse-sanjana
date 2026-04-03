import React, { useState } from 'react';

export function GymSelector() {
  // We use a local import to avoid circular deps
  const [, forceRender] = useState(0);
  void forceRender;
  return null; // replaced inline in Dashboard
}

// Named export for use in other files — the real implementation is inline in Dashboard
export { GymSelector as GymSelectorBase };
