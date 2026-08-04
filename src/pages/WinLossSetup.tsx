import { Button } from '@/components/ui/button';
import { ArrowLeft } from 'lucide-react';
import { Link } from 'react-router-dom';
import { ReasonsEditor } from '@/components/win-loss/ReasonsEditor';
import { CompetitorEditor } from '@/components/win-loss/CompetitorEditor';
import { Helmet } from 'react-helmet-async';

export default function WinLossSetup() {
  return (
    <>
      <Helmet>
        <title>Configurar Win/Loss | SINGU</title>
        <meta name="description" content="Gerencie motivos e concorrentes para análise de Win/Loss." />
      </Helmet>
      <div className="container mx-auto p-4 md:p-6 space-y-4 max-w-5xl">
        <header className="flex items-center gap-3">
          <Button asChild variant="ghost" size="icon" aria-label="Voltar">
            <Link to="/win-loss"><ArrowLeft className="h-4 w-4" /></Link>
          </Button>
          <div>
            <h1 className="text-xl font-bold">Configuração Win/Loss</h1>
            <p className="text-xs text-muted-foreground">Motivos e concorrentes utilizados na captura.</p>
          </div>
        </header>

        <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
          <ReasonsEditor />
          <CompetitorEditor />
        </div>
      </div>
    </>
  );
}
