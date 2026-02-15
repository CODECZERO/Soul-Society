/**
 * Utility functions for wallet management
 */

declare global {
  interface Window {
    freighter?: {
      disconnect: () => Promise<void>;
    };
    clearStellarWallet?: () => void;
  }
}

export const clearWalletData = () => {
  if (typeof window === 'undefined') return;

  // Clear localStorage
  const storageKeys = [
    'wallet_connected',
    'wallet_type',
    'wallet_publicKey',
    'wallet_balance',
    'wallet_network',
    'wallet_address',
    'freighter:connected',
    'freighter:selectedWallet',
    'freighter:version'
  ];

  storageKeys.forEach(key => {
    try {
      localStorage.removeItem(key);
    } catch (error) {
      console.warn(`Error removing ${key} from localStorage:`, error);
    }
  });

  // Clear sessionStorage
  try {
    sessionStorage.clear();
  } catch (error) {
    console.warn('Error clearing sessionStorage:', error);
  }

  // Clear cookies
  const cookieOptions = 'path=/; expires=Thu, 01 Jan 1970 00:00:00 UTC;';
  const cookiesToClear = [
    'wallet_connected',
    'wallet_type',
    'wallet_address',
    'wallet_network',
    'freighter:auth',
    'freighter:connected',
    'freighter:selectedWallet'
  ];

  cookiesToClear.forEach(cookie => {
    try {
      document.cookie = `${cookie}=; ${cookieOptions}`;
    } catch (error) {
      console.warn(`Error clearing cookie ${cookie}:`, error);
    }
  });

  // Clear Freighter specific data
  if (window.freighter) {
    try {
      window.freighter.disconnect().catch(console.warn);
    } catch (error) {
      console.warn('Error disconnecting Freighter:', error);
    }
  }

  // Clear any event listeners
  try {
    window.removeEventListener('freighter:disconnect', clearWalletData);
  } catch (error) {
    console.warn('Error removing event listeners:', error);
  }

  // Clear any indexedDB data
  if (window.indexedDB) {
    try {
      const dbs = ['freighter', 'wallet-connector'];
      dbs.forEach(dbName => {
        window.indexedDB.deleteDatabase(dbName).catch(console.warn);
      });
    } catch (error) {
      console.warn('Error clearing IndexedDB:', error);
    }
  }
};

// Add a global function to clear all wallet data
if (typeof window !== 'undefined') {
  window.clearStellarWallet = clearWalletData;
}
