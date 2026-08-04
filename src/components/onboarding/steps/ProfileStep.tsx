import { motion } from 'framer-motion';
import { User, Building2, Briefcase, Phone, ArrowRight, ArrowLeft } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';

interface ProfileStepProps {
  data: {
    firstName: string;
    lastName: string;
    companyName: string;
    roleTitle: string;
    phone: string;
  };
  onUpdate: (updates: Partial<ProfileStepProps['data']>) => void;
  onNext: () => void;
  onBack: () => void;
}

const ProfileStep = ({ data, onUpdate, onNext, onBack }: ProfileStepProps) => {
  const isValid = data.firstName.length >= 2 && data.lastName.length >= 2;

  return (
    <div>
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        className="text-center mb-8"
      >
        <div className="w-16 h-16 rounded-2xl bg-primary/10 flex items-center justify-center mx-auto mb-4">
          <User className="w-8 h-8 text-primary" />
        </div>
        <h2 className="text-2xl font-bold text-foreground mb-2">Configure seu Perfil</h2>
        <p className="text-muted-foreground">
          Essas informações ajudam a personalizar sua experiência
        </p>
      </motion.div>

      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.1 }}
        className="space-y-6 max-w-md mx-auto"
      >
        <div className="grid grid-cols-2 gap-4">
          <div className="space-y-2">
            <Label htmlFor="firstName">Nome *</Label>
            <div className="relative">
              <User className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
              <Input
                id="firstName"
                placeholder="João"
                value={data.firstName}
                onChange={(e) => onUpdate({ firstName: e.target.value })}
                className="pl-10"
              />
            </div>
          </div>
          <div className="space-y-2">
            <Label htmlFor="lastName">Sobrenome *</Label>
            <Input
              id="lastName"
              placeholder="Silva"
              value={data.lastName}
              onChange={(e) => onUpdate({ lastName: e.target.value })}
            />
          </div>
        </div>

        <div className="space-y-2">
          <Label htmlFor="companyName">Empresa</Label>
          <div className="relative">
            <Building2 className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
            <Input
              id="companyName"
              placeholder="Sua empresa (opcional)"
              value={data.companyName}
              onChange={(e) => onUpdate({ companyName: e.target.value })}
              className="pl-10"
            />
          </div>
        </div>

        <div className="space-y-2">
          <Label htmlFor="roleTitle">Cargo</Label>
          <div className="relative">
            <Briefcase className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
            <Input
              id="roleTitle"
              placeholder="Gerente de Vendas (opcional)"
              value={data.roleTitle}
              onChange={(e) => onUpdate({ roleTitle: e.target.value })}
              className="pl-10"
            />
          </div>
        </div>

        <div className="space-y-2">
          <Label htmlFor="phone">Telefone</Label>
          <div className="relative">
            <Phone className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
            <Input
              id="phone"
              placeholder="(11) 99999-9999 (opcional)"
              value={data.phone}
              onChange={(e) => onUpdate({ phone: e.target.value })}
              className="pl-10"
            />
          </div>
        </div>
      </motion.div>

      <motion.div
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        transition={{ delay: 0.3 }}
        className="flex items-center justify-between mt-10 max-w-md mx-auto"
      >
        <Button variant="ghost" onClick={onBack}>
          <ArrowLeft className="w-4 h-4 mr-2" />
          Voltar
        </Button>
        <Button 
          onClick={onNext}
          disabled={!isValid}
          className="bg-gradient-primary hover:opacity-90"
        >
          Continuar
          <ArrowRight className="w-4 h-4 ml-2" />
        </Button>
      </motion.div>
    </div>
  );
};

export default ProfileStep;
