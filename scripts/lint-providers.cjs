#!/usr/bin/env node

/**
 * Script de lint para validar a ordem dos providers em App.tsx.
 * Uso: node scripts/lint-providers.cjs
 * 
 * Verifica que providers críticos na função App() aparecem na ordem correta.
 * Apenas valida a seção do componente App, ignorando componentes internos.
 */

const fs = require('fs');
const path = require('path');

const APP_FILE = path.resolve(__dirname, '..', 'src', 'App.tsx');

const DEPENDENCIES = {
  AuthProvider: ['BrowserRouter', 'QueryClientProvider'],
  NavigationStackProvider: ['BrowserRouter'],
};

function main() {
  if (!fs.existsSync(APP_FILE)) {
    console.error('❌ App.tsx não encontrado em', APP_FILE);
    process.exit(1);
  }

  const content = fs.readFileSync(APP_FILE, 'utf-8');

  // Extract only the App component section
  const appIdx = content.indexOf('const App');
  if (appIdx === -1) {
    console.error('❌ Não foi possível encontrar "const App" em App.tsx');
    process.exit(1);
  }

  const appSection = content.slice(appIdx);

  const providerRegex = /<(HelmetProvider|ErrorBoundary|QueryClientProvider|CelebrationProvider|AriaLiveProvider|TooltipProvider|BrowserRouter|AuthProvider|NavigationStackProvider)\b/g;

  const found = [];
  let match;
  while ((match = providerRegex.exec(appSection)) !== null) {
    const name = match[1];
    if (!found.includes(name)) {
      found.push(name);
    }
  }

  let hasError = false;

  for (const [provider, deps] of Object.entries(DEPENDENCIES)) {
    const providerIndex = found.indexOf(provider);
    if (providerIndex === -1) continue;

    for (const dep of deps) {
      const depIndex = found.indexOf(dep);
      if (depIndex === -1 || depIndex > providerIndex) {
        console.error(`❌ ${provider} requer ${dep} como provider pai, mas ${dep} ${depIndex === -1 ? 'não foi encontrado' : 'aparece depois'}.`);
        hasError = true;
      }
    }
  }

  if (hasError) {
    console.error('\n🚨 Ordem de providers inválida em App.tsx!');
    process.exit(1);
  }

  console.log('✅ Ordem de providers em App.tsx está correta.');
}

main();
