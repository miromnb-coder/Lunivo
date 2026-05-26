import * as Haptics from 'expo-haptics';

const DEFAULT_COOLDOWN_MS = 140;
const SUCCESS_COOLDOWN_MS = 450;

const lastRunByKey = new Map<string, number>();

function canRun(key: string, cooldownMs = DEFAULT_COOLDOWN_MS) {
  const now = Date.now();
  const lastRun = lastRunByKey.get(key) ?? 0;

  if (now - lastRun < cooldownMs) {
    return false;
  }

  lastRunByKey.set(key, now);
  return true;
}

async function safeHaptic(key: string, callback: () => Promise<void>, cooldownMs?: number) {
  if (!canRun(key, cooldownMs)) {
    return;
  }

  try {
    await callback();
  } catch {
    // Haptics should never interrupt the user flow.
  }
}

export const lunivoHaptics = {
  selection() {
    return safeHaptic('selection', () => Haptics.selectionAsync());
  },

  openDrawer() {
    return safeHaptic('drawer', () => Haptics.selectionAsync());
  },

  closeDrawer() {
    return safeHaptic('drawer', () => Haptics.selectionAsync());
  },

  selectConversation() {
    return safeHaptic('select-conversation', () => Haptics.selectionAsync());
  },

  newChat() {
    return safeHaptic('new-chat', () => Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Soft));
  },

  sendMessage() {
    return safeHaptic('send-message', () => Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light));
  },

  messageComplete() {
    return safeHaptic(
      'message-complete',
      () => Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success),
      SUCCESS_COOLDOWN_MS,
    );
  },

  error() {
    return safeHaptic(
      'error',
      () => Haptics.notificationAsync(Haptics.NotificationFeedbackType.Warning),
      SUCCESS_COOLDOWN_MS,
    );
  },
};