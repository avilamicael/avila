import { useAuth } from "@/hooks/useAuth";
import { Button } from "@/components/ui/button";
import { useNavigate } from "react-router-dom";

export default function Index() {
  const { user, logout } = useAuth();
  const navigate = useNavigate();

  const handleLogout = async () => {
    try {
      await logout();
      navigate("/login");
    } catch (error) {
      console.error("Erro ao fazer logout:", error);
    }
  };

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Header/Navbar */}
      <header className="bg-white shadow">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-4">
          <div className="flex justify-between items-center">
            <div>
              <h1 className="text-2xl font-bold text-gray-900">Avila</h1>
              {user?.tenant_name && (
                <p className="text-sm text-gray-600">{user.tenant_name}</p>
              )}
            </div>
            <div className="flex items-center gap-4">
              <div className="text-right">
                <p className="text-sm font-medium text-gray-900">
                  {user?.full_name}
                </p>
                <p className="text-xs text-gray-600">{user?.email}</p>
              </div>
              <Button variant="outline" onClick={handleLogout}>
                Sair
              </Button>
            </div>
          </div>
        </div>
      </header>

      {/* Conteúdo Principal */}
      <main className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        <div className="bg-white rounded-lg shadow p-6">
          <h2 className="text-xl font-semibold mb-4">
            Bem-vindo ao Sistema Avila! 👋
          </h2>
          
          <div className="space-y-4">
            <div className="bg-blue-50 border border-blue-200 rounded-lg p-4">
              <h3 className="font-semibold text-blue-900 mb-2">
                Informações do Usuário
              </h3>
              <div className="grid grid-cols-2 gap-2 text-sm">
                <div>
                  <span className="text-gray-600">Nome:</span>
                  <span className="ml-2 font-medium">{user?.full_name}</span>
                </div>
                <div>
                  <span className="text-gray-600">Email:</span>
                  <span className="ml-2 font-medium">{user?.email}</span>
                </div>
                {user?.position && (
                  <div>
                    <span className="text-gray-600">Cargo:</span>
                    <span className="ml-2 font-medium">{user.position}</span>
                  </div>
                )}
                {user?.phone && (
                  <div>
                    <span className="text-gray-600">Telefone:</span>
                    <span className="ml-2 font-medium">{user.phone}</span>
                  </div>
                )}
                {user?.tenant_name && (
                  <div>
                    <span className="text-gray-600">Empresa:</span>
                    <span className="ml-2 font-medium">{user.tenant_name}</span>
                  </div>
                )}
                <div>
                  <span className="text-gray-600">Admin:</span>
                  <span className="ml-2 font-medium">
                    {user?.is_tenant_admin ? "Sim" : "Não"}
                  </span>
                </div>
              </div>
            </div>

            <div className="bg-green-50 border border-green-200 rounded-lg p-4">
              <h3 className="font-semibold text-green-900 mb-2">
                ✅ Sistema Configurado com Sucesso!
              </h3>
              <ul className="text-sm text-green-800 space-y-1">
                <li>✓ Autenticação funcionando</li>
                <li>✓ Rotas protegidas ativas</li>
                <li>✓ Contexto de usuário carregado</li>
                <li>✓ Multitenancy configurado</li>
              </ul>
            </div>

            <div className="bg-gray-50 border border-gray-200 rounded-lg p-4">
              <h3 className="font-semibold text-gray-900 mb-2">
                📋 Próximos Passos
              </h3>
              <ul className="text-sm text-gray-700 space-y-1">
                <li>• Criar módulo de Contas a Pagar</li>
                <li>• Adicionar dashboard com estatísticas</li>
                <li>• Implementar gestão de usuários</li>
                <li>• Configurar notificações</li>
              </ul>
            </div>
          </div>
        </div>
      </main>
    </div>
  );
}
