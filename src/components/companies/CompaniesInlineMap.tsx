import { useMemo, useState } from 'react';
import { MapContainer, TileLayer, CircleMarker, Popup } from 'react-leaflet';
import { Map, X } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { cn } from '@/lib/utils';
import type { Company } from '@/hooks/useCompanies';
import { toTitleCase } from '@/lib/formatters';
import 'leaflet/dist/leaflet.css';

interface CompaniesInlineMapProps {
  companies: Company[];
  className?: string;
}

export function CompaniesInlineMap({ companies, className }: CompaniesInlineMapProps) {
  const [isVisible, setIsVisible] = useState(false);

  const geoCompanies = useMemo(() => 
    companies.filter(c => c.lat && c.lng && c.lat !== 0 && c.lng !== 0),
    [companies]
  );

  // Calculate center from average of all points
  const center = useMemo(() => {
    if (geoCompanies.length === 0) return { lat: -15.77, lng: -47.92 };
    const sumLat = geoCompanies.reduce((s, c) => s + (c.lat || 0), 0);
    const sumLng = geoCompanies.reduce((s, c) => s + (c.lng || 0), 0);
    return {
      lat: sumLat / geoCompanies.length,
      lng: sumLng / geoCompanies.length,
    };
  }, [geoCompanies]);

  if (geoCompanies.length === 0) return null;

  if (!isVisible) {
    return (
      <Button
        variant="outline"
        size="sm"
        onClick={() => setIsVisible(true)}
        className="gap-2"
      >
        <Map className="w-4 h-4" />
        Mapa ({geoCompanies.length})
      </Button>
    );
  }

  return (
    <div className={cn(
      'relative rounded-lg border border-border/40 overflow-hidden',
      'h-[200px] w-full',
      className
    )}>
      <Button
        variant="ghost"
        size="icon"
        className="absolute top-2 right-2 z-[1000] h-7 w-7 bg-background/80 backdrop-blur-sm"
        onClick={() => setIsVisible(false)}
        aria-label="Fechar mapa"
      >
        <X className="w-4 h-4" />
      </Button>
      <MapContainer
        center={[center.lat, center.lng]}
        zoom={5}
        style={{ height: '100%', width: '100%' }}
        zoomControl={false}
        attributionControl={false}
      >
        <TileLayer url="https://{s}.basemaps.cartocdn.com/dark_all/{z}/{x}/{y}{r}.png" />
        {geoCompanies.map(company => (
          <CircleMarker
            key={company.id}
            center={[company.lat!, company.lng!]}
            radius={5}
            pathOptions={{
              color: company.is_customer ? 'hsl(142, 71%, 45%)' : 'hsl(263, 70%, 50%)',
              fillColor: company.is_customer ? 'hsl(142, 71%, 45%)' : 'hsl(263, 70%, 50%)',
              fillOpacity: 0.7,
              weight: 1,
            }}
          >
            <Popup>
              <span className="text-xs font-medium">{toTitleCase(company.name)}</span>
            </Popup>
          </CircleMarker>
        ))}
      </MapContainer>
    </div>
  );
}
