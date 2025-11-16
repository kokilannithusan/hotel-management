const STORAGE_PREFIX = "hms_";

export const storageKeys = {
  auth: `${STORAGE_PREFIX}auth`,
  customers: `${STORAGE_PREFIX}customers`,
  rooms: `${STORAGE_PREFIX}rooms`,
  roomTypes: `${STORAGE_PREFIX}roomTypes`,
  viewTypes: `${STORAGE_PREFIX}viewTypes`,
  amenities: `${STORAGE_PREFIX}amenities`,
  roomAreas: `${STORAGE_PREFIX}roomAreas`,
  reservations: `${STORAGE_PREFIX}reservations`,
  channels: `${STORAGE_PREFIX}channels`,
  seasons: `${STORAGE_PREFIX}seasons`,
  bills: `${STORAGE_PREFIX}bills`,
  receipts: `${STORAGE_PREFIX}receipts`,
  refunds: `${STORAGE_PREFIX}refunds`,
  taxes: `${STORAGE_PREFIX}taxes`,
  policies: `${STORAGE_PREFIX}policies`,
  currencyRates: `${STORAGE_PREFIX}currencyRates`,
  channelPricing: `${STORAGE_PREFIX}channelPricing`,
  seasonalPricing: `${STORAGE_PREFIX}seasonalPricing`,
  stayTypes: `${STORAGE_PREFIX}stayTypes`,
  mealPlans: `${STORAGE_PREFIX}mealPlans`,
  housekeeping: `${STORAGE_PREFIX}housekeeping`,
  settings: `${STORAGE_PREFIX}settings`,
  users: `${STORAGE_PREFIX}users`,
  events: `${STORAGE_PREFIX}events`,
  eventPackages: `${STORAGE_PREFIX}event_packages`,
  additionalServices: `${STORAGE_PREFIX}additional_services`,
  halls: `${STORAGE_PREFIX}halls`,
  eventInvoices: `${STORAGE_PREFIX}event_invoices`,
  eventBookings: `${STORAGE_PREFIX}event_bookings`,
};

export const getStorageItem = <T>(key: string, defaultValue: T): T => {
  try {
    const item = localStorage.getItem(key);
    if (item) {
      return JSON.parse(item) as T;
    }
  } catch (error) {
    console.error(`Error reading from localStorage key "${key}":`, error);
  }
  return defaultValue;
};

export const setStorageItem = <T>(key: string, value: T): void => {
  try {
    localStorage.setItem(key, JSON.stringify(value));
  } catch (error) {
    console.error(`Error writing to localStorage key "${key}":`, error);
  }
};

export const removeStorageItem = (key: string): void => {
  try {
    localStorage.removeItem(key);
  } catch (error) {
    console.error(`Error removing localStorage key "${key}":`, error);
  }
};

export const clearAllStorage = (): void => {
  Object.values(storageKeys).forEach((key) => {
    removeStorageItem(key);
  });
};
