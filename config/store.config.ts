/**
 * Store identity shown on printed tax invoices.
 * Override any of these via env vars in .env.local — never hardcode
 * them elsewhere in the app.
 */
export const storeConfig = {
  name: process.env.NEXT_PUBLIC_STORE_NAME || 'XLEVELSUP',
  /** Registered legal entity name, printed on tax invoices under the brand logo. */
  legalName: process.env.NEXT_PUBLIC_STORE_LEGAL_NAME || '',
  addressLine1: process.env.NEXT_PUBLIC_STORE_ADDRESS_LINE1 || '',
  addressLine2: process.env.NEXT_PUBLIC_STORE_ADDRESS_LINE2 || '',
  cityStatePincode: process.env.NEXT_PUBLIC_STORE_CITY_STATE_PINCODE || '',
  gstin: process.env.NEXT_PUBLIC_STORE_GSTIN || '',
  phone: process.env.NEXT_PUBLIC_STORE_PHONE || '',
};
