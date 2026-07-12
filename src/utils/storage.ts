import AsyncStorage from '@react-native-async-storage/async-storage';

/**
 * Robust AsyncStorage wrapper that prevents concurrent write race conditions.
 * Uses a queue pattern to serialize writes.
 */

class StorageQueue {
  private queue: Array<() => Promise<void>> = [];
  private processing = false;

  public async run(task: () => Promise<void>): Promise<void> {
    return new Promise<void>((resolve, reject) => {
      this.queue.push(async () => {
        try {
          await task();
          resolve();
        } catch (error) {
          reject(error);
        }
      });
      this.processNext();
    });
  }

  private async processNext() {
    if (this.processing || this.queue.length === 0) return;
    this.processing = true;
    const task = this.queue.shift();
    if (task) {
      try {
        await task();
      } catch (err) {
        console.error('[StorageQueue] Error processing storage task:', err);
      }
    }
    this.processing = false;
    this.processNext();
  }
}

const writeQueue = new StorageQueue();

export const SafeStorage = {
  getItem: async (key: string): Promise<string | null> => {
    try {
      return await AsyncStorage.getItem(key);
    } catch (err) {
      console.error(`[SafeStorage] Error getting item for key ${key}:`, err);
      return null;
    }
  },

  setItem: async (key: string, value: string): Promise<void> => {
    return writeQueue.run(async () => {
      try {
        await AsyncStorage.setItem(key, value);
      } catch (err) {
        console.error(`[SafeStorage] Error setting item for key ${key}:`, err);
        throw err;
      }
    });
  },

  removeItem: async (key: string): Promise<void> => {
    return writeQueue.run(async () => {
      try {
        await AsyncStorage.removeItem(key);
      } catch (err) {
        console.error(`[SafeStorage] Error removing item for key ${key}:`, err);
        throw err;
      }
    });
  },

  clear: async (): Promise<void> => {
    return writeQueue.run(async () => {
      try {
        await AsyncStorage.clear();
      } catch (err) {
        console.error('[SafeStorage] Error clearing storage:', err);
        throw err;
      }
    });
  }
};
