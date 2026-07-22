import { useState, useCallback } from 'react';
import { motion } from 'framer-motion';
import { 
  Upload, FileSpreadsheet, Check, AlertCircle, 
  ArrowRight, ArrowLeft, Download, Users 
} from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Progress } from '@/components/ui/progress';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/hooks/useAuth';
import { toast } from 'sonner';
import { logger } from "@/lib/logger";

interface ImportStepProps {
  onImport: (count: number) => void;
  onNext: () => void;
  onBack: () => void;
}

interface ParsedContact {
  first_name: string;
  last_name: string;
  email?: string;
  phone?: string;
  company?: string;
  role_title?: string;
}

const ImportStep = ({ onImport, onNext, onBack }: ImportStepProps) => {
  const { user } = useAuth();
  const [isDragging, setIsDragging] = useState(false);
  const [, setFile] = useState<File | null>(null);
  const [importing, setImporting] = useState(false);
  const [importProgress, setImportProgress] = useState(0);
  const [importedCount, setImportedCount] = useState(0);
  const [error, setError] = useState<string | null>(null);

  const parseCSV = (text: string): ParsedContact[] => {
    const lines = text.split('\n').filter(line => line.trim());
    if (lines.length < 2) return [];

    const headers = lines[0].split(',').map(h => h.trim().toLowerCase());
    const contacts: ParsedContact[] = [];

    for (let i = 1; i < lines.length; i++) {
      const values = lines[i].split(',').map(v => v.trim().replace(/^"|"$/g, ''));
      
      const contact: ParsedContact = {
        first_name: '',
        last_name: '',
      };

      headers.forEach((header, index) => {
        const value = values[index] || '';
        
        if (header.includes('primeiro') || header.includes('first') || header === 'nome') {
          contact.first_name = value;
        } else if (header.includes('sobrenome') || header.includes('last') || header.includes('último')) {
          contact.last_name = value;
        } else if (header.includes('email') || header.includes('e-mail')) {
          contact.email = value;
        } else if (header.includes('telefone') || header.includes('phone') || header.includes('celular')) {
          contact.phone = value;
        } else if (header.includes('empresa') || header.includes('company') || header.includes('organização')) {
          contact.company = value;
        } else if (header.includes('cargo') || header.includes('role') || header.includes('título')) {
          contact.role_title = value;
        }
      });

      // Handle single "nome" field containing full name
      if (!contact.last_name && contact.first_name.includes(' ')) {
        const parts = contact.first_name.split(' ');
        contact.first_name = parts[0];
        contact.last_name = parts.slice(1).join(' ');
      }

      if (contact.first_name && contact.last_name) {
        contacts.push(contact);
      }
    }

    return contacts;
  };

  const handleFile = useCallback(async (selectedFile: File) => {
    setFile(selectedFile);
    setError(null);
    setImporting(true);
    setImportProgress(0);

    try {
      const text = await selectedFile.text();
      const contacts = parseCSV(text);

      if (contacts.length === 0) {
        throw new Error('Nenhum contato válido encontrado no arquivo');
      }

      // Import contacts in batches
      const batchSize = 10;
      let imported = 0;

      for (let i = 0; i < contacts.length; i += batchSize) {
        const batch = contacts.slice(i, i + batchSize);
        
        const { error: insertError } = await supabase
          .from('contacts')
          .insert(
            batch.map(contact => ({
              user_id: user?.id,
              first_name: contact.first_name,
              last_name: contact.last_name,
              email: contact.email || null,
              phone: contact.phone || null,
              role_title: contact.role_title || null,
            }))
          );

        if (insertError) {
          logger.error('Batch insert error:', insertError);
        } else {
          imported += batch.length;
        }

        setImportProgress(Math.round((i + batch.length) / contacts.length * 100));
      }

      setImportedCount(imported);
      onImport(imported);
      toast.success(`${imported} contatos importados com sucesso!`);
    } catch (err) {
      logger.error('Import error:', err);
      setError(err instanceof Error ? err.message : 'Erro ao importar arquivo');
    } finally {
      setImporting(false);
    }
  }, [user]);

  const handleDrop = useCallback((e: React.DragEvent) => {
    e.preventDefault();
    setIsDragging(false);

    const droppedFile = e.dataTransfer.files[0];
    if (droppedFile && droppedFile.type === 'text/csv') {
      handleFile(droppedFile);
    } else {
      setError('Por favor, selecione um arquivo CSV');
    }
  }, [handleFile]);

  const handleFileSelect = (e: React.ChangeEvent<HTMLInputElement>) => {
    const selectedFile = e.target.files?.[0];
    if (selectedFile) {
      handleFile(selectedFile);
    }
  };

  const downloadTemplate = () => {
    const template = 'primeiro_nome,sobrenome,email,telefone,empresa,cargo\nJoão,Silva,joao@email.com,(11)99999-9999,Empresa ABC,Gerente\nMaria,Santos,maria@email.com,(21)88888-8888,Empresa XYZ,Diretora';
    const blob = new Blob([template], { type: 'text/csv' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = 'template_contatos.csv';
    a.click();
    URL.revokeObjectURL(url);
  };

  return (
    <div>
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        className="text-center mb-8"
      >
        <div className="w-16 h-16 rounded-2xl bg-primary/10 flex items-center justify-center mx-auto mb-4">
          <Upload className="w-8 h-8 text-primary" />
        </div>
        <h2 className="text-2xl font-bold text-foreground mb-2">Importe seus Contatos</h2>
        <p className="text-muted-foreground">
          Traga seus contatos de uma planilha CSV para começar rapidamente
        </p>
      </motion.div>

      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.1 }}
        className="max-w-md mx-auto"
      >
        {importedCount > 0 ? (
          <div className="text-center p-8 rounded-2xl bg-success/10 border border-success/20">
            <div className="w-16 h-16 rounded-full bg-success flex items-center justify-center mx-auto mb-4">
              <Check className="w-8 h-8 text-success-foreground" />
            </div>
            <h3 className="text-xl font-semibold text-foreground mb-2">
              {importedCount} contatos importados!
            </h3>
            <p className="text-muted-foreground mb-4">
              Seus contatos foram adicionados com sucesso ao SINGU
            </p>
            <div className="flex items-center justify-center gap-2 text-sm text-success">
              <Users className="w-4 h-4" />
              <span>Pronto para usar</span>
            </div>
          </div>
        ) : (
          <>
            <div
              onDragOver={(e) => { e.preventDefault(); setIsDragging(true); }}
              onDragLeave={() => setIsDragging(false)}
              onDrop={handleDrop}
              className={`relative border-2 border-dashed rounded-2xl p-8 text-center transition-all duration-300 ${
                isDragging 
                  ? 'border-primary bg-primary/5' 
                  : error 
                    ? 'border-destructive bg-destructive/5'
                    : 'border-border hover:border-primary/50'
              }`}
            >
              {importing ? (
                <div className="py-4">
                  <FileSpreadsheet className="w-12 h-12 text-primary mx-auto mb-4 animate-pulse" />
                  <p className="text-sm text-foreground mb-4">Importando contatos...</p>
                  <Progress value={importProgress} className="h-2 mb-2" />
                  <p className="text-xs text-muted-foreground">{importProgress}% concluído</p>
                </div>
              ) : (
                <>
                  <Upload className={`w-12 h-12 mx-auto mb-4 ${error ? 'text-destructive' : 'text-muted-foreground'}`} />
                  <p className="text-foreground font-medium mb-2">
                    Arraste seu arquivo CSV aqui
                  </p>
                  <p className="text-sm text-muted-foreground mb-4">
                    ou clique para selecionar
                  </p>
                  <input
                    type="file"
                    accept=".csv"
                    onChange={handleFileSelect}
                    className="absolute inset-0 w-full h-full opacity-0 cursor-pointer"
                  />
                  {error && (
                    <div className="flex items-center justify-center gap-2 text-sm text-destructive mt-2">
                      <AlertCircle className="w-4 h-4" />
                      <span>{error}</span>
                    </div>
                  )}
                </>
              )}
            </div>

            <Button
              variant="outline"
              onClick={downloadTemplate}
              className="w-full mt-4"
            >
              <Download className="w-4 h-4 mr-2" />
              Baixar template CSV
            </Button>
          </>
        )}

        <p className="text-xs text-center text-muted-foreground mt-4">
          Colunas suportadas: nome, sobrenome, email, telefone, empresa, cargo
        </p>
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
          variant={importedCount > 0 ? 'default' : 'outline'}
          className={importedCount > 0 ? 'bg-gradient-primary hover:opacity-90' : ''}
        >
          {importedCount > 0 ? 'Continuar' : 'Pular esta etapa'}
          <ArrowRight className="w-4 h-4 ml-2" />
        </Button>
      </motion.div>
    </div>
  );
};

export default ImportStep;
