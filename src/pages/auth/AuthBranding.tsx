import { motion } from 'framer-motion';
import { Zap } from 'lucide-react';

const FEATURES = [
  { icon: '🎯', text: 'Perfil DISC automático' },
  { icon: '🧠', text: 'Análise emocional' },
  { icon: '💡', text: 'Insights proativos' },
  { icon: '📊', text: 'Score de relacionamento' },
];

const AVATARS = [
  { bg: 'bg-primary', initials: 'MS' },
  { bg: 'bg-accent', initials: 'JR' },
  { bg: 'bg-success', initials: 'AL' },
  { bg: 'bg-secondary', initials: 'PK' },
];

export function AuthBranding() {
  return (
    <div className="hidden lg:flex lg:w-1/2 relative overflow-hidden" style={{ background: 'var(--gradient-primary)' }}>
      <div className="absolute inset-0 bg-black/5" />
      
      {/* Geometric decorations */}
      <div className="absolute top-16 left-16 w-72 h-72 bg-foreground/8 rounded-3xl blur-3xl rotate-12" />
      <div className="absolute bottom-16 right-16 w-96 h-96 bg-foreground/5 rounded-full blur-3xl" />
      
      {/* Network lines */}
      <svg className="absolute inset-0 w-full h-full opacity-[0.06]" xmlns="http://www.w3.org/2000/svg">
        <defs>
          <pattern id="networkGrid" width="64" height="64" patternUnits="userSpaceOnUse">
            <circle cx="32" cy="32" r="1.5" fill="white" />
          </pattern>
        </defs>
        <rect width="100%" height="100%" fill="url(#networkGrid)" />
        <line x1="10%" y1="20%" x2="40%" y2="45%" stroke="white" strokeWidth="0.5" opacity="0.3" />
        <line x1="40%" y1="45%" x2="75%" y2="30%" stroke="white" strokeWidth="0.5" opacity="0.3" />
        <line x1="75%" y1="30%" x2="60%" y2="70%" stroke="white" strokeWidth="0.5" opacity="0.3" />
        <line x1="60%" y1="70%" x2="25%" y2="80%" stroke="white" strokeWidth="0.5" opacity="0.3" />
        <line x1="25%" y1="80%" x2="10%" y2="20%" stroke="white" strokeWidth="0.5" opacity="0.2" />
        <circle cx="10%" cy="20%" r="4" fill="white" opacity="0.15" />
        <circle cx="40%" cy="45%" r="5" fill="white" opacity="0.2" />
        <circle cx="75%" cy="30%" r="3.5" fill="white" opacity="0.15" />
        <circle cx="60%" cy="70%" r="4.5" fill="white" opacity="0.18" />
        <circle cx="25%" cy="80%" r="3" fill="white" opacity="0.12" />
      </svg>
      
      <div className="relative z-10 flex flex-col justify-center items-start p-16 text-primary-foreground">
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.6 }}
          className="flex items-center gap-4 mb-10"
        >
          <motion.div 
            className="w-14 h-14 rounded-2xl bg-foreground/15 backdrop-blur-xl flex items-center justify-center ring-1 ring-foreground/20"
            whileHover={{ rotate: [0, -10, 10, 0], scale: 1.1 }}
            transition={{ duration: 0.5 }}
          >
            <Zap className="w-7 h-7" aria-hidden="true" />
          </motion.div>
          <div>
            <h1 className="text-3xl font-bold tracking-tight">SINGU</h1>
            <p className="text-primary-foreground/60 text-sm tracking-widest uppercase">Inteligência Relacional</p>
          </div>
        </motion.div>

        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.6, delay: 0.2 }}
          className="space-y-5 max-w-lg"
        >
          <h2 className="text-5xl font-bold leading-[1.1] tracking-tight">
            Relacionamentos<br />
            <span className="text-primary-foreground/80">que convertem.</span>
          </h2>
          <p className="text-lg text-primary-foreground/65 leading-relaxed">
            CRM com análise comportamental profunda, insights automáticos e inteligência emocional para suas negociações.
          </p>
        </motion.div>

        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.6, delay: 0.4 }}
          className="mt-12 grid grid-cols-2 gap-3"
        >
          {FEATURES.map((feature, index) => (
            <motion.div 
              key={index} 
              className="flex items-center gap-3 bg-foreground/12 backdrop-blur-sm rounded-xl px-4 py-3.5 ring-1 ring-foreground/15"
              whileHover={{ scale: 1.02, backgroundColor: 'rgba(255,255,255,0.16)' }}
              transition={{ duration: 0.2 }}
            >
              <span className="text-xl" role="img" aria-hidden="true">{feature.icon}</span>
              <span className="text-sm font-medium text-primary-foreground">{feature.text}</span>
            </motion.div>
          ))}
        </motion.div>

        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ duration: 0.6, delay: 0.6 }}
          className="mt-10 flex items-center gap-3"
        >
          <div className="flex -space-x-2">
            {AVATARS.map((a, i) => (
              <div key={i} className={`w-8 h-8 rounded-full ${a.bg} ring-2 ring-foreground/20 flex items-center justify-center text-[10px] font-bold text-primary-foreground`}>
                {a.initials}
              </div>
            ))}
          </div>
          <p className="text-sm text-primary-foreground/70">
            <span className="font-semibold text-primary-foreground/90">+500 profissionais</span> já usam o SINGU
          </p>
        </motion.div>
      </div>
    </div>
  );
}
