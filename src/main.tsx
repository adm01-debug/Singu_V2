import { createRoot } from "react-dom/client";
import { ThemeProvider } from "@/components/theme/ThemeProvider";
import { ACTIVE_THEME_STORAGE_KEY, bootstrapTheme } from "@/components/theme/themeBootstrap";
import { initGlobalErrorHandlers } from "@/lib/errorReporting";
import App from "./App.tsx";
import "./index.css";

// Inicializar sistemas globais
initGlobalErrorHandlers();
bootstrapTheme(ACTIVE_THEME_STORAGE_KEY, "dark");


createRoot(document.getElementById("root")!).render(
  <ThemeProvider defaultTheme="dark" storageKey={ACTIVE_THEME_STORAGE_KEY}>
    <App />
  </ThemeProvider>
);
