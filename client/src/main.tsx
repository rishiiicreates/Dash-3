import { createRoot } from "react-dom/client";
import App from "./App";
import "./index.css";
import { QueryClientProvider } from "@tanstack/react-query";
import { queryClient } from "./lib/queryClient";
import { Toaster } from "@/components/ui/toaster";
import { auth } from "@/lib/firebase";
import { getRedirectResult } from "firebase/auth";

// Check for auth redirect result on page load
getRedirectResult(auth).catch(error => {
  console.error("Firebase redirect error:", error);
});

createRoot(document.getElementById("root")!).render(
  <QueryClientProvider client={queryClient}>
    <App />
    <Toaster />
  </QueryClientProvider>
);
