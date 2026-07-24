import { createRoot } from "react-dom/client";
import { QueryClientProvider } from "@tanstack/react-query";
import App from "./app/App.tsx";
import RuntimeBootstrap from "./app/RuntimeBootstrap.tsx";
import { queryClient } from "./queries/queryClient.ts";
import "./styles/index.css";

createRoot(document.getElementById("root")!).render(
  <QueryClientProvider client={queryClient}>
    <RuntimeBootstrap>
      <App />
    </RuntimeBootstrap>
  </QueryClientProvider>,
);
