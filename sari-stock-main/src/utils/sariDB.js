const DB_NAME = 'sariDatabase';
const DB_VERSION = 2;
const SARIS_STORE_NAME = 'saris';
const HISTORY_STORE_NAME = 'sariHistory';

let db;

// Function to open the database
const openDatabase = () => {
  return new Promise((resolve, reject) => {
    const request = indexedDB.open(DB_NAME, DB_VERSION);

    request.onupgradeneeded = (event) => {
      db = event.target.result;
      // Create saris object store if it doesn't exist (from v1)
      if (!db.objectStoreNames.contains(SARIS_STORE_NAME)) {
        db.createObjectStore(SARIS_STORE_NAME, { keyPath: 'id' });
        console.log(`${SARIS_STORE_NAME} object store created.`);
      }

      // Create history object store if it doesn't exist (new in v2)
      if (!db.objectStoreNames.contains(HISTORY_STORE_NAME)) {
        // History entries can be uniquely identified by their timestamp or a generated ID
        db.createObjectStore(HISTORY_STORE_NAME, { keyPath: 'id' });
        console.log(`${HISTORY_STORE_NAME} object store created.`);
      }

      console.log('IndexedDB upgrade needed, object stores checked/created.');
    };

    request.onsuccess = (event) => {
      db = event.target.result;
      console.log('IndexedDB opened successfully');
      resolve(db);
    };

    request.onerror = (event) => {
      console.error('IndexedDB error:', event.target.errorCode);
      reject(event.target.error);
    };
  });
};

// Function to get a transaction
const getTransaction = (storeNames, mode) => {
  if (!db) {
    console.error('Database not open.');
    return null;
  }
  // Ensure storeNames is an array, even if a single store name is passed
  const storeNamesArray = Array.isArray(storeNames) ? storeNames : [storeNames];
  const transaction = db.transaction(storeNamesArray, mode);

  transaction.oncomplete = () => {
    // console.log('Transaction completed');
  };

  transaction.onerror = (event) => {
    console.error('Transaction error:', event.target.error);
  };

  return transaction;
};

// Function to add a new sari
export const addSari = async (sari) => {
  await openDatabase(); // Ensure db is open
  const transaction = getTransaction(SARIS_STORE_NAME, 'readwrite');
  if (!transaction) return Promise.reject('Transaction failed');

  const objectStore = transaction.objectStore(SARIS_STORE_NAME);
  const request = objectStore.add(sari);

  return new Promise((resolve, reject) => {
    request.onsuccess = () => {
      console.log('Sari added to IndexedDB:', sari);
      resolve(sari);
    };

    request.onerror = (event) => {
      console.error('Error adding sari:', event.target.error);
      reject(event.target.error);
    };
  });
};

// Function to get all saris
export const getAllSaris = async () => {
  await openDatabase(); // Ensure db is open
  const transaction = getTransaction(SARIS_STORE_NAME, 'readonly');
  if (!transaction) return Promise.reject('Transaction failed');

  const objectStore = transaction.objectStore(SARIS_STORE_NAME);
  const request = objectStore.getAll();

  return new Promise((resolve, reject) => {
    request.onsuccess = () => {
      console.log('Got all saris from IndexedDB');
      resolve(request.result);
    };

    request.onerror = (event) => {
      console.error('Error getting all saris:', event.target.error);
      reject(event.target.error);
    };
  });
};

// Function to get a sari by ID
export const getSariById = async (id) => {
  await openDatabase(); // Ensure db is open
  const transaction = getTransaction(SARIS_STORE_NAME, 'readonly');
  if (!transaction) return Promise.reject('Transaction failed');

  const objectStore = transaction.objectStore(SARIS_STORE_NAME);
  const request = objectStore.get(id);

  return new Promise((resolve, reject) => {
    request.onsuccess = () => {
      console.log('Got sari by ID from IndexedDB:', id);
      resolve(request.result);
    };

    request.onerror = (event) => {
      console.error('Error getting sari by ID:', event.target.error);
      reject(event.target.error);
    };
  });
};

// Function to update a sari
export const updateSari = async (sari) => {
  await openDatabase(); // Ensure db is open
  const transaction = getTransaction(SARIS_STORE_NAME, 'readwrite');
  if (!transaction) return Promise.reject('Transaction failed');

  const objectStore = transaction.objectStore(SARIS_STORE_NAME);
  const request = objectStore.put(sari);

  return new Promise((resolve, reject) => {
    request.onsuccess = () => {
      console.log('Sari updated in IndexedDB:', sari);
      resolve(sari);
    };

    request.onerror = (event) => {
      console.error('Error updating sari:', event.target.error);
      reject(event.target.error);
    };
  });
};

// Function to delete a sari
export const deleteSari = async (id) => {
  await openDatabase(); // Ensure db is open
  const transaction = getTransaction(SARIS_STORE_NAME, 'readwrite');
  if (!transaction) return Promise.reject('Transaction failed');

  const objectStore = transaction.objectStore(SARIS_STORE_NAME);
  const request = objectStore.delete(id);

  return new Promise((resolve, reject) => {
    request.onsuccess = () => {
      console.log('Sari deleted from IndexedDB:', id);
      resolve();
    };

    request.onerror = (event) => {
      console.error('Error deleting sari:', event.target.error);
      reject(event.target.error);
    };
  });
};

// Function to add a history entry
export const addHistoryEntry = async (entry) => {
  await openDatabase(); // Ensure db is open
  const transaction = getTransaction(HISTORY_STORE_NAME, 'readwrite');
  if (!transaction) return Promise.reject('Transaction failed');

  const objectStore = transaction.objectStore(HISTORY_STORE_NAME);
  const request = objectStore.add(entry);

  return new Promise((resolve, reject) => {
    request.onsuccess = () => {
      console.log('History entry added to IndexedDB:', entry);
      resolve(entry);
    };

    request.onerror = (event) => {
      console.error('Error adding history entry:', event.target.error);
      reject(event.target.error);
    };
  });
};

// Function to delete a history entry
export const deleteHistoryEntry = async (id) => {
  await openDatabase(); // Ensure db is open
  const transaction = getTransaction(HISTORY_STORE_NAME, 'readwrite');
  if (!transaction) return Promise.reject('Transaction failed');

  const objectStore = transaction.objectStore(HISTORY_STORE_NAME);
  const request = objectStore.delete(id);

  return new Promise((resolve, reject) => {
    request.onsuccess = () => {
      console.log('History entry deleted from IndexedDB:', id);
      resolve();
    };

    request.onerror = (event) => {
      console.error('Error deleting history entry:', event.target.error);
      reject(event.target.error);
    };
  });
};

// Function to get all history entries
export const getAllHistoryEntries = async () => {
  await openDatabase(); // Ensure db is open
  console.log('Attempting to get all history entries');
  const transaction = getTransaction(HISTORY_STORE_NAME, 'readonly');
  if (!transaction) return Promise.reject('Transaction failed');

  const objectStore = transaction.objectStore(HISTORY_STORE_NAME);
  const request = objectStore.getAll();

  return new Promise((resolve, reject) => {
    request.onsuccess = () => {
      console.log('Got all history entries from IndexedDB', request.result);
      // Sort by timestamp descending for most recent first
      const sortedEntries = request.result.sort((a, b) => new Date(b.timestamp) - new Date(a.timestamp));
      resolve(sortedEntries);
    };

    request.onerror = (event) => {
      console.error('Error getting all history entries:', event.target.error);
      reject(event.target.error);
    };
  });
}; 