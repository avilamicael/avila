import { useAuth } from "@/hooks/useAuth"
import { Button } from "@/components/ui/button"
import { useNavigate } from "react-router-dom"
import { AppSidebar } from "@/components/app-sidebar"
import {
  SidebarProvider,
  SidebarInset,
  SidebarTrigger,
} from "@/components/ui/sidebar"
import {
  Breadcrumb,
  BreadcrumbItem,
  BreadcrumbLink,
  BreadcrumbList,
  BreadcrumbPage,
  BreadcrumbSeparator,
} from "@/components/ui/breadcrumb"
import { Separator } from "@/components/ui/separator"

export default function Index() {
  const { user, logout } = useAuth()
  const navigate = useNavigate()

  const handleLogout = async () => {
    await logout()
    navigate("/login")
  }

  return (
    <SidebarProvider>
      {/* Sidebar lateral */}
      <AppSidebar />

      {/* Conteúdo principal */}
      <SidebarInset>
        {/* Header */}
        <header className="flex h-16 shrink-0 items-center gap-2 border-b bg-white">
          <div className="flex items-center gap-2 px-4 w-full justify-between">
            {/* Esquerda */}
            <div className="flex items-center gap-2">
              <SidebarTrigger className="-ml-1" />
              <Separator
                orientation="vertical"
                className="mr-2 data-[orientation=vertical]:h-4"
              />
              <Breadcrumb>
                <BreadcrumbList>
                  <BreadcrumbItem className="hidden md:block">
                    <BreadcrumbLink href="#">Dashboard</BreadcrumbLink>
                  </BreadcrumbItem>
                  <BreadcrumbSeparator className="hidden md:block" />
                  <BreadcrumbItem>
                    <BreadcrumbPage>Início</BreadcrumbPage>
                  </BreadcrumbItem>
                </BreadcrumbList>
              </Breadcrumb>
            </div>

            {/* Direita */}
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
        </header>

        {/* Conteúdo da página */}
        <main className="p-6">
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
                  {user?.tenant_name && (
                    <div>
                      <span className="text-gray-600">Empresa:</span>
                      <span className="ml-2 font-medium">
                        {user.tenant_name}
                      </span>
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
            </div>
          </div>
        </main>
      </SidebarInset>
    </SidebarProvider>
  )
}
