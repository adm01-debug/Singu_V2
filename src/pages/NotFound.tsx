import { useLocation, Link } from "react-router-dom";
import { SEOHead } from '@/components/seo/SEOHead';
import { logger } from "@/lib/logger";
import { useEffect } from "react";
import { Home, ArrowLeft } from "lucide-react";
import { Button } from "@/components/ui/button";

const NotFound = () => {
  const location = useLocation();

  useEffect(() => {
    if (import.meta.env.DEV) {
      logger.error("404: Rota não encontrada:", location.pathname);
    }
  }, [location.pathname]);

  return (
    <>
      <SEOHead title="Página não encontrada" description="A página que você procura não existe" />
      <div className="flex min-h-screen items-center justify-center bg-background">
      <div className="text-center space-y-4 px-6">
        <h1 className="text-7xl font-bold text-primary">404</h1>
        <p className="text-xl text-foreground font-medium">
          Página não encontrada
        </p>
        <p className="text-muted-foreground max-w-md mx-auto">
          A página que você tentou acessar não existe ou foi movida.
        </p>
        <div className="flex flex-col sm:flex-row gap-3 justify-center pt-4">
          <Button variant="default" asChild>
            <Link to="/">
              <Home className="w-4 h-4 mr-2" />
              Ir para o início
            </Link>
          </Button>
          <Button variant="outline" onClick={() => window.history.back()}>
            <ArrowLeft className="w-4 h-4 mr-2" />
            Voltar
          </Button>
        </div>
      </div>
    </div>
    </>
  );
};

export default NotFound;
