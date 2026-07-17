import * as Location from 'expo-location';
import { Platform } from 'react-native';

import { apiFetch, assertNetworkConnection } from '@/services/api-client';

export type ServiceZone = 'ncr' | 'pampanga' | 'unsupported';
export type RequiredBranch = 'Manila' | 'Pampanga' | null;
export type DeliveryProvider = 'lalamove' | 'standard' | null;

export type VerifiedAddress = {
  formatted_address: string;
  street: string;
  barangay: string | null;
  city: string;
  province: string;
  region: string | null;
  zip_code: string | null;
  country_code: string;
  latitude: number;
  longitude: number;
  geocode_precision: string;
  geocode_provider: string;
  geocode_place_id: string | null;
  service_zone: ServiceZone;
  required_branch: RequiredBranch;
  delivery_provider: DeliveryProvider;
  is_serviceable: boolean;
};

export type AddressVerification = {
  address: VerifiedAddress;
  attribution: string;
  /** A client-side selection marker. The unchanged backend does not verify or consume this value. */
  verificationToken: string;
};

export type AddressSearchResult = {
  id: string;
  label: string;
  latitude: number;
  longitude: number;
  type: string | null;
};

type NominatimAddress = Record<string, unknown> & {
  amenity?: string;
  building?: string;
  city?: string;
  city_district?: string;
  country?: string;
  country_code?: string;
  county?: string;
  district?: string;
  hamlet?: string;
  house_name?: string;
  house_number?: string;
  leisure?: string;
  municipality?: string;
  neighbourhood?: string;
  office?: string;
  path?: string;
  pedestrian?: string;
  postcode?: string;
  province?: string;
  quarter?: string;
  region?: string;
  residential?: string;
  road?: string;
  shop?: string;
  state?: string;
  state_district?: string;
  suburb?: string;
  town?: string;
  tourism?: string;
  village?: string;
};

type NominatimReverseResponse = {
  addresstype?: string;
  address?: NominatimAddress;
  category?: string;
  display_name?: string;
  error?: string;
  lat?: string;
  licence?: string;
  lon?: string;
  osm_id?: number | string;
  osm_type?: string;
  place_id?: number | string;
  type?: string;
};

type AddressSearchResponse = {
  results?: Array<{
    label?: unknown;
    lat?: unknown;
    lng?: unknown;
    type?: unknown;
  }>;
};

const NOMINATIM_BASE_URL = (
  process.env.EXPO_PUBLIC_NOMINATIM_BASE_URL ?? 'https://nominatim.openstreetmap.org'
).replace(/\/$/, '');
const NOMINATIM_USER_AGENT = 'EstingsMobile/1.0 (https://estings.shop)';
const OSM_ATTRIBUTION = 'Data © OpenStreetMap contributors, ODbL 1.0';
const CACHE_TTL_MS = 30 * 60 * 1000;
const CACHE_MAX_ENTRIES = 200;
const REQUEST_INTERVAL_MS = 1_050;
const REQUEST_TIMEOUT_MS = 15_000;
const PROXY_REQUEST_TIMEOUT_MS = 20_000;
const NATIVE_GEOCODER_TIMEOUT_MS = 8_000;
const SEARCH_CACHE_TTL_MS = 15 * 60 * 1000;

const reverseCache = new Map<string, { expiresAt: number; value: AddressVerification }>();
const searchCache = new Map<string, { expiresAt: number; value: AddressSearchResult[] }>();
let requestQueue: Promise<void> = Promise.resolve();
let nextRequestAt = 0;

export async function searchAddressLocations(
  query: string,
  signal?: AbortSignal,
): Promise<AddressSearchResult[]> {
  const normalizedQuery = query.trim().replace(/\s+/g, ' ');

  if (normalizedQuery.length < 5) {
    throw new Error('Enter at least 5 characters to search for an address.');
  }

  throwIfAborted(signal);
  const cacheKey = normalizedQuery.toLocaleLowerCase();
  const cached = searchCache.get(cacheKey);

  if (cached && cached.expiresAt > Date.now()) {
    return cached.value;
  }

  if (cached) {
    searchCache.delete(cacheKey);
  }

  const response = await apiFetch<AddressSearchResponse>(
    `/addresses/geocode?q=${encodeURIComponent(normalizedQuery)}`,
    { signal },
  );
  throwIfAborted(signal);

  const results = (response.results ?? []).flatMap((result, index) => {
    const label = cleanString(result.label);
    const latitude = Number(result.lat);
    const longitude = Number(result.lng);

    if (!label || !isCoordinateInPhilippines(latitude, longitude)) {
      return [];
    }

    return [{
      id: `${latitude.toFixed(6)},${longitude.toFixed(6)}:${index}`,
      label,
      latitude,
      longitude,
      type: cleanString(result.type) || null,
    }];
  });

  searchCache.set(cacheKey, {
    expiresAt: Date.now() + SEARCH_CACHE_TTL_MS,
    value: results,
  });
  return results;
}

export async function reverseGeocodeLocation(
  latitude: number,
  longitude: number,
  signal?: AbortSignal,
): Promise<AddressVerification> {
  assertValidCoordinates(latitude, longitude);
  throwIfAborted(signal);

  const cacheKey = `${latitude.toFixed(5)},${longitude.toFixed(5)}`;
  const cached = reverseCache.get(cacheKey);

  if (cached && cached.expiresAt > Date.now()) {
    return cached.value;
  }

  if (cached) {
    reverseCache.delete(cacheKey);
  }

  return enqueueNominatimRequest(async () => {
    throwIfAborted(signal);
    await assertNetworkConnection();

    const value = Platform.OS === 'web'
      ? normalizeNominatimResult(
        await fetchNominatimReverseGeocode(latitude, longitude, signal),
        latitude,
        longitude,
      )
      : await fetchNativeAddressVerification(latitude, longitude, signal);
    cacheResult(cacheKey, value);
    return value;
  }, signal);
}

export function getAddressZoneLabel(address: Pick<VerifiedAddress, 'service_zone'>) {
  if (address.service_zone === 'ncr') {
    return 'NCR · Manila branch · Lalamove';
  }

  if (address.service_zone === 'pampanga') {
    return "Pampanga · Esting's standard delivery";
  }

  return 'Outside Esting\'s delivery area';
}

async function fetchNativeAddressVerification(
  latitude: number,
  longitude: number,
  signal?: AbortSignal,
): Promise<AddressVerification> {
  const deviceAddress = await tryDeviceReverseGeocode(latitude, longitude, signal);

  if (deviceAddress) {
    try {
      return normalizeDeviceGeocodeResult(deviceAddress, latitude, longitude);
    } catch {
      // Device geocoders sometimes omit Philippine barangay/city fields. The
      // server proxy gives Nominatim a chance to return the complete address.
    }
  }

  const response = await fetchProxiedReverseGeocode(latitude, longitude, signal);
  return normalizeNominatimResult(response, latitude, longitude);
}

async function tryDeviceReverseGeocode(
  latitude: number,
  longitude: number,
  signal?: AbortSignal,
): Promise<Location.LocationGeocodedAddress | null> {
  try {
    if (Platform.OS === 'android') {
      const permission = await Location.getForegroundPermissionsAsync();
      if (permission.status !== Location.PermissionStatus.GRANTED) {
        return null;
      }
    }

    throwIfAborted(signal);
    const results = await withTimeout(
      Location.reverseGeocodeAsync({ latitude, longitude }),
      NATIVE_GEOCODER_TIMEOUT_MS,
    );
    throwIfAborted(signal);
    return results[0] ?? null;
  } catch {
    return null;
  }
}

async function fetchProxiedReverseGeocode(
  latitude: number,
  longitude: number,
  parentSignal?: AbortSignal,
): Promise<NominatimReverseResponse> {
  const params = new URLSearchParams({ lat: String(latitude), lng: String(longitude) });
  const controller = new AbortController();
  let didTimeOut = false;
  const abortFromParent = () => controller.abort();
  const timeout = setTimeout(() => {
    didTimeOut = true;
    controller.abort();
  }, PROXY_REQUEST_TIMEOUT_MS);

  parentSignal?.addEventListener('abort', abortFromParent, { once: true });

  try {
    return await apiFetch<NominatimReverseResponse>(`/addresses/reverse-geocode?${params.toString()}`, {
      signal: controller.signal,
    });
  } catch (error) {
    if (parentSignal?.aborted) {
      throw createAbortError();
    }

    if (didTimeOut) {
      throw new Error('Address verification timed out. Check your connection and try again.');
    }

    throw new Error(
      error instanceof Error && error.message.includes('404')
        ? 'Address verification is not available on the configured API. Update the backend and try again.'
        : 'Address verification is temporarily unavailable. Check your connection and try again.',
    );
  } finally {
    clearTimeout(timeout);
    parentSignal?.removeEventListener('abort', abortFromParent);
  }
}

async function fetchNominatimReverseGeocode(
  latitude: number,
  longitude: number,
  parentSignal?: AbortSignal,
): Promise<NominatimReverseResponse> {
  const params = new URLSearchParams({
    addressdetails: '1',
    format: 'jsonv2',
    lat: String(latitude),
    lon: String(longitude),
    zoom: '18',
  });
  const controller = new AbortController();
  let didTimeOut = false;
  const abortFromParent = () => controller.abort();
  const timeout = setTimeout(() => {
    didTimeOut = true;
    controller.abort();
  }, REQUEST_TIMEOUT_MS);

  parentSignal?.addEventListener('abort', abortFromParent, { once: true });

  try {
    const response = await fetch(`${NOMINATIM_BASE_URL}/reverse?${params.toString()}`, {
      headers: {
        Accept: 'application/json',
        'Accept-Language': 'en-PH,en',
        ...(Platform.OS === 'web' ? {} : { 'User-Agent': NOMINATIM_USER_AGENT }),
      },
      signal: controller.signal,
    });

    if (!response.ok) {
      if (response.status === 429) {
        throw new Error('Address verification is busy. Wait a moment, then try the pin again.');
      }

      throw new Error(`OpenStreetMap address verification failed (${response.status}).`);
    }

    return (await response.json()) as NominatimReverseResponse;
  } catch (error) {
    if (parentSignal?.aborted) {
      throw createAbortError();
    }

    if (didTimeOut) {
      throw new Error('Address verification timed out. Check your connection and try again.');
    }

    throw error instanceof Error
      ? error
      : new Error('This pin could not be verified with OpenStreetMap.');
  } finally {
    clearTimeout(timeout);
    parentSignal?.removeEventListener('abort', abortFromParent);
  }
}

function normalizeDeviceGeocodeResult(
  result: Location.LocationGeocodedAddress,
  pinnedLatitude: number,
  pinnedLongitude: number,
): AddressVerification {
  const countryCode = cleanString(result.isoCountryCode).toLowerCase();
  const countryName = normalizeName(result.country);

  if (countryCode !== 'ph' && countryName !== 'philippines') {
    throw new Error('Choose a delivery pin within the Philippines.');
  }

  const administrativeAddress: NominatimAddress = {
    city: result.city ?? undefined,
    city_district: result.district ?? undefined,
    country: result.country ?? undefined,
    country_code: result.isoCountryCode ?? undefined,
    postcode: result.postalCode ?? undefined,
    region: result.region ?? undefined,
    state: result.region ?? undefined,
    state_district: result.subregion ?? undefined,
  };
  const serviceZone = classifyServiceZone(administrativeAddress);
  const streetName = cleanString(result.street);
  const placeName = cleanString(result.name);
  const street = [cleanString(result.streetNumber), streetName || placeName].filter(Boolean).join(' ').trim();
  const city = firstString(result.city, result.district);
  const barangay = firstString(result.district, result.subregion);
  const province = serviceZone === 'ncr'
    ? 'Metro Manila'
    : serviceZone === 'pampanga'
      ? 'Pampanga'
      : firstString(result.subregion, result.region);

  if (!street || !city || !province) {
    throw new Error(
      'The device map provider does not have a complete street, city, and province for this pin. Move the pin to the exact building or entrance.',
    );
  }

  const isServiceable = serviceZone !== 'unsupported';
  const formattedAddress = [street, barangay, city, province, cleanString(result.postalCode), 'Philippines']
    .filter(Boolean)
    .filter((part, index, parts) => parts.indexOf(part) === index)
    .join(', ');
  const address: VerifiedAddress = {
    barangay: barangay || null,
    city,
    country_code: 'ph',
    delivery_provider: serviceZone === 'ncr' ? 'lalamove' : serviceZone === 'pampanga' ? 'standard' : null,
    formatted_address: formattedAddress,
    geocode_place_id: null,
    geocode_precision: 'reverse_device_address',
    geocode_provider: Platform.OS === 'android' ? 'android-geocoder' : 'ios-geocoder',
    is_serviceable: isServiceable,
    latitude: pinnedLatitude,
    longitude: pinnedLongitude,
    province,
    region: cleanString(result.region) || null,
    required_branch: serviceZone === 'ncr' ? 'Manila' : serviceZone === 'pampanga' ? 'Pampanga' : null,
    service_zone: serviceZone,
    street,
    zip_code: cleanString(result.postalCode) || null,
  };

  return {
    address,
    attribution: 'Address data provided by your device map service',
    verificationToken: `local:device:${pinnedLatitude.toFixed(6)},${pinnedLongitude.toFixed(6)}`,
  };
}

function normalizeNominatimResult(
  result: NominatimReverseResponse,
  pinnedLatitude: number,
  pinnedLongitude: number,
): AddressVerification {
  if (result.error) {
    throw new Error(result.error);
  }

  const raw = result.address ?? {};
  const countryCode = cleanString(raw.country_code).toLowerCase();

  if (countryCode !== 'ph') {
    throw new Error('Choose a delivery pin within the Philippines.');
  }

  const serviceZone = classifyServiceZone(raw);
  const road = firstString(raw.road, raw.pedestrian, raw.residential, raw.path);
  const houseNumber = cleanString(raw.house_number);
  const houseName = firstString(
    raw.house_name,
    raw.building,
    raw.amenity,
    raw.shop,
    raw.office,
    raw.tourism,
    raw.leisure,
  );
  const street = [houseNumber || houseName, road].filter(Boolean).join(' ').trim();
  const city = firstString(raw.city, raw.town, raw.municipality);
  const barangay = firstString(
    raw.village,
    raw.quarter,
    raw.neighbourhood,
    raw.suburb,
    raw.city_district,
    raw.district,
  );
  const region = firstString(raw.region, raw.state);
  const province = serviceZone === 'ncr'
    ? 'Metro Manila'
    : serviceZone === 'pampanga'
      ? 'Pampanga'
      : firstString(raw.province, raw.state_district, raw.state, raw.county);
  const providerDisplayName = cleanString(result.display_name);

  if (!providerDisplayName || !street || !city || !province) {
    throw new Error(
      'OpenStreetMap does not have a complete street, city, and province for this pin. Move the pin to the exact building or entrance.',
    );
  }

  const isServiceable = serviceZone !== 'unsupported';
  const formattedAddress = [street, barangay, city, province, cleanString(raw.postcode), 'Philippines']
    .filter(Boolean)
    .filter((part, index, parts) => parts.indexOf(part) === index)
    .join(', ');
  const placeId = result.place_id === undefined || result.place_id === null
    ? null
    : String(result.place_id);
  const address: VerifiedAddress = {
    barangay: barangay || null,
    city,
    country_code: countryCode,
    delivery_provider: serviceZone === 'ncr' ? 'lalamove' : serviceZone === 'pampanga' ? 'standard' : null,
    formatted_address: formattedAddress,
    geocode_place_id: placeId,
    geocode_precision: `reverse_${cleanString(result.addresstype) || cleanString(result.type) || 'address'}`,
    geocode_provider: 'nominatim',
    is_serviceable: isServiceable,
    latitude: pinnedLatitude,
    longitude: pinnedLongitude,
    province,
    region: region || null,
    required_branch: serviceZone === 'ncr' ? 'Manila' : serviceZone === 'pampanga' ? 'Pampanga' : null,
    service_zone: serviceZone,
    street,
    zip_code: cleanString(raw.postcode) || null,
  };

  return {
    address,
    attribution: cleanString(result.licence) || OSM_ATTRIBUTION,
    verificationToken: makeLocalSelectionToken(result, pinnedLatitude, pinnedLongitude),
  };
}

function classifyServiceZone(address: NominatimAddress): ServiceZone {
  const isoCodes = Object.entries(address)
    .filter(([key]) => key.toUpperCase().startsWith('ISO3166-2-LVL'))
    .map(([, value]) => normalizeName(value));
  const administrativeAreas = [
    address.region,
    address.state,
    address.state_district,
    address.province,
    address.county,
  ].map(normalizeName).filter(Boolean);

  if (
    isoCodes.includes('ph-00')
    || administrativeAreas.some((area) => (
      area === 'ncr'
      || area === 'metro manila'
      || area === 'metropolitan manila'
      || area === 'national capital region'
      || area === 'kalakhang maynila'
    ))
  ) {
    return 'ncr';
  }

  if (
    isoCodes.includes('ph-pam')
    || administrativeAreas.some((area) => (
      area === 'pampanga'
      || area === 'province of pampanga'
      || area === 'lalawigan ng pampanga'
    ))
  ) {
    return 'pampanga';
  }

  // Deliberately do not infer a zone from city names such as San Fernando.
  // Those names occur in other provinces and would create false serviceability.
  return 'unsupported';
}

function makeLocalSelectionToken(
  result: NominatimReverseResponse,
  latitude: number,
  longitude: number,
) {
  const sourceId = result.place_id ?? result.osm_id ?? 'unknown';
  const sourceType = cleanString(result.osm_type) || 'place';
  return `local:nominatim:${sourceType}:${sourceId}:${latitude.toFixed(6)},${longitude.toFixed(6)}`;
}

function enqueueNominatimRequest<T>(task: () => Promise<T>, signal?: AbortSignal): Promise<T> {
  const queued = requestQueue.then(async () => {
    throwIfAborted(signal);
    const delayMs = Math.max(0, nextRequestAt - Date.now());

    if (delayMs > 0) {
      await abortableDelay(delayMs, signal);
    }

    throwIfAborted(signal);
    nextRequestAt = Date.now() + REQUEST_INTERVAL_MS;
    return task();
  });

  requestQueue = queued.then(() => undefined, () => undefined);
  return queued;
}

function cacheResult(key: string, value: AddressVerification) {
  if (reverseCache.size >= CACHE_MAX_ENTRIES) {
    const oldestKey = reverseCache.keys().next().value as string | undefined;
    if (oldestKey) {
      reverseCache.delete(oldestKey);
    }
  }

  reverseCache.set(key, { expiresAt: Date.now() + CACHE_TTL_MS, value });
}

function assertValidCoordinates(latitude: number, longitude: number) {
  if (!Number.isFinite(latitude) || !Number.isFinite(longitude)) {
    throw new Error('The selected map pin is invalid.');
  }

  if (latitude < -90 || latitude > 90 || longitude < -180 || longitude > 180) {
    throw new Error('The selected map pin is outside valid map coordinates.');
  }

  // Avoid spending a public Nominatim request on pins that cannot be in the Philippines.
  if (latitude < 4.2 || latitude > 21.5 || longitude < 116 || longitude > 127) {
    throw new Error('Choose a delivery pin within the Philippines.');
  }
}

function isCoordinateInPhilippines(latitude: number, longitude: number) {
  return (
    Number.isFinite(latitude)
    && Number.isFinite(longitude)
    && latitude >= 4.2
    && latitude <= 21.5
    && longitude >= 116
    && longitude <= 127
  );
}

function cleanString(value: unknown) {
  return typeof value === 'string' ? value.trim().replace(/\s+/g, ' ') : '';
}

function firstString(...values: unknown[]) {
  for (const value of values) {
    const cleaned = cleanString(value);
    if (cleaned) {
      return cleaned;
    }
  }

  return '';
}

function normalizeName(value: unknown) {
  return cleanString(value)
    .normalize('NFD')
    .replace(/[\u0300-\u036f]/g, '')
    .toLowerCase();
}

function throwIfAborted(signal?: AbortSignal) {
  if (signal?.aborted) {
    throw createAbortError();
  }
}

function createAbortError() {
  const error = new Error('The address verification request was cancelled.');
  error.name = 'AbortError';
  return error;
}

function abortableDelay(durationMs: number, signal?: AbortSignal) {
  return new Promise<void>((resolve, reject) => {
    if (signal?.aborted) {
      reject(createAbortError());
      return;
    }

    const timeout = setTimeout(() => {
      signal?.removeEventListener('abort', handleAbort);
      resolve();
    }, durationMs);
    const handleAbort = () => {
      clearTimeout(timeout);
      reject(createAbortError());
    };

    signal?.addEventListener('abort', handleAbort, { once: true });
  });
}

function withTimeout<T>(promise: Promise<T>, durationMs: number) {
  return new Promise<T>((resolve, reject) => {
    const timeout = setTimeout(() => reject(new Error('Operation timed out.')), durationMs);

    promise.then(
      (value) => {
        clearTimeout(timeout);
        resolve(value);
      },
      (error) => {
        clearTimeout(timeout);
        reject(error);
      },
    );
  });
}
