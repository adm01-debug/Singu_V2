import { useFieldArray, type UseFormReturn } from 'react-hook-form';
import { Plus, Trash2, Phone, Mail, MapPin } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import {
  Select, SelectContent, SelectItem, SelectTrigger, SelectValue,
} from '@/components/ui/select';
import { Checkbox } from '@/components/ui/checkbox';
import { FormControl, FormField, FormItem, FormLabel, FormMessage } from '@/components/ui/form';
import type { CompanyFormData } from './CompanyFormSchema';

interface Props {
  form: UseFormReturn<CompanyFormData>;
}

export function CompanyFormCompositeFields({ form }: Props) {
  const { fields: phoneFields, append: appendPhone, remove: removePhone } = useFieldArray({
    control: form.control,
    name: 'phones',
  });

  const { fields: emailFields, append: appendEmail, remove: removeEmail } = useFieldArray({
    control: form.control,
    name: 'emails',
  });

  const { fields: addressFields, append: appendAddress, remove: removeAddress } = useFieldArray({
    control: form.control,
    name: 'addresses',
  });

  return (
    <div className="space-y-8">
      {/* Phones Section */}
      <div className="space-y-4">
        <div className="flex items-center justify-between border-b pb-2">
          <h4 className="text-sm font-semibold flex items-center gap-2">
            <Phone className="w-4 h-4 text-primary" /> Telefones
          </h4>
          <Button
            type="button"
            variant="outline"
            size="sm"
            onClick={() => appendPhone({ tipo: 'fixo', numero: '', is_primary: phoneFields.length === 0 })}
          >
            <Plus className="w-4 h-4 mr-1" /> Adicionar
          </Button>
        </div>
        
        {phoneFields.length === 0 && (
          <p className="text-xs text-muted-foreground italic">Nenhum telefone adicionado.</p>
        )}

        {phoneFields.map((field, index) => (
          <div key={field.id} className="grid grid-cols-1 md:grid-cols-12 gap-3 items-end border border-border/50 p-3 rounded-lg bg-muted/5">
            <div className="md:col-span-3">
              <FormField
                control={form.control}
                name={`phones.${index}.tipo`}
                render={({ field }) => (
                  <FormItem>
                    <FormLabel className="text-[10px] uppercase font-bold text-muted-foreground">Tipo</FormLabel>
                    <Select onValueChange={field.onChange} defaultValue={field.value}>
                      <FormControl>
                        <SelectTrigger className="h-8 text-xs">
                          <SelectValue />
                        </SelectTrigger>
                      </FormControl>
                      <SelectContent>
                        <SelectItem value="fixo">Fixo</SelectItem>
                        <SelectItem value="celular">Celular</SelectItem>
                        <SelectItem value="whatsapp">WhatsApp</SelectItem>
                        <SelectItem value="outros">Outros</SelectItem>
                      </SelectContent>
                    </Select>
                  </FormItem>
                )}
              />
            </div>
            <div className="md:col-span-5">
              <FormField
                control={form.control}
                name={`phones.${index}.numero`}
                render={({ field }) => (
                  <FormItem>
                    <FormLabel className="text-[10px] uppercase font-bold text-muted-foreground">Número</FormLabel>
                    <FormControl>
                      <Input {...field} className="h-8 text-xs" placeholder="(00) 0000-0000" />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />
            </div>
            <div className="md:col-span-3 flex items-center h-8 mb-1">
              <FormField
                control={form.control}
                name={`phones.${index}.is_primary`}
                render={({ field }) => (
                  <FormItem className="flex flex-row items-center space-x-2 space-y-0">
                    <FormControl>
                      <Checkbox
                        checked={field.value}
                        onCheckedChange={field.onChange}
                      />
                    </FormControl>
                    <FormLabel className="text-xs font-normal">Principal</FormLabel>
                  </FormItem>
                )}
              />
            </div>
            <div className="md:col-span-1 flex justify-end">
              <Button
                type="button"
                variant="ghost"
                size="icon" aria-label="Remover"
                className="h-8 w-8 text-destructive"
                onClick={() => removePhone(index)}
              >
                <Trash2 className="w-4 h-4" />
              </Button>
            </div>
          </div>
        ))}
      </div>

      {/* Emails Section */}
      <div className="space-y-4">
        <div className="flex items-center justify-between border-b pb-2">
          <h4 className="text-sm font-semibold flex items-center gap-2">
            <Mail className="w-4 h-4 text-primary" /> Emails
          </h4>
          <Button
            type="button"
            variant="outline"
            size="sm"
            onClick={() => appendEmail({ tipo: 'comercial', email: '', is_primary: emailFields.length === 0 })}
          >
            <Plus className="w-4 h-4 mr-1" /> Adicionar
          </Button>
        </div>

        {emailFields.length === 0 && (
          <p className="text-xs text-muted-foreground italic">Nenhum email adicionado.</p>
        )}

        {emailFields.map((field, index) => (
          <div key={field.id} className="grid grid-cols-1 md:grid-cols-12 gap-3 items-end border border-border/50 p-3 rounded-lg bg-muted/5">
            <div className="md:col-span-3">
              <FormField
                control={form.control}
                name={`emails.${index}.tipo`}
                render={({ field }) => (
                  <FormItem>
                    <FormLabel className="text-[10px] uppercase font-bold text-muted-foreground">Tipo</FormLabel>
                    <Select onValueChange={field.onChange} defaultValue={field.value}>
                      <FormControl>
                        <SelectTrigger className="h-8 text-xs">
                          <SelectValue />
                        </SelectTrigger>
                      </FormControl>
                      <SelectContent>
                        <SelectItem value="comercial">Comercial</SelectItem>
                        <SelectItem value="financeiro">Financeiro</SelectItem>
                        <SelectItem value="suporte">Suporte</SelectItem>
                        <SelectItem value="outros">Outros</SelectItem>
                      </SelectContent>
                    </Select>
                  </FormItem>
                )}
              />
            </div>
            <div className="md:col-span-5">
              <FormField
                control={form.control}
                name={`emails.${index}.email`}
                render={({ field }) => (
                  <FormItem>
                    <FormLabel className="text-[10px] uppercase font-bold text-muted-foreground">Email</FormLabel>
                    <FormControl>
                      <Input {...field} className="h-8 text-xs" placeholder="contato@empresa.com" />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />
            </div>
            <div className="md:col-span-3 flex items-center h-8 mb-1">
              <FormField
                control={form.control}
                name={`emails.${index}.is_primary`}
                render={({ field }) => (
                  <FormItem className="flex flex-row items-center space-x-2 space-y-0">
                    <FormControl>
                      <Checkbox
                        checked={field.value}
                        onCheckedChange={field.onChange}
                      />
                    </FormControl>
                    <FormLabel className="text-xs font-normal">Principal</FormLabel>
                  </FormItem>
                )}
              />
            </div>
            <div className="md:col-span-1 flex justify<Button
                type="button"
                variant="ghost"
                size="icon" aria-label="Remover"
                className="h-8 w-8 text-destructive"
                onClick={() => removeEmail(index)}
              >
                <Trash2 className="w-4 h-4" />
              </Button>            </Button>
            </div>
          </div>
        ))}
      </div>

      {/* Addresses Section */}
      <div className="space-y-4">
        <div className="flex items-center justify-between border-b pb-2">
          <h4 className="text-sm font-semibold flex items-center gap-2">
            <MapPin className="w-4 h-4 text-primary" /> Endereços
          </h4>
          <Button
            type="button"
            variant="outline"
            size="sm"
            onClick={() => appendAddress({ tipo: 'comercial', logradouro: '', cidade: '', estado: '', is_primary: addressFields.length === 0 })}
          >
            <Plus className="w-4 h-4 mr-1" /> Adicionar
          </Button>
        </div>

        {addressFields.length === 0 && (
          <p className="text-xs text-muted-foreground italic">Nenhum endereço adicionado.</p>
        )}

        {addressFields.map((field, index) => (
          <div key={field.id} className="space-y-3 border border-border/50 p-4 rou<Button
              type="button"
              variant="ghost"
              size="icon" aria-label="Remover"
              className="absolute top-2 right-2 h-8 w-8 text-destructive"
              onClick={() => removeAddress(index)}
            >
              <Trash2 className="w-4 h-4" />
            </Button>assName="w-4 h-4" />
            </Button>
            
            <div className="grid grid-cols-1 md:grid-cols-4 gap-3">
              <FormField
                control={form.control}
                name={`addresses.${index}.tipo`}
                render={({ field }) => (
                  <FormItem>
                    <FormLabel className="text-[10px] uppercase font-bold text-muted-foreground">Tipo</FormLabel>
                    <Select onValueChange={field.onChange} defaultValue={field.value}>
                      <FormControl>
                        <SelectTrigger className="h-8 text-xs">
                          <SelectValue />
                        </SelectTrigger>
                      </FormControl>
                      <SelectContent>
                        <SelectItem value="comercial">Comercial</SelectItem>
                        <SelectItem value="entrega">Entrega</SelectItem>
                        <SelectItem value="cobranca">Cobrança</SelectItem>
                        <SelectItem value="filial">Filial</SelectItem>
                      </SelectContent>
                    </Select>
                  </FormItem>
                )}
              />
              <FormField
                control={form.control}
                name={`addresses.${index}.cep`}
                render={({ field }) => (
                  <FormItem>
                    <FormLabel className="text-[10px] uppercase font-bold text-muted-foreground">CEP</FormLabel>
                    <FormControl>
                      <Input {...field} className="h-8 text-xs" placeholder="00000-000" />
                    </FormControl>
                  </FormItem>
                )}
              />
              <div className="md:col-span-2">
                <FormField
                  control={form.control}
                  name={`addresses.${index}.logradouro`}
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel className="text-[10px] uppercase font-bold text-muted-foreground">Logradouro</FormLabel>
                      <FormControl>
                        <Input {...field} className="h-8 text-xs" placeholder="Rua, Avenida..." />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />
              </div>
            </div>

            <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
              <FormField
                control={form.control}
                name={`addresses.${index}.numero`}
                render={({ field }) => (
                  <FormItem>
                    <FormLabel className="text-[10px] uppercase font-bold text-muted-foreground">Número</FormLabel>
                    <FormControl>
                      <Input {...field} className="h-8 text-xs" />
                    </FormControl>
                  </FormItem>
                )}
              />
              <FormField
                control={form.control}
                name={`addresses.${index}.cidade`}
                render={({ field }) => (
                  <FormItem>
                    <FormLabel className="text-[10px] uppercase font-bold text-muted-foreground">Cidade</FormLabel>
                    <FormControl>
                      <Input {...field} className="h-8 text-xs" />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />
              <FormField
                control={form.control}
                name={`addresses.${index}.estado`}
                render={({ field }) => (
                  <FormItem>
                    <FormLabel className="text-[10px] uppercase font-bold text-muted-foreground">UF</FormLabel>
                    <FormControl>
                      <Input {...field} className="h-8 text-xs" maxLength={2} />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />
              <div className="flex items-center h-8 mt-6">
                <FormField
                  control={form.control}
                  name={`addresses.${index}.is_primary`}
                  render={({ field }) => (
                    <FormItem className="flex flex-row items-center space-x-2 space-y-0">
                      <FormControl>
                        <Checkbox
                          checked={field.value}
                          onCheckedChange={field.onChange}
                        />
                      </FormControl>
                      <FormLabel className="text-xs font-normal">Principal</FormLabel>
                    </FormItem>
                  )}
                />
              </div>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}
