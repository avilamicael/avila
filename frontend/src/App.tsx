import { BrowserRouter, Routes, Route, Navigate } from "react-router-dom";
import { Toaster } from "sonner";
import { AuthProvider } from "@/hooks/useAuth";
import { ThemeProvider } from "@/hooks/useTheme";
import { PrivateRoute } from "@/components/PrivateRoute";
import Login from "@/pages/Login";
import Index from "@/pages/Index";
import PayablesCreate from "@/pages/payables/PayablesCreate";

function App() {
  return (
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

            {/* Rota de Payables - Protegida */}
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
  );
}

export default App;
