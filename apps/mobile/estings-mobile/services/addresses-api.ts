import { apiFetch } from '@/services/api-client';

export type AccountAddress = {
  barangay?: string | null;
  city: string;
  created_at?: string | null;
  id: string;
  is_default: boolean;
  label: string;
  phone: string;
  province: string;
  recipient_name: string;
  street: string;
  zip_code?: string | null;
};

export type AccountAddressPayload = {
  barangay?: string;
  city: string;
  is_default: boolean;
  label: string;
  phone: string;
  province: string;
  recipient_name: string;
  street: string;
  zip_code?: string;
};

type AddressListResponse = {
  addresses: AccountAddress[];
};

type AddressMutationResponse = {
  address: AccountAddress;
  status: string;
};

export const addressesApi = {
  async create(payload: AccountAddressPayload, token: string) {
    return apiFetch<AddressMutationResponse>('/addresses/', {
      body: JSON.stringify(payload),
      method: 'POST',
      token,
    });
  },

  async list(token: string) {
    const response = await apiFetch<AddressListResponse>('/addresses/', { token });
    return response.addresses;
  },

  async update(addressId: string, payload: AccountAddressPayload, token: string) {
    return apiFetch<AddressMutationResponse>(`/addresses/${encodeURIComponent(addressId)}`, {
      body: JSON.stringify(payload),
      method: 'PATCH',
      token,
    });
  },
  async delete(addressId: string, token: string) {
    return apiFetch<{ status: string }>(`/addresses/${encodeURIComponent(addressId)}`, {
      method: 'DELETE',
      token,
    });
  },
  async setDefault(addressId: string, token: string) {
    return apiFetch<AddressMutationResponse>(`/addresses/${encodeURIComponent(addressId)}/set-default`, {
      method: 'PATCH',
      token,
    });
  },
};
