import { StrictMode } from "react";
import { createRoot } from "react-dom/client";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import "./index.css";
import App from "./App.tsx";
import { SetupGate } from "./components/SetupGate.tsx";

const storedMode = localStorage.getItem("cf-theme-mode");
if (storedMode && storedMode !== "system") document.documentElement.setAttribute("data-theme", storedMode);
const storedAccent = localStorage.getItem("cf-theme-accent");
if (storedAccent) document.documentElement.setAttribute("data-accent", storedAccent);

const queryClient = new QueryClient({
  defaultOptions: { queries: { refetchOnWindowFocus: false } },
});

createRoot(document.getElementById("root")!).render(
  <StrictMode>
    <QueryClientProvider client={queryClient}>
      <SetupGate>
        <App />
      </SetupGate>
    </QueryClientProvider>
  </StrictMode>
);
