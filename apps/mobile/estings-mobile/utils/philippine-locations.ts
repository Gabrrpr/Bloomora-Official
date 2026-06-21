import phAddress, { type AddressItem } from 'latest-ph-address-thanks-to-anehan';

export type PhilippineLocationOption = {
  code: string;
  name: string;
};

const noProvinceCode = '-NO PROVINCE-';

function toOption(item: AddressItem): PhilippineLocationOption {
  return {
    code: item.psgc,
    name: item.name,
  };
}

export function getPhilippineRegions() {
  return phAddress.getRegions().map(toOption);
}

export function getPhilippineProvinces(regionCode: string) {
  if (!regionCode) {
    return [];
  }

  const provinces = phAddress.getProvincesByRegion(regionCode);

  if (typeof provinces === 'string') {
    return [{ code: noProvinceCode, name: 'No province (NCR)' }];
  }

  return provinces.map(toOption);
}

export function getPhilippineCities(regionCode: string, provinceCode: string) {
  if (!regionCode || !provinceCode) {
    return [];
  }

  return phAddress.getCitiesAndMunsByProvince(provinceCode, regionCode).map(toOption);
}

export function getPhilippineBarangays(cityCode: string) {
  if (!cityCode) {
    return [];
  }

  return phAddress.getBarangaysByCityOrMun(cityCode).map(toOption);
}

export function findLocationByName(
  options: readonly PhilippineLocationOption[],
  name: string,
) {
  const normalizedName = normalizeLocationName(name);

  if (!normalizedName) {
    return undefined;
  }

  return options.find((option) => normalizeLocationName(option.name) === normalizedName);
}

export function findPhilippineLocationPath(provinceName: string, cityName: string) {
  for (const region of getPhilippineRegions()) {
    const provinces = getPhilippineProvinces(region.code);
    const matchedProvince =
      findLocationByName(provinces, provinceName) ??
      (provinces.length === 1 && provinces[0].code === '-NO PROVINCE-'
        ? provinces[0]
        : undefined);

    if (!matchedProvince) {
      continue;
    }

    const cities = getPhilippineCities(region.code, matchedProvince.code);
    const matchedCity = findLocationByName(cities, cityName);

    if (matchedCity) {
      return {
        city: matchedCity,
        province: matchedProvince,
        region,
      };
    }
  }

  return undefined;
}

function normalizeLocationName(value: string) {
  return value
    .trim()
    .toLowerCase()
    .replace(/^city of\s+/, '')
    .replace(/\bcity\b/g, '')
    .replace(/\bprovince\b/g, '')
    .replace(/[^a-z0-9]+/g, ' ')
    .trim();
}
