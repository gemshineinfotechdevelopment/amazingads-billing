export interface Customer {
  _id: string;
  name: string;
  mobile: string;
  email?: string;
  companyName?: string;
  gstin?: string;
  billingAddress: string;
  city: string;
  state: string;
  pincode: string;
  createdAt: string;
  updatedAt: string;
}

export interface CustomerInput {
  name: string;
  mobile: string;
  email?: string;
  companyName?: string;
  gstin?: string;
  billingAddress: string;
  city: string;
  state: string;
  pincode: string;
}

