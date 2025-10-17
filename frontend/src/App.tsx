import { BrowserRouter, Routes, Route, Navigate } from "react-router-dom";
import { Toaster } from "sonner";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { AuthProvider } from "@/hooks/useAuth";
import { ThemeProvider } from "@/hooks/useTheme";
import { PrivateRoute } from "@/components/PrivateRoute";
import Login from "@/pages/Login";
import Index from "@/pages/Index";
import PayablesList from "@/pages/payables/PayablesList";
import PayablesCreate from "@/pages/payables/PayablesCreate";

// Criar instância do QueryClient
const queryClient = new QueryClient({
  defaultOptions: {
    queries: {
      refetchOnWindowFocus: false,
      retry: 1,
      staleTime: 5 * 60 * 1000, // 5 minutos
    },
  },
});

function App() {
  return (
    <QueryClientProvider client={queryClient}>
      <BrowserRouter>
        <ThemeProvider defaultTheme="light" storageKey="avila-ui-theme">
          <AuthProvider>
            <Routes>
              {/* Rota de Login - Pública */}
              <Route path="/login" element={<Login />} />

              {/* Rota Inicial - Protegida */}
              <Route
                path="/"
                element={
                  <PrivateRoute>
                    <Index />
                  </PrivateRoute>
                }
              />

              {/* Rotas de Payables - Protegidas */}
              <Route
                path="/payables"
                element={
                  <PrivateRoute>
                    <PayablesList />
                  </PrivateRoute>
                }
              />
              <Route
                path="/payables/create"
                element={
                  <PrivateRoute>
                    <PayablesCreate />
                  </PrivateRoute>
                }
              />

              {/* Redireciona qualquer rota não encontrada para / */}
              <Route path="*" element={<Navigate to="/" replace />} />
            </Routes>
            <Toaster position="top-right" richColors />
          </AuthProvider>
        </ThemeProvider>
      </BrowserRouter>
    </QueryClientProvider>
  );
}

export default App;
