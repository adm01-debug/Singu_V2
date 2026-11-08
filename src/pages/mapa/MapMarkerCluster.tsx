import { useEffect, useRef } from 'react';
import { useMap } from 'react-leaflet';
import L from 'leaflet';
import 'leaflet.markercluster';
import { createCompanyPopup } from './companyPopup';

const SHADOW = "https://cdnjs.cloudflare.com/ajax/libs/leaflet/1.9.4/images/marker-shadow.png";
const mkIcon = (color: string) => new L.Icon({
  iconUrl: `https://raw.githubusercontent.com/pointhi/leaflet-color-markers/master/img/marker-icon-${color}.png`,
  shadowUrl: SHADOW,
  iconSize: [25, 41], iconAnchor: [12, 41], popupAnchor: [1, -34], shadowSize: [41, 41],
});
const greenIcon = mkIcon("green");
const goldIcon = mkIcon("gold");
const redIcon = mkIcon("red");
const blueIcon = mkIcon("blue");

function getIcon(score: number | null) {
  if (score === null) return blueIcon;
  if (score >= 70) return greenIcon;
  if (score >= 40) return goldIcon;
  if (score > 0) return redIcon;
  return blueIcon;
}

export interface MappableCompany {
  id: string;
  name: string;
  nome_crm: string | null;
  ramo_atividade: string | null;
  status: string | null;
  cnpj: string | null;
  email: string | null;
  phone: string | null;
  website: string | null;
  city: string | null;
  state: string | null;
  lat: number;
  lng: number;
  relationship_score: number | null;
}

export function MarkerClusterLayer({ companies }: { companies: MappableCompany[] }) {
  const map = useMap();
  const clusterRef = useRef<L.MarkerClusterGroup | null>(null);

  useEffect(() => {
    if (clusterRef.current) map.removeLayer(clusterRef.current);

    const cluster = L.markerClusterGroup({
      chunkedLoading: true, maxClusterRadius: 50, spiderfyOnMaxZoom: true, showCoverageOnHover: false,
      iconCreateFunction: (c: { getChildCount: () => number }) => {
        const count = c.getChildCount();
        const size = count > 50 ? 48 : count > 10 ? 40 : 32;
        return L.divIcon({
          html: `<div style="background:hsl(var(--primary));color:hsl(var(--primary-foreground));border-radius:50%;width:${size}px;height:${size}px;display:flex;align-items:center;justify-content:center;font-weight:700;font-size:${size > 40 ? 14 : 12}px;box-shadow:0 0 12px hsl(var(--primary)/0.4);border:2px solid hsl(var(--background)/0.3);">${count}</div>`,
          className: "", iconSize: L.point(size, size),
        });
      },
    });

    companies.forEach((company) => {
      const marker = L.marker([company.lat, company.lng], { icon: getIcon(company.relationship_score) });
      marker.bindPopup(createCompanyPopup(company));
      cluster.addLayer(marker);
    });

    map.addLayer(cluster);
    clusterRef.current = cluster;

    if (companies.length > 0) {
      const bounds = L.latLngBounds(companies.map((c) => [c.lat, c.lng]));
      map.fitBounds(bounds, { padding: [40, 40], maxZoom: 14 });
    }

    return () => { if (clusterRef.current) map.removeLayer(clusterRef.current); };
  }, [companies, map]);

  return null;
}
