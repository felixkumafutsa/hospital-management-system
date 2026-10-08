import React from "react";
import ReactDOM from "react-dom/client";
import { ThemeProvider, CssBaseline } from "@mui/material";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { BrowserRouter } from "react-router-dom";
import theme from "./theme";
import App from "./App";
import "./index.css";

// Create React Query client with optimized caching
const queryClient = new QueryClient({
  defaultOptions: {
    queries: {
      refetchOnWindowFocus: false,
      refetchOnMount: true,
      refetchOnReconnect: false,
      retry: 0, // Disable retries to prevent 429 rate limiting errors in development
      staleTime: 10 * 60 * 1000, // 10 minutes - keep data fresh longer
      gcTime: 30 * 60 * 1000, // 30 minutes - garbage collection time (formerly cacheTime in v4)
    },
    mutations: {
      retry: 0, // Disable retries for mutations too
    },
  },
});

ReactDOM.createRoot(document.getElementById("root")!).render(
  <React.StrictMode>
    <QueryClientProvider client={queryClient}>
      <ThemeProvider theme={theme}>
        <CssBaseline />
        <BrowserRouter>
          <App />
        </BrowserRouter>
      </ThemeProvider>
    </QueryClientProvider>
  </React.StrictMode>,
);