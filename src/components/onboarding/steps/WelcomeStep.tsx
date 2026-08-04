import { motion } from 'framer-motion';
import { Sparkles, Users, Brain, TrendingUp, ArrowRight, Zap } from 'lucide-react';
import { Button } from '@/components/ui/button';

interface WelcomeStepProps {
  onNext: () => void;
}

const features = [
  {
    icon: Users,
    title: 'Gestão Inteligente de Contatos',
    description: 'Organize seus relacionamentos com perfis ricos e contextualizados.',
  },
  {
    icon: Brain,
    title: 'Análise Comportamental DISC',
    description: 'Entenda como abordar cada contato para maximizar resultados.',
  },
  {
    icon: TrendingUp,
    title: 'Insights Proativos',
    description: 'Receba sugestões automáticas para fortalecer relacionamentos.',
  },
];

const WelcomeStep = ({ onNext }: WelcomeStepProps) => {
  return (
    <div className="text-center">
      <motion.div
        initial={{ scale: 0 }}
        animate={{ scale: 1 }}
        transition={{ type: 'spring', duration: 0.6 }}
        className="w-20 h-20 rounded-3xl bg-gradient-primary flex items-center justify-center mx-auto mb-8 shadow-glow"
      >
        <Zap className="w-10 h-10 text-primary-foreground" />
      </motion.div>

      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.2 }}
      >
        <h1 className="text-4xl font-bold text-foreground mb-4">
          Bem-vindo ao <span className="gradient-text">SINGU</span>
        </h1>
        <p className="text-lg text-muted-foreground max-w-lg mx-auto mb-12">
          Vamos configurar sua conta em poucos minutos para você começar a 
          transformar relacionamentos em resultados.
        </p>
      </motion.div>

      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.4 }}
        className="grid md:grid-cols-3 gap-6 mb-12"
      >
        {features.map((feature, index) => {
          const Icon = feature.icon;
          return (
            <motion.div
              key={index}
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.5 + index * 0.1 }}
              className="p-6 rounded-2xl bg-card border border-border hover:border-primary/30 hover:shadow-sm transition-all duration-300 group"
            >
              <div className="w-12 h-12 rounded-xl bg-primary/10 flex items-center justify-center mb-4 mx-auto group-hover:bg-gradient-primary group-hover:text-primary-foreground transition-all duration-300">
                <Icon className="w-6 h-6 text-primary group-hover:text-primary-foreground" />
              </div>
              <h3 className="font-semibold text-foreground mb-2">{feature.title}</h3>
              <p className="text-sm text-muted-foreground">{feature.description}</p>
            </motion.div>
          );
        })}
      </motion.div>

      <motion.div
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        transition={{ delay: 0.8 }}
      >
        <Button
          size="lg"
          onClick={onNext}
          className="bg-gradient-primary hover:opacity-90 shadow-glow px-8"
        >
          <span>Começar Configuração</span>
          <ArrowRight className="w-5 h-5 ml-2" />
        </Button>
        <p className="text-xs text-muted-foreground mt-4">
          <Sparkles className="w-3 h-3 inline mr-1" />
          Leva apenas 2 minutos
        </p>
      </motion.div>
    </div>
  );
};

export default WelcomeStep;
