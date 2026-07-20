import { useRef, useState } from "react";
import { Camera, Loader2, ImageIcon, Sparkles, X } from "lucide-react";
import { Button } from "@/components/ui/button";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";
import { Badge } from "@/components/ui/badge";
import { Card, CardContent } from "@/components/ui/card";
import { ScrollArea } from "@/components/ui/scroll-area";
import { supabase } from "@/integrations/supabase/client";
import { toast } from "sonner";
import { logger } from "@/lib/logger";

type VisualResult = {
  id: string;
  name: string;
  description: string | null;
  category: string | null;
  image_url: string | null;
  price: number | null;
  similarity: number;
};

type Analysis = {
  description: string;
  keywords: string[];
  category: string | null;
  dominant_colors: string[];
};

interface VisualSearchButtonProps {
  onResultClick?: (result: VisualResult) => void;
  variant?: "default" | "outline" | "ghost" | "secondary";
  size?: "default" | "sm" | "lg" | "icon";
  className?: string;
}

const MAX_IMAGE_SIZE_MB = 5;

export function VisualSearchButton({
  onResultClick,
  variant = "outline",
  size = "default",
  className,
}: VisualSearchButtonProps) {
  const [open, setOpen] = useState(false);
  const [loading, setLoading] = useState(false);
  const [preview, setPreview] = useState<string | null>(null);
  const [analysis, setAnalysis] = useState<Analysis | null>(null);
  const [results, setResults] = useState<VisualResult[]>([]);
  const fileInputRef = useRef<HTMLInputElement>(null);

  const reset = () => {
    setPreview(null);
    setAnalysis(null);
    setResults([]);
  };

  const handleFileSelect = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    if (!file.type.startsWith("image/")) {
      toast.error("Selecione um arquivo de imagem.");
      return;
    }
    if (file.size > MAX_IMAGE_SIZE_MB * 1024 * 1024) {
      toast.error(`Imagem muito grande. Máximo ${MAX_IMAGE_SIZE_MB}MB.`);
      return;
    }

    const reader = new FileReader();
    reader.onload = async (event) => {
      const dataUrl = event.target?.result as string;
      setPreview(dataUrl);
      await runVisualSearch(dataUrl);
    };
    reader.readAsDataURL(file);
  };

  const runVisualSearch = async (dataUrl: string) => {
    setLoading(true);
    setAnalysis(null);
    setResults([]);
    try {
      const { data, error } = await supabase.functions.invoke("visual-search", {
        body: { image: dataUrl, limit: 12 },
      });

      if (error) throw error;
      if (data?.error) throw new Error(data.error);

      setAnalysis(data.analysis ?? null);
      setResults(data.results ?? []);

      if ((data.results ?? []).length === 0) {
        toast.info("Imagem analisada, mas nenhum produto similar encontrado.");
      } else {
        toast.success(`${data.results.length} produto(s) similar(es) encontrado(s).`);
      }
    } catch (e) {
      logger.error("Visual search failed:", e);
      const msg = e instanceof Error ? e.message : "Erro na busca visual";
      toast.error(msg);
    } finally {
      setLoading(false);
    }
  };

  return (
    <Dialog open={open} onOpenChange={(o) => { setOpen(o); if (!o) reset(); }}>
      <DialogTrigger asChild>
        <Button variant={variant} size={size} className={className}>
          <Camera className="h-4 w-4 mr-2" />
          Busca Visual
        </Button>
      </DialogTrigger>
      <DialogContent className="max-w-3xl max-h-[90vh] overflow-hidden flex flex-col">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <Sparkles className="h-5 w-5 text-primary" />
            Busca Visual por Imagem
          </DialogTitle>
          <DialogDescription>
            Envie uma foto de produto e a IA encontrará itens similares no seu catálogo.
          </DialogDescription>
        </DialogHeader>

        <div className="flex-1 overflow-hidden flex flex-col gap-4">
          {!preview ? (
            <div className="flex-1 flex items-center justify-center border-2 border-dashed border-border rounded-lg p-8">
              <div className="text-center space-y-4">
                <ImageIcon className="h-12 w-12 mx-auto text-muted-foreground" />
                <div>
                  <p className="font-medium">Selecione uma imagem</p>
                  <p className="text-sm text-muted-foreground">
                    PNG, JPG ou WEBP até {MAX_IMAGE_SIZE_MB}MB
                  </p>
                </div>
                <Button onClick={() => fileInputRef.current?.click()}>
                  <Camera className="h-4 w-4 mr-2" />
                  Escolher imagem
                </Button>
                <input
                  ref={fileInputRef}
                  type="file"
                  accept="image/*"
                  className="hidden"
                  onChange={handleFileSelect}
                />
              </div>
            </div>
          ) : (
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4 flex-1 overflow-hidden">
              <div className="space-y-3">
                <div className="relative rounded-lg overflow-hidden border border-border">
                  <img src={preview} alt="Preview" className="w-full aspect-square object-cover" />
                  <Button
                    size="icon"
                    variant="secondary"
                    className="absolute top-2 right-2 h-8 w-8"
                    onClick={reset}
                  >
                    <X className="h-4 w-4" />
                  </Button>
                </div>
                <Button
                  variant="outline"
                  size="sm"
                  className="w-full"
                  onClick={() => fileInputRef.current?.click()}
                >
                  Trocar imagem
                </Button>
                <input
                  ref={fileInputRef}
                  type="file"
                  accept="image/*"
                  className="hidden"
                  onChange={handleFileSelect}
                />

                {analysis && (
                  <Card>
                    <CardContent className="p-3 space-y-2 text-xs">
                      <p className="font-medium text-foreground">Análise da IA</p>
                      <p className="text-muted-foreground">{analysis.description}</p>
                      {analysis.category && (
                        <Badge variant="secondary" className="text-xs">{analysis.category}</Badge>
                      )}
                      <div className="flex flex-wrap gap-1">
                        {analysis.keywords.slice(0, 6).map((kw) => (
                          <Badge key={kw} variant="outline" className="text-xs">{kw}</Badge>
                        ))}
                      </div>
                    </CardContent>
                  </Card>
                )}
              </div>

              <div className="md:col-span-2 flex flex-col overflow-hidden">
                <p className="text-sm font-medium mb-2">
                  {loading ? "Analisando imagem..." : `${results.length} resultado(s)`}
                </p>
                <ScrollArea className="flex-1 pr-2">
                  {loading ? (
                    <div className="flex items-center justify-center py-12">
                      <Loader2 className="h-8 w-8 animate-spin text-primary" />
                    </div>
                  ) : results.length === 0 ? (
                    <div className="text-center py-12 text-sm text-muted-foreground">
                      Nenhum produto similar encontrado.
                    </div>
                  ) : (
                    <div className="grid grid-cols-2 gap-3">
                      {results.map((r) => (
                        <Card
                          key={r.id}
                          className="cursor-pointer hover:border-primary transition-colors"
                          onClick={() => {
                            onResultClick?.(r);
                            setOpen(false);
                          }}
                        >
                          <CardContent className="p-3 space-y-2">
                            {r.image_url ? (
                              <img
                                src={r.image_url}
                                alt={r.name}
                                className="w-full aspect-square object-cover rounded"
                              />
                            ) : (
                              <div className="w-full aspect-square bg-muted rounded flex items-center justify-center">
                                <ImageIcon className="h-8 w-8 text-muted-foreground" />
                              </div>
                            )}
                            <div>
                              <p className="text-sm font-medium line-clamp-2">{r.name}</p>
                              {r.category && (
                                <p className="text-xs text-muted-foreground">{r.category}</p>
                              )}
                              <div className="flex items-center justify-between mt-1">
                                {r.price != null && (
                                  <span className="text-xs font-semibold">
                                    {new Intl.NumberFormat("pt-BR", {
                                      style: "currency",
                                      currency: "BRL",
                                    }).format(Number(r.price))}
                                  </span>
                                )}
                                <Badge variant="secondary" className="text-xs">
                                  {Math.round(r.similarity * 100)}%
                                </Badge>
                              </div>
                            </div>
                          </CardContent>
                        </Card>
                      ))}
                    </div>
                  )}
                </ScrollArea>
              </div>
            </div>
          )}
        </div>
      </DialogContent>
    </Dialog>
  );
}
