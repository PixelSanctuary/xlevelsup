/**
 * Store identity shown on printed tax invoices.
 * These are fixed business facts — edit them directly here rather than
 * via env vars, so every environment shows the same details.
 */
export const storeConfig = {
  name: 'XLEVELSUP',
  /** Registered legal entity name, printed on tax invoices under the brand logo. */
  legalName: 'XLU Technologies Pvt Ltd',
  addressLine1: '2nd Floor, 178-A, Ramachandra Road, R.S. Puram',
  addressLine2: '',
  cityStatePincode: 'Coimbatore, Tamil Nadu - 641002',
  gstin: '33AAACX6458Q1ZN',
  phone: '+91 90470 55888',
};
