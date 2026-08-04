import { Helmet } from 'react-helmet-async';

interface SEOHeadProps {
  title?: string;
  description?: string;
}

const BASE_TITLE = 'SINGU - CRM Inteligente';
const BASE_DESC = 'Sistema de Inteligência Relacional para gestão de contatos e relacionamentos empresariais';

export function SEOHead({ title, description }: SEOHeadProps) {
  const fullTitle = title ? `${title} | ${BASE_TITLE}` : BASE_TITLE;
  const fullDesc = description || BASE_DESC;

  return (
    <Helmet>
      <title>{fullTitle}</title>
      <meta name="description" content={fullDesc} />
      <meta property="og:title" content={fullTitle} />
      <meta property="og:description" content={fullDesc} />
    </Helmet>
  );
}
