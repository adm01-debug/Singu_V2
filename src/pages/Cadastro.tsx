import { useState } from 'react';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Building2, User, Link2 } from 'lucide-react';
import { EmpresaForm } from './cadastro/EmpresaForm';
import { PessoaForm } from './cadastro/PessoaForm';
import { VinculoForm } from './cadastro/VinculoForm';

export default function Cadastro() {
  const [tab, setTab] = useState<'empresa' | 'pessoa' | 'vinculo'>('empresa');

  return (
    <main className="container max-w-4xl py-8 space-y-6">
      <header className="space-y-1">
        <h1 className="text-2xl font-semibold">Cadastro</h1>
        <p className="text-sm text-muted-foreground">
          Cadastre empresas, pessoas e crie vínculos entre elas com papéis (comprador, gerente, proprietário e outros).
        </p>
      </header>

      <Tabs value={tab} onValueChange={(v) => setTab(v as typeof tab)}>
        <TabsList className="grid grid-cols-3 w-full">
          <TabsTrigger value="empresa" className="gap-2"><Building2 className="h-4 w-4" />Empresa</TabsTrigger>
          <TabsTrigger value="pessoa" className="gap-2"><User className="h-4 w-4" />Pessoa</TabsTrigger>
          <TabsTrigger value="vinculo" className="gap-2"><Link2 className="h-4 w-4" />Vínculo</TabsTrigger>
        </TabsList>

        <TabsContent value="empresa" className="mt-6">
          <Card>
            <CardHeader>
              <CardTitle>Nova empresa</CardTitle>
              <CardDescription>Preencha os dados principais. Você poderá vincular pessoas depois.</CardDescription>
            </CardHeader>
            <CardContent>
              <EmpresaForm onCreated={() => setTab('vinculo')} />
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="pessoa" className="mt-6">
          <Card>
            <CardHeader>
              <CardTitle>Nova pessoa</CardTitle>
              <CardDescription>Cadastre a pessoa e, opcionalmente, associe-a a uma empresa.</CardDescription>
            </CardHeader>
            <CardContent>
              <PessoaForm onCreated={() => setTab('vinculo')} />
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="vinculo" className="mt-6">
          <Card>
            <CardHeader>
              <CardTitle>Novo vínculo</CardTitle>
              <CardDescription>
                Ligue Empresa↔Pessoa (ou Empresa↔Empresa, Pessoa↔Pessoa) definindo o papel exercido no relacionamento.
              </CardDescription>
            </CardHeader>
            <CardContent>
              <VinculoForm />
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>
    </main>
  );
}