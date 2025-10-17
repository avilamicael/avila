import { AppLayout } from "@/components/app-layout"
import { useDashboard } from "@/hooks/dashboard/useDashboard"
import { DashboardMetrics, TopSuppliers } from "@/pages/dashboard/components"
import { GraficoSemanasCard } from "@/pages/dashboard/components/GraficoSemanasCard"
import { Button } from "@/components/ui/button"
import { RefreshCw } from "lucide-react"

export default function Index() {
  const {
    stats,
    contas,
    isLoading,
    isLoadingStats,
    isLoadingContas,
    refetch
  } = useDashboard()

  return (
    <AppLayout>
      <div className="flex flex-col gap-6 p-6">
        {/* Header */}
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-3xl font-bold tracking-tight">Dashboard</h1>
            <p className="text-muted-foreground">
              Visão geral das suas contas a pagar
            </p>
          </div>
          <Button
            variant="outline"
            size="sm"
            onClick={() => refetch()}
            disabled={isLoading}
          >
            <RefreshCw className={`h-4 w-4 mr-2 ${isLoading ? 'animate-spin' : ''}`} />
            Atualizar
          </Button>
        </div>

        {/* Métricas Principais */}
        <DashboardMetrics stats={stats} isLoading={isLoadingStats} />

        {/* Gráfico de Pagamentos por Dia */}
        <GraficoSemanasCard contas={contas} loading={isLoadingContas} />

        {/* Top Fornecedores */}
        <div className="grid gap-6 md:grid-cols-2">
          <TopSuppliers
            suppliers={stats?.top_suppliers}
            isLoading={isLoadingStats}
          />

          {/* Espaço reservado para futuras funcionalidades */}
          <div className="border-2 border-dashed rounded-lg p-8 text-center text-muted-foreground">
            <p className="text-sm">
              Espaço reservado para futuras funcionalidades
            </p>
            <p className="text-xs mt-2">
              Ex: Histórico, alertas, comparativos
            </p>
          </div>
        </div>
      </div>
    </AppLayout>
  )
}
