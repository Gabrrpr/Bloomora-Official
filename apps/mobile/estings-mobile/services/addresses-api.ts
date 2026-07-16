import { apiFetch } from '@/services/api-client';
import type { ServiceZone, VerifiedAddress } from '@/services/location-api';

type BackendAddress = {
  barangay?: string | null;
  city: string;
  created_at?: string | null;
  geocode_precision?: string | null;
  id: string;
  is_default: boolean;
  label: string;
  latitude?: number | string | null;
  longitude?: number | string | null;
  phone: string;
  province: string;
  recipient_name: string;
  street: string;
  zip_code?: string | null;
};

type BackendAddressPayload = {
  barangay?: string | null;
  city: string;
  geocode_precision?: string | null;
  is_default: boolean;
  label: string;
  latitude?: number | null;
  longitude?: number | null;
  phone: string;
  province: string;
  recipient_name: string;
  street: string;
  zip_code?: string | null;
};

export type AccountAddress = VerifiedAddress & {
  address_details?: string | null;
  created_at?: string | null;
  id: string;
  is_default: boolean;
  is_verified: boolean;
  label: string;
  phone: string;
  recipient_name: string;
  verified_at?: string | null;
};

/**
 * The deployed API accepts the canonical address fields directly. Screens should
 * pass `verified_address` from the map picker; the flattened fields remain
 * available for callers that already have a persisted address.
 */
export type AccountAddressPayload = {
  barangay?: string | null;
  city?: string;
  geocode_precision?: string | null;
  is_default: boolean;
  label: string;
  latitude?: number | null;
  longitude?: number | null;
  phone: string;
  province?: string;
  recipient_name: string;
  street?: string;
  verified_address?: VerifiedAddress;
  zip_code?: string | null;
};

type AddressListResponse = {
  addresses: BackendAddress[];
};

type AddressMutationResponse = {
  address: BackendAddress;
  status: string;
};

function normalizeText(value: unknown) {
  return typeof value === 'string' ? value.trim() : '';
}

function normalizeCoordinate(value: number | string | null | undefined) {
  if (value === null || value === undefined || value === '') return null;
  const coordinate = Number(value);
  return Number.isFinite(coordinate) ? coordinate : null;
}

function isPhilippineCoordinate(latitude: number | null, longitude: number | null) {
  return (
    latitude !== null &&
    longitude !== null &&
    latitude >= 4.3 &&
    latitude <= 21.5 &&
    longitude >= 116 &&
    longitude <= 127
  );
}

function getServiceZone(province: string): ServiceZone {
  const normalizedProvince = province.toLocaleLowerCase();

  if (
    normalizedProvince.includes('metro manila') ||
    normalizedProvince.includes('national capital region') ||
    normalizedProvince === 'ncr'
  ) {
    return 'ncr';
  }

  if (normalizedProvince.includes('pampanga')) {
    return 'pampanga';
  }

  return 'unsupported';
}

function formatBackendAddress(address: BackendAddress) {
  return [address.street, address.barangay, address.city, address.province, address.zip_code]
    .map(normalizeText)
    .filter(Boolean)
    .filter((part, index, parts) => parts.indexOf(part) === index)
    .join(', ');
}

function normalizeBackendAddress(address: BackendAddress): AccountAddress {
  const latitude = normalizeCoordinate(address.latitude);
  const longitude = normalizeCoordinate(address.longitude);
  const precision = normalizeText(address.geocode_precision);
  const serviceZone = getServiceZone(address.province);
  const isVerified = (
    isPhilippineCoordinate(latitude, longitude) &&
    serviceZone !== 'unsupported' &&
    precision.startsWith('reverse_')
  );

  return {
    address_details: null,
    barangay: address.barangay ?? null,
    city: address.city,
    country_code: 'ph',
    created_at: address.created_at ?? null,
    delivery_provider: serviceZone === 'ncr' ? 'lalamove' : serviceZone === 'pampanga' ? 'standard' : null,
    formatted_address: formatBackendAddress(address),
    geocode_place_id: null,
    geocode_precision: precision || 'unverified',
    geocode_provider: isVerified ? 'mobile-pin' : 'legacy',
    id: address.id,
    is_default: address.is_default,
    is_serviceable: isVerified,
    is_verified: isVerified,
    label: address.label,
    latitude: latitude ?? 0,
    longitude: longitude ?? 0,
    phone: address.phone,
    province: address.province,
    recipient_name: address.recipient_name,
    region: address.province,
    required_branch: serviceZone === 'ncr' ? 'Manila' : serviceZone === 'pampanga' ? 'Pampanga' : null,
    service_zone: serviceZone,
    street: address.street,
    verified_at: null,
    zip_code: address.zip_code ?? null,
  };
}

function toBackendPayload(payload: AccountAddressPayload): BackendAddressPayload {
  const verifiedAddress = payload.verified_address;
  const street = normalizeText(verifiedAddress?.street ?? payload.street);
  const city = normalizeText(verifiedAddress?.city ?? payload.city);
  const province = normalizeText(verifiedAddress?.province ?? payload.province);
  const latitude = normalizeCoordinate(verifiedAddress?.latitude ?? payload.latitude);
  const longitude = normalizeCoordinate(verifiedAddress?.longitude ?? payload.longitude);
  const precision = normalizeText(verifiedAddress?.geocode_precision ?? payload.geocode_precision);
  const serviceZone = getServiceZone(province);

  if (!street || !city || !province || !isPhilippineCoordinate(latitude, longitude)) {
    throw new Error('Place and verify a Philippine delivery pin before saving this address.');
  }

  if (serviceZone === 'unsupported') {
    throw new Error('Delivery addresses must be within NCR or Pampanga.');
  }

  if (!precision.startsWith('reverse_')) {
    throw new Error('Re-pin this address to verify it with OpenStreetMap.');
  }

  if (!normalizeText(payload.recipient_name) || !normalizeText(payload.phone)) {
    throw new Error('Recipient name and phone number are required.');
  }

  return {
    barangay: normalizeText(verifiedAddress?.barangay ?? payload.barangay) || null,
    city,
    geocode_precision: precision,
    is_default: payload.is_default,
    label: normalizeText(payload.label) || 'Home',
    latitude,
    longitude,
    phone: normalizeText(payload.phone),
    province,
    recipient_name: normalizeText(payload.recipient_name),
    street,
    zip_code: normalizeText(verifiedAddress?.zip_code ?? payload.zip_code) || null,
  };
}

export const addressesApi = {
  async create(payload: AccountAddressPayload, token: string) {
    const response = await apiFetch<AddressMutationResponse>('/addresses/', {
      body: JSON.stringify(toBackendPayload(payload)),
      method: 'POST',
      token,
    });
    return { ...response, address: normalizeBackendAddress(response.address) };
  },

  async list(token: string) {
    const response = await apiFetch<AddressListResponse>('/addresses/', { token });
    return response.addresses.map(normalizeBackendAddress);
  },

  async update(addressId: string, payload: AccountAddressPayload, token: string) {
    let resolvedPayload = payload;

    // Metadata-only edits still need all required fields because the deployed
    // PATCH contract replaces the complete address rather than partially updating it.
    if (!payload.verified_address && (!payload.street || !payload.city || !payload.province)) {
      const existingAddress = (await this.list(token)).find((address) => address.id === addressId);
      if (!existingAddress) throw new Error('Address not found.');
      if (!existingAddress.is_verified) {
        throw new Error('Re-pin this legacy address before saving changes.');
      }
      resolvedPayload = { ...payload, verified_address: existingAddress };
    }

    const response = await apiFetch<AddressMutationResponse>(`/addresses/${encodeURIComponent(addressId)}`, {
      body: JSON.stringify(toBackendPayload(resolvedPayload)),
      method: 'PATCH',
      token,
    });
    return { ...response, address: normalizeBackendAddress(response.address) };
  },

  async delete(addressId: string, token: string) {
    return apiFetch<{ status: string }>(`/addresses/${encodeURIComponent(addressId)}`, {
      method: 'DELETE',
      token,
    });
  },

  async setDefault(addressId: string, token: string) {
    const response = await apiFetch<AddressMutationResponse>(
      `/addresses/${encodeURIComponent(addressId)}/set-default`,
      { method: 'PATCH', token },
    );
    return { ...response, address: normalizeBackendAddress(response.address) };
  },
};
