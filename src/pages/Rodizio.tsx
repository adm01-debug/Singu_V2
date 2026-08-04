import React from 'react';
import { Helmet } from 'react-helmet-async';
import LeadRoutingModule from '@/components/lead-routing/LeadRoutingModule';

export default function Rodizio() {
  return (
    <>
      <Helmet>
        <title>Rodízio de Carteira | SINGU</title>
        <meta name="description" content="Gestão de distribuição de leads entre SDRs e Closers com round-robin ponderado e handoff inteligente." />
      </Helmet>
      <div className="container mx-auto px-4 py-6 max-w-6xl">
        <LeadRoutingModule />
      </div>
    </>
  );
}
