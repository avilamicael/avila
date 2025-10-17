import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import type { TopSupplier } from "@/types/payables"
import { formatCurrency } from "@/utils/format"

interface TopSuppliersProps {
  suppliers?: TopSupplier[]
  isLoading?: boolean
}

export function TopSuppliers({ suppliers, isLoading }: TopSuppliersProps) {
  if (isLoading) {
    return (
      <Card>
        <CardHeader>
          <CardTitle>Top Fornecedores</CardTitle>
          <CardDescription>Fornecedores com mais contas a pagar</CardDescription>
        </CardHeader>
        <CardContent>
          <div className="space-y-4">
            {[...Array(5)].map((_, i) => (
              <div key={i} className="h-16 bg-muted animate-pulse rounded-lg" />
            ))}
          </div>
        </CardContent>
      </Card>
    )
  }

  if (!suppliers || suppliers.length === 0) {
    return (
      <Card>
        <CardHeader>
          <CardTitle>Top Fornecedores</CardTitle>
          <CardDescription>Fornecedores com mais contas a pagar</CardDescription>
        </CardHeader>
        <CardContent>
          <p className="text-sm text-muted-foreground text-center py-8">
            Nenhum dado disponível
          </p>
        </CardContent>
      </Card>
    )
  }

  // Calcula o valor máximo para a barra de progresso
  const maxAmount = Math.max(...suppliers.map(s => parseFloat(s.total_amount)))

  return (
    <Card>
      <CardHeader>
        <CardTitle>Top Fornecedores</CardTitle>
        <CardDescription>Fornecedores com mais contas a pagar</CardDescription>
      </CardHeader>
      <CardContent>
        <div className="space-y-4">
          {suppliers.map((supplier, index) => {
            const amount = parseFloat(supplier.total_amount)
            const percentage = (amount / maxAmount) * 100

            return (
              <div key={supplier.supplier__id} className="space-y-2">
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-2">
                    <span className="text-sm font-medium">
                      {index + 1}. {supplier.supplier__name}
                    </span>
                    
                  </div>
                  <span className="text-sm font-bold">
                    {formatCurrency(amount)}
                  </span>
                </div>

                {/* Barra de progresso */}
                <div className="h-2 bg-muted rounded-full overflow-hidden">
                  <div
                    className="h-full bg-gradient-to-r from-blue-500 to-blue-600 transition-all duration-500"
                    style={{ width: `${percentage}%` }}
                  />
                </div>
              </div>
            )
          })}
        </div>
      </CardContent>
    </Card>
  )
}
