import { Haptics, ImpactStyle, NotificationType } from '@capacitor/haptics';

/**
 * Run a haptics call defensively. The Haptics plugin throws or rejects on
 * platforms without native support (desktop browser, jsdom). We never let a
 * haptics failure surface to the UI.
 */
async function safe(run: () => Promise<void>): Promise<void> {
  try {
    await run();
  } catch {
    /* haptics unavailable (web/desktop) — silently ignore */
  }
}

/** Light tactical tap. Use for secondary actions (e.g. Save tap). */
export function triggerLightImpact(): void {
  void safe(() => Haptics.impact({ style: ImpactStyle.Light }));
}

/** Success notification buzz. Use when a set/action completes. */
export function triggerSuccess(): void {
  void safe(() => Haptics.notification({ type: NotificationType.Success }));
}

/** Selection-changed tick. Use when switching a selected item (e.g. date). */
export function triggerSelection(): void {
  void safe(() => Haptics.selectionChanged());
}
