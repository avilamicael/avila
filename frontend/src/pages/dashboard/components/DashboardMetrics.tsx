import { DashboardCard } from "./DashboardCard"
import type { DashboardStats } from "@/types/payables"
import { formatCurrency } from "@/utils/format"
import {
  AlertCircle,
  Clock,
  CheckCircle2,
  Calendar
} from "lucide-react"

interface DashboardMetricsProps {
  stats?: DashboardStats
  isLoading?: boolean
}

export function DashboardMetrics({ stats, isLoading }: DashboardMetricsProps) {
  if (isLoading) {
    return (
      <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
        {[...Array(4)].map((_, i) => (
          <div key={i} className="h-32 bg-muted animate-pulse rounded-xl" />
        ))}
      </div>
    )
  }

  if (!stats) return null

  return (
    <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
      {/* Contas Pendentes */}
      <DashboardCard
        title="Contas Pendentes"
        value={stats.total_pending}
        description={formatCurrency(parseFloat(stats.amount_pending))}
        icon={Clock}
        valueClassName="text-orange-600"
      />

      {/* Contas Vencidas */}
      <DashboardCard
        title="Contas Vencidas"
        value={stats.total_overdue}
        description={formatCurrency(parseFloat(stats.amount_overdue))}
        icon={AlertCircle}
        valueClassName="text-red-600"
      />

      {/* Pagas Este Mês */}
      <DashboardCard
        title="Pagas Este Mês"
        value={stats.total_paid_this_month}
        description={formatCurrency(parseFloat(stats.amount_paid_this_month))}
        icon={CheckCircle2}
        valueClassName="text-green-600"
      />

      {/* Próximos 7 Dias */}
      <DashboardCard
        title="Próximos 7 Dias"
        value={stats.due_next_7_days}
        description={formatCurrency(parseFloat(stats.amount_due_next_7_days))}
        icon={Calendar}
        valueClassName="text-blue-600"
      />
    </div>
  )
}
