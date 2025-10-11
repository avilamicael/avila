import { BrowserRouter, Routes, Route, Navigate } from "react-router-dom";
import { AuthProvider } from "@/hooks/useAuth";
import { PrivateRoute } from "@/components/PrivateRoute";
import Login from "@/pages/Login";
import Index from "@/pages/Index";

function App() {
  return (
    <BrowserRouter>
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

          {/* Redireciona qualquer rota não encontrada para / */}
          <Route path="*" element={<Navigate to="/" replace />} />
        </Routes>
      </AuthProvider>
    </BrowserRouter>
  );
}

export default App;
