import { useAuth } from "@/hooks/useAuth"
import { AppLayout } from "@/components/app-layout"

export default function Index() {
  const { user } = useAuth()

  return (
    <AppLayout>
      <div className="bg-card text-card-foreground rounded-lg shadow p-6">
        <h2 className="text-xl font-semibold mb-4">
          Bem-vindo ao Sistema Avila! 👋
        </h2>

        <div className="space-y-4">
          <div className="bg-blue-50 dark:bg-blue-950 border border-blue-200 dark:border-blue-800 rounded-lg p-4">
            <h3 className="font-semibold text-blue-900 dark:text-blue-100 mb-2">
              Informações do Usuário
            </h3>
            <div className="grid grid-cols-2 gap-2 text-sm">
              <div>
                <span className="text-muted-foreground">Nome:</span>
                <span className="ml-2 font-medium text-foreground">{user?.full_name}</span>
              </div>
              <div>
                <span className="text-muted-foreground">Email:</span>
                <span className="ml-2 font-medium text-foreground">{user?.email}</span>
              </div>
              {user?.tenant_name && (
                <div>
                  <span className="text-muted-foreground">Empresa:</span>
                  <span className="ml-2 font-medium text-foreground">
                    {user.tenant_name}
                  </span>
                </div>
              )}
              <div>
                <span className="text-muted-foreground">Admin:</span>
                <span className="ml-2 font-medium text-foreground">
                  {user?.is_tenant_admin ? "Sim" : "Não"}
                </span>
              </div>
            </div>
          </div>

          <div className="bg-green-50 dark:bg-green-950 border border-green-200 dark:border-green-800 rounded-lg p-4">
            <h3 className="font-semibold text-green-900 dark:text-green-100 mb-2">
              ✅ Sistema Configurado com Sucesso!
            </h3>
            <ul className="text-sm text-green-800 dark:text-green-200 space-y-1">
              <li>✓ Autenticação funcionando</li>
              <li>✓ Rotas protegidas ativas</li>
              <li>✓ Contexto de usuário carregado</li>
              <li>✓ Multitenancy configurado</li>
            </ul>
          </div>
        </div>
      </div>
    </AppLayout>
  )
}
