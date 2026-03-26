import { StrictMode } from "react";
import { createRoot } from "react-dom/client";
import "./index.css";
import "./Fonts.css";
import { TooltipProvider } from "./components/ui/tooltip.tsx";
import { RouterProvider } from "react-router-dom";
import { AuthProvider } from "./context/AuthContext.tsx";
import router from "./router.tsx";

createRoot(document.getElementById("root")!).render(
  <StrictMode>
    <AuthProvider>
      <TooltipProvider>
        <RouterProvider router={router} />
      </TooltipProvider>
    </AuthProvider>
  </StrictMode>,
);
