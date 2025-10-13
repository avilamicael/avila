import { useLocation } from "react-router-dom"

interface BreadcrumbItem {
  label: string
  href?: string
}

// Mapeamento de rotas para breadcrumbs
const breadcrumbConfig: Record<string, BreadcrumbItem[]> = {
  "/": [
    { label: "Inicio", href: "/" },
  ],
  "/payables/create": [
    { label: "Inicio", href: "/" },
    { label: "Financeiro" },
    { label: "Adicionar Conta" },
  ],
  "/payables/list": [
    { label: "Inicio", href: "/" },
    { label: "Financeiro" },
    { label: "Listar Contas" },
  ],
}

export function useBreadcrumbs(): BreadcrumbItem[] {
  const location = useLocation()

  // Retorna o breadcrumb configurado ou um padrão
  return breadcrumbConfig[location.pathname] || [
    { label: "Dashboard", href: "/" },
  ]
}