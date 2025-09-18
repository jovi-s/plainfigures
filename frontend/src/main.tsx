import { StrictMode } from "react";
import { createRoot } from "react-dom/client";
import { BrowserRouter } from "react-router-dom";
import "./global.css";
import "./i18n";
import { AppFlow } from "./components/AppFlow.tsx";

createRoot(document.getElementById("root")!).render(
  <StrictMode>
    <BrowserRouter basename="/">
      <AppFlow />
    </BrowserRouter>
  </StrictMode>
);
