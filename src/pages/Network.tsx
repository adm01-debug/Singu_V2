import { motion } from 'framer-motion';
import { usePageTitle } from '@/hooks/usePageTitle';
import { SEOHead } from '@/components/seo/SEOHead';
import { AppLayout } from '@/components/layout/AppLayout';
import { Header } from '@/components/layout/Header';
import { NetworkVisualization } from '@/components/network/NetworkVisualization';
import { ErrorBoundary } from '@/components/feedback/ErrorBoundary';
import { SmartBreadcrumbs } from '@/components/navigation/SmartBreadcrumbs';
import { Card, CardContent } from '@/components/ui/card';
import { AlertTriangle, RefreshCw } from 'lucide-react';
import { Button } from '@/components/ui/button';

const NetworkErrorFallback = ({ error, resetErrorBoundary }: { error: Error; resetErrorBoundary: () => void }) => (
  <Card className="m-6">
    <CardContent className="flex flex-col items-center justify-center py-16">
      <div className="w-16 h-16 rounded-full bg-destructive/10 flex items-center justify-center mb-4">
        <AlertTriangle className="w-8 h-8 text-destructive" />
      </div>
      <h3 className="text-lg font-semibold mb-2">Erro ao carregar Network</h3>
      <p className="text-muted-foreground text-center mb-4 max-w-md">
        {error.message || 'Ocorreu um erro ao renderizar o mapa de relacionamentos.'}
      </p>
      <Button onClick={resetErrorBoundary} className="gap-2">
        <RefreshCw className="w-4 h-4" />
        Tentar novamente
      </Button>
    </CardContent>
  </Card>
);

const Network = () => {
  usePageTitle('Rede de Contatos');
  return (
    <AppLayout>
      <SEOHead title="Rede de Contatos" description="Grafo de relacionamentos e conexões" />
      <Header 
        title="Network Visualization" 
        subtitle="Mapa interativo de relacionamentos, empresas e contatos"
        hideBack
      />

      <div className="p-6 space-y-4">
        <SmartBreadcrumbs />
        
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.4 }}
        >
          <ErrorBoundary 
            fallback={<NetworkErrorFallback error={new Error('Erro desconhecido')} resetErrorBoundary={() => window.location.reload()} />}
          >
            <NetworkVisualization height={650} />
          </ErrorBoundary>
        </motion.div>
      </div>
    </AppLayout>
  );
};

export default Network;