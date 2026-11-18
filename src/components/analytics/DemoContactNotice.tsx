import { Link } from 'react-router-dom';
import { Info } from 'lucide-react';
import { Alert, AlertDescription } from '@/components/ui/alert';

/**
 * Aviso de modo demonstração.
 *
 * Os painéis de PNL e de gatilhos avançados aceitam `contact` e, quando não
 * recebem nenhum, caem em `DEMO_CONTACT` (src/domain/demoEntities.ts) — um
 * contato fictício com DISC, temperamento e escores inventados para servir de
 * material de treino. Em /analytics esses painéis são montados sem contato,
 * então toda a análise exibida ali é sobre essa persona, não sobre a carteira
 * do usuário. Este aviso diz isso de forma explícita e aponta a tela que
 * analisa um contato real.
 */
export function DemoContactNotice() {
  return (
    <Alert>
      <Info className="h-4 w-4" />
      <AlertDescription>
        Modo demonstração: as análises abaixo usam um contato fictício, para conhecer as
        ferramentas. Para analisar alguém da sua carteira, use{' '}
        <Link to="/nlp-analytics" className="font-medium underline underline-offset-4">
          Análise PNL
        </Link>
        , que permite escolher o contato.
      </AlertDescription>
    </Alert>
  );
}
