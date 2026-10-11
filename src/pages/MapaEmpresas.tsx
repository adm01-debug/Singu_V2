import { useEffect, useMemo, useState, useCallback, useRef } from "react";
import { MapContainer, TileLayer } from "react-leaflet";
import L from "leaflet";
import "leaflet/dist/leaflet.css";
import "leaflet.markercluster/dist/MarkerCluster.css";
import "leaflet.markercluster/dist/MarkerCluster.Default.css";
import "leaflet.markercluster";
import { supabase } from "@/integrations/supabase/client";
import { logger } from "@/lib/logger";
import { useQuery, useQueryClient } from "@tanstack/react-query";
import { Badge } from "@/components/ui/badge";
import { Slider } from "@/components/ui/slider";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Label } from "@/components/ui/label";
import { MapPin, Filter, X, Loader2, Building2 } from "lucide-react";
import { Button } from "@/components/ui/button";
import { AppLayout } from "@/components/layout/AppLayout";
import { Header } from "@/components/layout/Header";
import { usePageTitle } from "@/hooks/usePageTitle";
import { SEOHead } from "@/components/seo/SEOHead";
import { toast } from "sonner";
import { MarkerClusterLayer, MappableCompany } from "./mapa/MapMarkerCluster";
import { geocode, buildLocationString } from "./mapa/geocoding";
import { useAuth } from "@/hooks/useAuth";
import type { Company } from "@/hooks/useCompanies";
import { fetchMapCompanies } from "./mapa/companyQueries";

// Fix default marker icon
delete (L.Icon.Default.prototype as { _getIconUrl?: () => string })._getIconUrl;
L.Icon.Default.mergeOptions({
  iconRetinaUrl: "https://cdnjs.cloudflare.com/ajax/libs/leaflet/1.9.4/images/marker-icon-2x.png",
  iconUrl: "https://cdnjs.cloudflare.com/ajax/libs/leaflet/1.9.4/images/marker-icon.png",
  shadowUrl: "https://cdnjs.cloudflare.com/ajax/libs/leaflet/1.9.4/images/marker-shadow.png",
});

type CompanyWithScore = Company & Pick<MappableCompany, 'relationship_score'>;

function toMappable(c: CompanyWithScore, lat: number, lng: number): MappableCompany {
  return {
    id: c.id, name: c.name, nome_crm: c.nome_crm, ramo_atividade: c.ramo_atividade,
    status: c.status, cnpj: c.cnpj, email: c.email, phone: c.phone,
    website: c.website, city: c.city, state: c.state, lat, lng,
    relationship_score: c.relationship_score,
  };
}

export default function MapaEmpresas() {
  usePageTitle("Mapa de Empresas");
  const { user } = useAuth();
  const [minScore, setMinScore] = useState(0);
  const [selectedSector, setSelectedSector] = useState("all");
  const [showFilters, setShowFilters] = useState(true);
  const [mappedCompanies, setMappedCompanies] = useState<MappableCompany[]>([]);
  const [isGeocoding, setIsGeocoding] = useState(false);
  const [geocodingProgress, setGeocodingProgress] = useState(0);
  const [geocodingTotal, setGeocodingTotal] = useState(0);
  const [geocodingFailed, setGeocodingFailed] = useState(0);
  const queryClient = useQueryClient();
  const processedRef = useRef<CompanyWithScore[] | null>(null);

  const { data: rawCompanies, isLoading, error: companiesError } = useQuery({
    queryKey: ["companies-map-data", user?.id],
    enabled: !!user,
    queryFn: async () => {
      return fetchMapCompanies(user!.id);
    },
    staleTime: 5 * 60 * 1000,
    refetchOnWindowFocus: false,
  });

  const processAndGeocode = useCallback(async (retryMissing = false) => {
    if (!user || !rawCompanies || isGeocoding) return;
    const alreadyMapped: MappableCompany[] = [];
    const needsGeocoding: typeof rawCompanies = [];
    for (const c of rawCompanies) {
      if (c.lat != null && c.lng != null && Number.isFinite(c.lat) && Number.isFinite(c.lng)) {
        alreadyMapped.push(toMappable(c, c.lat, c.lng));
      } else {
        const loc = buildLocationString({ city: c.city, state: c.state, address: c.address, extra_data_rf: c.extra_data_rf });
        if (loc) needsGeocoding.push(c);
      }
    }
    setMappedCompanies(alreadyMapped);
    if (needsGeocoding.length === 0) return;
    setIsGeocoding(true); setGeocodingTotal(needsGeocoding.length); setGeocodingProgress(0); setGeocodingFailed(0);
    const newResults: MappableCompany[] = [...alreadyMapped];
    let geocoded = 0;
    let failed = 0;
    for (const c of needsGeocoding) {
      const loc = buildLocationString({ city: c.city, state: c.state, address: c.address, extra_data_rf: c.extra_data_rf });
      if (!loc) continue;
      try {
        const coords = await geocode(loc, undefined, retryMissing);
        if (coords) {
          const primaryAddress = [...c.company_addresses].sort((a, b) =>
            Number(b.is_primary === true) - Number(a.is_primary === true) || a.id.localeCompare(b.id))[0];
          const { error: geoError } = primaryAddress
            ? await supabase.from("company_addresses").update({ latitude: coords.lat, longitude: coords.lng }).eq("company_id", c.id).eq("id", primaryAddress.id).select('id').single()
            : await supabase.from("company_addresses").insert({ company_id: c.id, cidade: c.city, estado: c.state, latitude: coords.lat, longitude: coords.lng, is_primary: true });
          if (geoError) throw geoError;
          newResults.push(toMappable(c, coords.lat, coords.lng));
          geocoded++;
        } else {
          failed++;
        }
      } catch (error) {
        failed++;
        logger.error('Erro ao geolocalizar empresa:', error);
        toast.error(`Não foi possível geolocalizar ${c.name}.`);
      }
      setGeocodingProgress(prev => prev + 1);
      await new Promise(r => setTimeout(r, 1100));
    }
    setMappedCompanies(newResults); setGeocodingFailed(failed); setIsGeocoding(false);
    if (geocoded > 0) { toast.success(`${geocoded} empresas geolocalizadas com sucesso`); queryClient.invalidateQueries({ queryKey: ["companies-map-data"] }); }
  }, [user, rawCompanies, isGeocoding, queryClient]);

  useEffect(() => {
    if (rawCompanies && rawCompanies !== processedRef.current && !isGeocoding) {
      processedRef.current = rawCompanies;
      processAndGeocode();
    }
  }, [rawCompanies, isGeocoding, processAndGeocode]);

  const sectors = useMemo(() => { const s = new Set<string>(); mappedCompanies.forEach(c => { if (c.ramo_atividade) s.add(c.ramo_atividade); }); return Array.from(s).sort(); }, [mappedCompanies]);
  const filtered = useMemo(() => mappedCompanies.filter(c => (minScore === 0 || (c.relationship_score !== null && c.relationship_score >= minScore)) && (selectedSector === "all" || c.ramo_atividade === selectedSector)), [mappedCompanies, minScore, selectedSector]);
  const hasActiveFilters = minScore > 0 || selectedSector !== "all";
  const clearFilters = () => { setMinScore(0); setSelectedSector("all"); };

  return (
    <AppLayout>
      <SEOHead title="Mapa de Empresas" description="Visualização geográfica da carteira de clientes" />
      <Header title="Mapa de Empresas" subtitle="Visualize a localização geográfica dos seus clientes" hideBack />
      <div className="p-4 md:p-6 space-y-4">
        <div className="flex items-center justify-between flex-wrap gap-3">
          <div className="flex items-center gap-3">
            <div className="p-2 rounded-lg bg-primary/10"><MapPin className="h-5 w-5 text-primary" /></div>
            <div><p className="text-sm font-medium text-foreground">{filtered.length} empresas no mapa{hasActiveFilters && " (filtrado)"}</p><p className="text-xs text-muted-foreground">{rawCompanies?.length ?? 0} carregadas · {mappedCompanies.length} geolocalizadas</p></div>
          </div>
          <div className="flex gap-2 items-center">
            {geocodingFailed > 0 && <Button variant="outline" size="sm" disabled={isGeocoding} onClick={() => processAndGeocode(true)}>Tentar geolocalização novamente ({geocodingFailed})</Button>}
            {isGeocoding && <div className="flex items-center gap-1.5 text-xs text-primary"><Loader2 className="h-3.5 w-3.5 animate-spin" />Geolocalizando... {geocodingProgress}/{geocodingTotal}</div>}
            <Button variant={showFilters ? "default" : "outline"} size="sm" className="gap-1.5 text-xs" onClick={() => setShowFilters(!showFilters)}><Filter className="h-3.5 w-3.5" />Filtros{hasActiveFilters && <Badge variant="secondary" className="ml-1 h-4 w-4 p-0 flex items-center justify-center text-[9px]">!</Badge>}</Button>
            {hasActiveFilters && <Button variant="ghost" size="sm" className="gap-1.5 text-xs text-muted-foreground" onClick={clearFilters}><X className="h-3.5 w-3.5" /> Limpar</Button>}
          </div>
        </div>

        {showFilters && (
          <div className="rounded-lg border border-border/60 bg-card p-4 space-y-4">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label className="text-xs text-muted-foreground">Score mínimo: <span className="text-primary font-mono font-bold">{minScore}</span></Label>
                <Slider value={[minScore]} onValueChange={([v]) => setMinScore(v)} min={0} max={100} step={5} />
                <div className="flex justify-between text-[10px] text-muted-foreground font-mono"><span>0</span><span>25</span><span>50</span><span>75</span><span>100</span></div>
              </div>
              <div className="space-y-2">
                <Label className="text-xs text-muted-foreground">Setor</Label>
                <Select value={selectedSector} onValueChange={setSelectedSector}><SelectTrigger className="h-9 text-sm"><SelectValue placeholder="Todos os setores" /></SelectTrigger><SelectContent><SelectItem value="all">Todos os setores</SelectItem>{sectors.map(s => <SelectItem key={s} value={s}>{s}</SelectItem>)}</SelectContent></Select>
              </div>
            </div>
            <div className="flex items-center gap-4 text-[10px] text-muted-foreground pt-1 border-t border-border/30">
              {[{ color: 'bg-success/80', label: 'Score ≥ 70' }, { color: 'bg-warning/80', label: 'Score 40–69' }, { color: 'bg-destructive/80', label: 'Score < 40' }, { color: 'bg-primary/80', label: 'Sem score' }].map(l => <span key={l.label} className="flex items-center gap-1"><span className={`w-2.5 h-2.5 rounded-full ${l.color}`} />{l.label}</span>)}
              <span className="ml-auto font-mono">{filtered.length} resultados</span>
            </div>
          </div>
        )}

        <div className="rounded-lg border border-border/60 overflow-hidden" style={{ height: "calc(100vh - 320px)", minHeight: 400 }}>
          {isLoading ? (
            <div className="h-full flex flex-col items-center justify-center gap-3"><Loader2 className="h-8 w-8 animate-spin text-primary" /><p className="text-sm text-muted-foreground">Carregando empresas...</p></div>
          ) : companiesError ? (
            <div role="alert" className="h-full flex items-center justify-center text-destructive">Falha ao carregar empresas: {companiesError.message}</div>
          ) : mappedCompanies.length === 0 && !isGeocoding ? (
            <div className="h-full flex flex-col items-center justify-center gap-3 text-muted-foreground"><Building2 className="h-12 w-12 opacity-30" /><p className="text-sm">Nenhuma empresa com localização disponível</p><p className="text-xs">Empresas precisam ter cidade no cadastro para aparecer no mapa</p></div>
          ) : (
            <MapContainer center={filtered.length > 0 ? [filtered[0].lat, filtered[0].lng] : [-14.235, -51.925]} zoom={4} style={{ height: "100%", width: "100%" }} className="z-0">
              <TileLayer attribution='&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a>' url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png" />
              <MarkerClusterLayer companies={filtered} />
            </MapContainer>
          )}
        </div>
      </div>
    </AppLayout>
  );
}
