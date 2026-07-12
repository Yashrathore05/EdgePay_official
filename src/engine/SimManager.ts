import { NativeModules, PermissionsAndroid, Platform } from 'react-native';

const { SimManagerModule } = NativeModules;

export interface SimInfo {
  slotIndex: number;
  subscriptionId: number;
  carrierName: string;
  displayName: string;
  iccId: string;
  number: string;
  mcc: number;
  mnc: number;
  countryIso: string;
  isEmbedded: boolean;
}

export interface PreferredSim {
  slotIndex: number;
  subscriptionId: number;
}

export const SimManager = {
  /**
   * Request necessary SIM permissions
   */
  requestPermissions: async (): Promise<boolean> => {
    if (Platform.OS !== 'android') return false;
    
    try {
      const perms = [
        PermissionsAndroid.PERMISSIONS.READ_PHONE_STATE,
      ];
      
      // READ_PHONE_NUMBERS is needed on API 30+ to get actual numbers if available
      if (Platform.Version >= 30 && PermissionsAndroid.PERMISSIONS.READ_PHONE_NUMBERS) {
        perms.push(PermissionsAndroid.PERMISSIONS.READ_PHONE_NUMBERS);
      }

      const results = await PermissionsAndroid.requestMultiple(perms);
      const phoneStateGranted = results[PermissionsAndroid.PERMISSIONS.READ_PHONE_STATE] === PermissionsAndroid.RESULTS.GRANTED;
      
      return phoneStateGranted;
    } catch (err) {
      console.error('[SimManager] Error requesting permissions:', err);
      return false;
    }
  },

  /**
   * Fetch all available SIM cards present in the device
   */
  getAvailableSims: async (): Promise<SimInfo[]> => {
    if (Platform.OS !== 'android') return [];
    try {
      const permitted = await SimManager.requestPermissions();
      if (!permitted) {
        console.warn('[SimManager] READ_PHONE_STATE permission denied');
        return [];
      }
      return await SimManagerModule.getAvailableSims();
    } catch (err) {
      console.error('[SimManager] Error fetching active sims:', err);
      return [];
    }
  },

  /**
   * Save the preferred SIM slot and subscriptionId
   */
  setPreferredSim: async (slotIndex: number, subscriptionId: number): Promise<boolean> => {
    if (Platform.OS !== 'android') return false;
    try {
      const res = await SimManagerModule.setPreferredSim(slotIndex, subscriptionId);
      return res.saved;
    } catch (err) {
      console.error('[SimManager] Error setting preferred sim:', err);
      return false;
    }
  },

  /**
   * Get the preferred SIM slot and subscriptionId
   */
  getPreferredSim: async (): Promise<PreferredSim | null> => {
    if (Platform.OS !== 'android') return null;
    try {
      return await SimManagerModule.getPreferredSim();
    } catch (err) {
      console.error('[SimManager] Error getting preferred sim:', err);
      return null;
    }
  },

  /**
   * Send USSD command using the specified SIM's subscriptionId
   */
  sendUssdOnSim: async (ussdCode: string, subscriptionId: number): Promise<any> => {
    if (Platform.OS !== 'android') throw new Error('Unsupported platform');
    return await SimManagerModule.sendUssdOnSim(ussdCode, subscriptionId);
  },

  /**
   * Dial USSD code directly via Telecom dialer on selected SIM
   */
  dialUssdOnSim: async (ussdCode: string): Promise<any> => {
    if (Platform.OS !== 'android') throw new Error('Unsupported platform');
    return await SimManagerModule.dialUssdOnSim(ussdCode);
  },

  /**
   * Get the number of active SIMs
   */
  getSimCount: async (): Promise<number> => {
    if (Platform.OS !== 'android') return 0;
    try {
      return await SimManagerModule.getSimCount();
    } catch (err) {
      return 0;
    }
  }
};
