import { Helmet } from 'react-helmet-async';

interface JsonLdProps {
  data: Record<string, unknown>;
}

/**
 * Injects JSON-LD structured data into the page head.
 * Use for SEO-relevant pages (e.g., WebApplication, SoftwareApplication).
 */
export function JsonLd({ data }: JsonLdProps) {
  return (
    <Helmet>
      <script type="application/ld+json">{JSON.stringify(data)}</script>
    </Helmet>
  );
}

/** Pre-built WebApplication schema for the CRM */
export function CRMJsonLd() {
  return (
    <JsonLd
      data={{
        '@context': 'https://schema.org',
        '@type': 'WebApplication',
        name: 'SINGU CRM',
        applicationCategory: 'BusinessApplication',
        operatingSystem: 'Web',
        description: 'CRM inteligente com análise comportamental DISC, VAK e neuromarketing para vendas consultivas.',
        offers: {
          '@type': 'Offer',
          price: '0',
          priceCurrency: 'BRL',
        },
        featureList: [
          'Análise DISC automática',
          'Perfil comportamental VAK',
          'Gatilhos mentais de vendas',
          'Neuromarketing aplicado',
          'Gestão de contatos e empresas',
        ],
      }}
    />
  );
}
