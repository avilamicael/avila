import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { PaymentScheduleChart } from "./PaymentScheduleChart"

interface PaymentDataPoint {
  date: string
  day: string
  amount: number
  suppliers: string[]
  count: number
}

interface RecurringPaymentsViewProps {
  daily: PaymentDataPoint[]
  weekly: PaymentDataPoint[]
  monthly: PaymentDataPoint[]
  isLoading?: boolean
}

export function RecurringPaymentsView({
  daily,
  weekly,
  monthly,
  isLoading
}: RecurringPaymentsViewProps) {
  if (isLoading) {
    return (
      <Card className="col-span-full">
        <CardHeader>
          <CardTitle>Pagamentos Recorrentes</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="h-96 bg-muted animate-pulse rounded-lg" />
        </CardContent>
      </Card>
    )
  }

  const hasData = daily.length > 0 || weekly.length > 0 || monthly.length > 0

  if (!hasData) {
    return (
      <Card className="col-span-full">
        <CardHeader>
          <CardTitle>Pagamentos Recorrentes</CardTitle>
          <CardDescription>Visualize seus pagamentos recorrentes por período</CardDescription>
        </CardHeader>
        <CardContent className="py-12">
          <div className="text-center space-y-2">
            <p className="text-sm text-muted-foreground">
              Nenhuma conta recorrente cadastrada ainda.
            </p>
            <p className="text-xs text-muted-foreground">
              Ao criar contas a pagar com recorrência, elas aparecerão aqui com a programação de pagamentos.
            </p>
          </div>
        </CardContent>
      </Card>
    )
  }

  return (
    <div className="col-span-full">
      <Tabs defaultValue="monthly" className="space-y-4">
        <div className="flex items-center justify-between">
          <div>
            <h2 className="text-2xl font-bold tracking-tight">Cronograma de Pagamentos</h2>
            <p className="text-muted-foreground">
              Todas as contas pendentes agrupadas por período (⭐ = recorrente)
            </p>
          </div>
          <TabsList>
            <TabsTrigger value="monthly">Por Dia do Mês</TabsTrigger>
            <TabsTrigger value="daily">Próximos 30 Dias</TabsTrigger>
            <TabsTrigger value="weekly">Por Dia da Semana</TabsTrigger>
          </TabsList>
        </div>

        <TabsContent value="monthly" className="space-y-4">
          {monthly.length > 0 ? (
            <PaymentScheduleChart
              data={monthly}
              title="Pagamentos por Dia do Mês"
              description="Total de pagamentos agrupados por dia do mês (todas as contas pendentes)"
            />
          ) : (
            <Card>
              <CardContent className="pt-6">
                <p className="text-sm text-muted-foreground text-center py-8">
                  Nenhum pagamento cadastrado
                </p>
              </CardContent>
            </Card>
          )}
        </TabsContent>

        <TabsContent value="daily" className="space-y-4">
          {daily.length > 0 ? (
            <PaymentScheduleChart
              data={daily}
              title="Próximos 30 Dias"
              description="Pagamentos com vencimento nos próximos 30 dias"
            />
          ) : (
            <Card>
              <CardContent className="pt-6">
                <p className="text-sm text-muted-foreground text-center py-8">
                  Nenhum pagamento programado para os próximos 30 dias
                </p>
              </CardContent>
            </Card>
          )}
        </TabsContent>

        <TabsContent value="weekly" className="space-y-4">
          {weekly.length > 0 ? (
            <PaymentScheduleChart
              data={weekly}
              title="Pagamentos por Dia da Semana"
              description="Distribuição de pagamentos por dia da semana"
            />
          ) : (
            <Card>
              <CardContent className="pt-6">
                <p className="text-sm text-muted-foreground text-center py-8">
                  Nenhum pagamento cadastrado
                </p>
              </CardContent>
            </Card>
          )}
        </TabsContent>
      </Tabs>
    </div>
  )
}
