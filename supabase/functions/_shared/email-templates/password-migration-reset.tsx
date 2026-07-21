/// <reference types="npm:@types/react@18.3.1" />
import * as React from "npm:react@18.3.1";
import {
  Body,
  Button,
  Container,
  Head,
  Heading,
  Hr,
  Html,
  Preview,
  Section,
  Text,
} from "npm:@react-email/components@0.0.22";

interface Props {
  siteName?: string;
  siteUrl?: string;
  confirmationUrl?: string;
  recipient?: string;
}

const NEXUS_BLUE = "#4D96FF";

const main: React.CSSProperties = { backgroundColor: "#ffffff", fontFamily: "Inter, Arial, sans-serif" };
const container: React.CSSProperties = { padding: "32px 28px", maxWidth: "560px", margin: "0 auto" };
const h1: React.CSSProperties = { fontSize: "22px", fontWeight: 600, color: "#0f172a", margin: "0 0 16px" };
const text: React.CSSProperties = { fontSize: "15px", lineHeight: "22px", color: "#334155", margin: "0 0 14px" };
const muted: React.CSSProperties = { fontSize: "13px", lineHeight: "20px", color: "#64748b", margin: "16px 0 0" };
const button: React.CSSProperties = {
  backgroundColor: NEXUS_BLUE,
  color: "#ffffff",
  padding: "12px 22px",
  borderRadius: "6px",
  textDecoration: "none",
  fontSize: "15px",
  fontWeight: 600,
  display: "inline-block",
};
const hr: React.CSSProperties = { borderColor: "#e2e8f0", margin: "28px 0" };

const PasswordMigrationResetEmail: React.FC<Props> = ({
  siteName = "SINGU CRM",
  siteUrl = "https://app.singucrm.com",
  confirmationUrl = "#",
  recipient,
}) => (
  <Html lang="pt-BR" dir="ltr">
    <Head />
    <Preview>Defina sua nova senha do {siteName} — migração de sistema</Preview>
    <Body style={main}>
      <Container style={container}>
        <Heading style={h1}>Ação necessária: redefina sua senha</Heading>

        <Text style={text}>Olá{recipient ? `, ${recipient}` : ""},</Text>

        <Text style={text}>
          Migramos o {siteName} para uma nova infraestrutura para oferecer mais segurança,
          desempenho e disponibilidade. Como parte deste processo, todas as senhas precisam ser
          redefinidas antes do próximo acesso.
        </Text>

        <Text style={text}>
          Clique no botão abaixo para escolher uma nova senha. O link é pessoal e expira em 24 horas.
        </Text>

        <Section style={{ textAlign: "center", margin: "24px 0" }}>
          <Button href={confirmationUrl} style={button}>
            Definir nova senha
          </Button>
        </Section>

        <Text style={muted}>
          Se o botão não funcionar, copie e cole este link no navegador:
          <br />
          <a href={confirmationUrl} style={{ color: NEXUS_BLUE, wordBreak: "break-all" }}>
            {confirmationUrl}
          </a>
        </Text>

        <Hr style={hr} />

        <Text style={muted}>
          Você recebeu este e-mail porque possui uma conta em <a href={siteUrl} style={{ color: NEXUS_BLUE }}>{siteName}</a>.
          Se você não reconhece esta solicitação, ignore esta mensagem — sua conta permanece protegida
          até que uma nova senha seja definida.
        </Text>
      </Container>
    </Body>
  </Html>
);

export default PasswordMigrationResetEmail;