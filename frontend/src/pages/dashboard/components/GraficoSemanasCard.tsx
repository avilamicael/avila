import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import type { AccountPayable } from "@/types/payables";
import { useDadosDiarios } from "@/hooks/dashboard/useDadosDiarios";
import { formatCurrency } from "@/utils/formatters";
import { BarChart3, TrendingUp } from "lucide-react";
import {
  BarChart,
  Bar,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer,
  Legend,
  Cell
} from 'recharts';
import { format } from "date-fns";
import { ptBR } from "date-fns/locale";

interface GraficoSemanasCardProps {
  contas: AccountPayable[];
  loading?: boolean;
}

// Cores para as barras (gradiente)
const CORES = ['#3b82f6', '#22c55e', '#ce472f', '#ef4444', '#8b5cf6', '#ec4899', '#14b8a6', '#f59e0b'];

export function GraficoSemanasCard({ contas, loading }: GraficoSemanasCardProps) {
  const { dadosDiarios, estatisticas } = useDadosDiarios(contas);
  const mesAtual = format(new Date(), "MMMM 'de' yyyy", { locale: ptBR });

  // Tooltip customizado
  const CustomTooltip = ({ active, payload }: any) => {
    if (active && payload && payload.length) {
      const data = payload[0].payload;
      return (
        <div className="bg-background border rounded-lg shadow-lg p-4 max-w-sm">
          <p className="font-semibold text-sm mb-1">{data.diaCompleto}</p>
          <p className="text-lg font-bold text-primary mb-3">
            {formatCurrency(data.valor)}
          </p>
          <div className="space-y-1 border-t pt-2">
            <p className="text-xs font-semibold text-muted-foreground mb-2">
              {data.quantidade} {data.quantidade === 1 ? 'conta' : 'contas'}:
            </p>
            {data.contas.map((conta: any, idx: number) => (
              <div key={idx} className="text-xs flex justify-between gap-2 py-1">
                <span className="font-medium truncate flex-1">{conta.fornecedor}</span>
                <span className="text-primary font-semibold whitespace-nowrap">
                  {formatCurrency(conta.valor)}
                </span>
              </div>
            ))}
          </div>
        </div>
      );
    }
    return null;
  };

  if (loading) {
    return (
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <BarChart3 className="h-5 w-5" />
            Pagamentos por Dia
          </CardTitle>
          <CardDescription>
            Distribuição das contas em {mesAtual}
          </CardDescription>
        </CardHeader>
        <CardContent>
          <div className="h-[300px] flex items-center justify-center">
            <div className="animate-pulse w-full h-full bg-muted rounded"></div>
          </div>
        </CardContent>
      </Card>
    );
  }

  if (dadosDiarios.length === 0) {
    return (
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <BarChart3 className="h-5 w-5" />
            Pagamentos por Dia
          </CardTitle>
          <CardDescription>
            Distribuição das contas em {mesAtual}
          </CardDescription>
        </CardHeader>
        <CardContent>
          <div className="h-[300px] flex flex-col items-center justify-center text-center">
            <div className="w-16 h-16 bg-muted rounded-full flex items-center justify-center mb-4">
              <BarChart3 className="h-8 w-8 text-muted-foreground" />
            </div>
            <p className="text-sm text-muted-foreground">
              Nenhuma conta encontrada para este mês
            </p>
          </div>
        </CardContent>
      </Card>
    );
  }

  return (
    <Card>
      <CardHeader>
        <div className="flex items-start justify-between">
          <div className="flex-1">
            <CardTitle className="flex items-center gap-2">
              <BarChart3 className="h-5 w-5" />
              Pagamentos por Dia
            </CardTitle>
            <CardDescription className="mt-1">
              Distribuição das contas em {mesAtual}
            </CardDescription>
          </div>
          <div className="text-right">
            <div className="flex items-center gap-1 text-sm text-muted-foreground">
              <TrendingUp className="h-4 w-4" />
              <span className="font-semibold">Total: {formatCurrency(estatisticas.totalMes)}</span>
            </div>
            <p className="text-xs text-muted-foreground mt-1">
              {estatisticas.totalDias} {estatisticas.totalDias === 1 ? 'dia' : 'dias'} com pagamentos
            </p>
          </div>
        </div>
      </CardHeader>
      <CardContent>
        <ResponsiveContainer width="100%" height={300}>
          <BarChart
            data={dadosDiarios}
            margin={{ top: 20, right: 30, left: 20, bottom: 5 }}
          >
            <CartesianGrid strokeDasharray="3 3" className="stroke-muted" />
            <XAxis
              dataKey="dia"
              tick={{ fontSize: 11 }}
              tickLine={false}
              angle={-45}
              textAnchor="end"
              height={60}
            />
            <YAxis
              tick={{ fontSize: 12 }}
              tickLine={false}
              tickFormatter={(value: number) => `R$ ${value.toLocaleString('pt-BR')}`}
            />
            <Tooltip content={<CustomTooltip />} cursor={{ fill: 'rgba(59, 130, 246, 0.1)' }} />
            <Legend
              wrapperStyle={{ fontSize: '12px' }}
              formatter={() => 'Valor Total'}
            />
            <Bar
              dataKey="valor"
              name="Valor Total"
              radius={[8, 8, 0, 0]}
              maxBarSize={40}
            >
              {dadosDiarios.map((_entry, index) => (
                <Cell key={`cell-${index}`} fill={CORES[index % CORES.length]} />
              ))}
            </Bar>
          </BarChart>
        </ResponsiveContainer>

        {/* Informação adicional sobre o dia com maior valor */}
        {estatisticas.diaMaiorValor.valor > 0 && (
          <div className="mt-4 p-3 bg-muted rounded-lg">
            <p className="text-xs text-muted-foreground">
              <span className="font-semibold">{estatisticas.diaMaiorValor.diaCompleto}</span> tem o maior valor:{' '}
              <span className="font-bold text-foreground">
                {formatCurrency(estatisticas.diaMaiorValor.valor)}
              </span>
              {' '}({estatisticas.diaMaiorValor.quantidade} {estatisticas.diaMaiorValor.quantidade === 1 ? 'conta' : 'contas'})
            </p>
          </div>
        )}
      </CardContent>
    </Card>
  );
}
