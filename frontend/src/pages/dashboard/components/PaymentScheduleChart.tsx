import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, Legend, ResponsiveContainer, Cell } from 'recharts'
import { formatCurrency } from "@/utils/format"

interface PaymentDataPoint {
  date: string
  day: string
  amount: number
  suppliers: string[]
  count: number
}

interface PaymentScheduleChartProps {
  data: PaymentDataPoint[]
  title?: string
  description?: string
}

export function PaymentScheduleChart({
  data,
  title = "Cronograma de Pagamentos",
  description = "Pagamentos recorrentes por dia do mês"
}: PaymentScheduleChartProps) {
  // Cores para as barras baseadas no valor
  const getBarColor = (value: number) => {
    if (value > 10000) return '#ef4444' // red-500
    if (value > 5000) return '#f97316' // orange-500
    if (value > 2000) return '#eab308' // yellow-500
    return '#22c55e' // green-500
  }

  const CustomTooltip = ({ active, payload }: any) => {
    if (active && payload && payload.length) {
      const data = payload[0].payload
      return (
        <div className="bg-background border rounded-lg shadow-lg p-4 space-y-2">
          <p className="font-semibold text-sm">{data.date}</p>
          <p className="text-sm">
            <span className="font-medium">Valor Total:</span>{" "}
            <span className="text-green-600 font-bold">
              {formatCurrency(data.amount)}
            </span>
          </p>
          <p className="text-sm">
            <span className="font-medium">Quantidade:</span> {data.count} {data.count === 1 ? 'pagamento' : 'pagamentos'}
          </p>
          {data.suppliers && data.suppliers.length > 0 && (
            <div className="text-sm">
              <p className="font-medium">Fornecedores:</p>
              <ul className="ml-2 mt-1 space-y-0.5">
                {data.suppliers.map((supplier: string, idx: number) => (
                  <li key={idx} className="text-xs text-muted-foreground">• {supplier}</li>
                ))}
              </ul>
            </div>
          )}
        </div>
      )
    }
    return null
  }

  return (
    <Card className="col-span-full">
      <CardHeader>
        <CardTitle>{title}</CardTitle>
        {description && <CardDescription>{description}</CardDescription>}
      </CardHeader>
      <CardContent>
        <ResponsiveContainer width="100%" height={400}>
          <BarChart data={data} margin={{ top: 20, right: 30, left: 20, bottom: 5 }}>
            <CartesianGrid strokeDasharray="3 3" className="stroke-muted" />
            <XAxis
              dataKey="day"
              className="text-xs"
              tick={{ fill: 'hsl(var(--muted-foreground))' }}
            />
            <YAxis
              className="text-xs"
              tick={{ fill: 'hsl(var(--muted-foreground))' }}
              tickFormatter={(value) => formatCurrency(value)}
            />
            <Tooltip content={<CustomTooltip />} />
            <Legend
              wrapperStyle={{ paddingTop: '20px' }}
              formatter={() => 'Valor a Pagar'}
            />
            <Bar
              dataKey="amount"
              name="Valor a Pagar"
              radius={[8, 8, 0, 0]}
            >
              {data.map((entry, index) => (
                <Cell key={`cell-${index}`} fill={getBarColor(entry.amount)} />
              ))}
            </Bar>
          </BarChart>
        </ResponsiveContainer>

        {/* Legenda de cores */}
        <div className="mt-4 flex flex-wrap gap-4 justify-center text-xs text-muted-foreground">
          <div className="flex items-center gap-2">
            <div className="w-3 h-3 rounded" style={{ backgroundColor: '#22c55e' }} />
            <span>Até R$ 2.000</span>
          </div>
          <div className="flex items-center gap-2">
            <div className="w-3 h-3 rounded" style={{ backgroundColor: '#eab308' }} />
            <span>R$ 2.000 - R$ 5.000</span>
          </div>
          <div className="flex items-center gap-2">
            <div className="w-3 h-3 rounded" style={{ backgroundColor: '#f97316' }} />
            <span>R$ 5.000 - R$ 10.000</span>
          </div>
          <div className="flex items-center gap-2">
            <div className="w-3 h-3 rounded" style={{ backgroundColor: '#ef4444' }} />
            <span>Acima de R$ 10.000</span>
          </div>
        </div>
      </CardContent>
    </Card>
  )
}
