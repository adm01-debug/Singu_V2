const geocodeCache = new Map<string, { lat: number; lng: number } | null>();

export async function geocode(location: string, signal?: AbortSignal): Promise<{ lat: number; lng: number } | null> {
  const key = location.trim().toLowerCase();
  if (geocodeCache.has(key)) return geocodeCache.get(key) ?? null;
  try {
    const res = await fetch(
      `https://nominatim.openstreetmap.org/search?format=json&limit=1&countrycodes=br&q=${encodeURIComponent(location)}`,
      { headers: { "User-Agent": "SINGU-CRM/1.0" }, signal }
    );
    const data = await res.json();
    if (data.length > 0) {
      const coords = { lat: parseFloat(data[0].lat), lng: parseFloat(data[0].lon) };
      geocodeCache.set(key, coords);
      return coords;
    }
    geocodeCache.set(key, null);
    return null;
  } catch { return null; }
}

export function buildLocationString(company: Record<string, unknown>): string | null {
  const city = company.city as string | null;
  const state = company.state as string | null;
  const address = company.address as string | null;
  let rfCity: string | null = null;
  const extra = company.extra_data_rf;
  if (extra && typeof extra === 'object') {
    rfCity = (extra as Record<string, unknown>).cidade_rfb as string | null;
  }
  const effectiveCity = city || rfCity;
  if (effectiveCity) {
    const parts = [effectiveCity];
    if (state) parts.push(state);
    return parts.join(", ") + ", Brasil";
  }
  if (address) return address + ", Brasil";
  return null;
}
