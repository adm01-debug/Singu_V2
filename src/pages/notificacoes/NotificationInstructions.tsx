import { motion } from 'framer-motion';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';

const STEPS = [
  'Ative as notificações push clicando no botão "Ativar"',
  'Permita as notificações quando o navegador solicitar',
  'Instale o app na tela inicial para melhor experiência (recomendado)',
  'Você receberá alertas de follow-ups, aniversários e insights mesmo com o navegador fechado',
];

export function NotificationInstructions() {
  return (
    <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.3 }}>
      <Card>
        <CardHeader>
          <CardTitle>Como funcionam as notificações push</CardTitle>
        </CardHeader>
        <CardContent>
          <ul className="space-y-3 text-sm text-muted-foreground">
            {STEPS.map((step, i) => (
              <li key={i} className="flex items-start gap-3">
                <span className="flex-shrink-0 w-6 h-6 rounded-full bg-primary/10 text-primary flex items-center justify-center text-xs font-bold">
                  {i + 1}
                </span>
                <span>{step}</span>
              </li>
            ))}
          </ul>
          <div className="mt-6 p-4 bg-warning/10 rounded-lg">
            <p className="text-sm text-warning">
              <strong>Dica:</strong> Para receber notificações em dispositivos móveis, adicione o app à tela inicial do seu celular.
            </p>
          </div>
        </CardContent>
      </Card>
    </motion.div>
  );
}
