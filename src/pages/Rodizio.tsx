import React from 'react';
import { Helmet } from 'react-helmet-async';
import LeadRoutingModule from '@/components/lead-routing/LeadRoutingModule';

export default function Rodizio() {
  return (
    <>
      <Helmet>
        <title>Rodízio de Carteira | SINGU</title>
        <meta name="description" content="Gestão do rodízio de carteira entre SDRs e Closers por ondas, com bloqueio de clientes e aprovação." />
      </Helmet>
      <div className="container mx-auto px-4 py-6 max-w-6xl">
        <LeadRoutingModule />
      </div>
    </>
  );
}
