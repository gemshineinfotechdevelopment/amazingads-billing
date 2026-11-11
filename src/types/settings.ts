export interface CompanySettings {
  _id?: string;
  companyName: string;
  logoUrl?: string;
  address: string;
  mobile: string;
  email: string;
  gstin: string;
  state: string;
  pincode: string;
  invoicePrefix: string;
  startingNumber: number;
  financialYear: string;
  currency: string;
  defaultGstRate: number;
  invoiceFooterText?: string;
  termsAndConditions?: string;
}

