import { NativeModules, NativeEventEmitter, Platform } from 'react-native';

const { AccessibilityModule } = NativeModules;

export interface UssdDialogState {
  isOpen: boolean;
  lastText: string;
  lastEventTimestamp: number;
}

const eventEmitter = Platform.OS === 'android' ? new NativeEventEmitter(AccessibilityModule) : null;

export const AccessibilityBridge = {
  /**
   * Check if our accessibility service is active/enabled in system settings
   */
  isAccessibilityEnabled: async (): Promise<boolean> => {
    if (Platform.OS !== 'android') return false;
    try {
      return await AccessibilityModule.isAccessibilityEnabled();
    } catch (err) {
      console.error('[AccessibilityBridge] Error checking status:', err);
      return false;
    }
  },

  /**
   * Navigate to Android accessibility settings page
   */
  openAccessibilitySettings: async (): Promise<boolean> => {
    if (Platform.OS !== 'android') return false;
    try {
      return await AccessibilityModule.openAccessibilitySettings();
    } catch (err) {
      console.error('[AccessibilityBridge] Error opening settings:', err);
      return false;
    }
  },

  /**
   * Set the UPI PIN to be automatically filled when a USSD/MMI dialog opens
   */
  setAutoFillPin: async (pin: string, autoClickSend: boolean = true): Promise<boolean> => {
    if (Platform.OS !== 'android') return false;
    try {
      return await AccessibilityModule.setAutoFillPin(pin, autoClickSend);
    } catch (err) {
      console.error('[AccessibilityBridge] Error setting auto-fill pin:', err);
      return false;
    }
  },

  /**
   * Clear any scheduled auto-fill PIN data
   */
  clearAutoFillData: async (): Promise<boolean> => {
    if (Platform.OS !== 'android') return false;
    try {
      return await AccessibilityModule.clearAutoFillData();
    } catch (err) {
      console.error('[AccessibilityBridge] Error clearing autofill pin:', err);
      return false;
    }
  },

  /**
   * Fetch the current active USSD dialog details
   */
  getUssdDialogState: async (): Promise<UssdDialogState> => {
    if (Platform.OS !== 'android') return { isOpen: false, lastText: '', lastEventTimestamp: 0 };
    try {
      return await AccessibilityModule.getUssdDialogState();
    } catch (err) {
      return { isOpen: false, lastText: '', lastEventTimestamp: 0 };
    }
  },

  /**
   * Check if the accessibility service background process is alive
   */
  isServiceAlive: async (): Promise<boolean> => {
    if (Platform.OS !== 'android') return false;
    try {
      return await AccessibilityModule.isServiceAlive();
    } catch (err) {
      return false;
    }
  },

  /**
   * Register listeners for USSD/MMI dialog events
   */
  subscribeToUssdDialogs: (
    onDetected: (event: { text: string; hasInputField: boolean; timestamp: number }) => void,
    onDismissed: () => void,
    onAutoFillComplete?: (event: { success: boolean }) => void
  ) => {
    if (!eventEmitter) return () => {};

    const subDetected = eventEmitter.addListener('onUssdDialogDetected', onDetected);
    const subDismissed = eventEmitter.addListener('onUssdDialogDismissed', onDismissed);
    
    let subAutoFill: any = null;
    if (onAutoFillComplete) {
      subAutoFill = eventEmitter.addListener('onAutoFillComplete', onAutoFillComplete);
    }

    return () => {
      subDetected.remove();
      subDismissed.remove();
      if (subAutoFill) subAutoFill.remove();
    };
  }
};
