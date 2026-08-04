import { Palette, Sun, Moon, Monitor } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Card, CardContent } from '@/components/ui/card';
import { useTheme } from '@/components/theme/ThemeProvider';

export function ThemeCustomizer() {
  const { theme, setTheme } = useTheme();

  return (
    <div className="space-y-6">
      <div className="flex items-start justify-between flex-wrap gap-4">
        <div>
          <h3 className="flex items-center gap-2 text-lg font-semibold">
            <Palette className="w-5 h-5 text-primary" />
            Nexus Design System
          </h3>
          <p className="text-sm text-muted-foreground">
            O sistema antigo de skins foi removido. O Nexus agora é o tema visual padrão.
          </p>
        </div>
      </div>

      <Card className="border-border/50">
        <CardContent className="pt-5 space-y-4">
          <div className="space-y-1">
            <p className="text-sm font-medium">Modo de Cor</p>
            <p className="text-sm text-muted-foreground">
              Apenas claro, escuro ou sistema — sem presets, skins ou sobrescritas legadas.
            </p>
          </div>

          <div className="flex flex-wrap gap-2">
            <Button
              variant={theme === 'light' ? 'default' : 'outline'}
              size="sm"
              onClick={() => setTheme('light')}
            >
              <Sun className="w-4 h-4 mr-1.5" /> Claro
            </Button>
            <Button
              variant={theme === 'dark' ? 'default' : 'outline'}
              size="sm"
              onClick={() => setTheme('dark')}
            >
              <Moon className="w-4 h-4 mr-1.5" /> Escuro
            </Button>
            <Button
              variant={theme === 'system' ? 'default' : 'outline'}
              size="sm"
              onClick={() => setTheme('system')}
            >
              <Monitor className="w-4 h-4 mr-1.5" /> Sistema
            </Button>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}

export default ThemeCustomizer;
