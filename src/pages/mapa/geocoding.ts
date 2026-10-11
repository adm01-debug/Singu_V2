const geocodeCache = new Map<string, { lat: number; lng: number } | null>();

export async function geocode(location: string, signal?: AbortSignal): Promise<{ lat: number; lng: number } | null> {
  const key = location.trim().toLowerCase();
  if (geocodeCache.has(key)) return geocodeCache.get(key) ?? null;
  const res = await fetch(
    `https://nominatim.openstreetmap.org/search?format=json&limit=1&countrycodes=br&q=${encodeURIComponent(location)}`,
    { headers: { "User-Agent": "SINGU-CRM/1.0" }, signal }
  );
  if (!res.ok) throw new Error(`Falha na geocodificação: HTTP ${res.status}.`);
  const data: unknown = await res.json();
  if (!Array.isArray(data)) throw new Error('Resposta inválida do serviço de geocodificação.');
  if (data.length === 0) {
    geocodeCache.set(key, null);
    return null;
  }
  const first: unknown = data[0];
  if (!first || typeof first !== 'object' || !('lat' in first) || typeof first.lat !== 'string' || !first.lat.trim() || !('lon' in first) || typeof first.lon !== 'string' || !first.lon.trim()) {
    throw new Error('Coordenadas inválidas na resposta de geocodificação.');
  }
  const coords = { lat: Number(first.lat), lng: Number(first.lon) };
  if (!Number.isFinite(coords.lat) || !Number.isFinite(coords.lng) || Math.abs(coords.lat) > 90 || Math.abs(coords.lng) > 180) {
    throw new Error('Coordenadas inválidas na resposta de geocodificação.');
  }
  geocodeCache.set(key, coords);
  return coords;
}

export function buildLocationString(company: { city: string | null; state: string | null; address: string | null; extra_data_rf: unknown }): string | null {
  const { city, state, address } = company;
  let rfCity: string | null = null;
  const extra = company.extra_data_rf;
  if (extra && typeof extra === 'object' && 'cidade_rfb' in extra && typeof extra.cidade_rfb === 'string') {
    rfCity = extra.cidade_rfb;
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
