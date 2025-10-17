import { useMemo } from 'react';
import type { AccountPayable } from '@/types/payables';
import { startOfMonth, endOfMonth, format } from 'date-fns';
import { ptBR } from 'date-fns/locale';
import { parseBackendDate } from '@/utils/formatters';

export interface ContaDetalhada {
  fornecedor: string;
  descricao: string;
  valor: number;
}

export interface DadosDia {
  dia: string;
  diaCompleto: string;
  valor: number;
  quantidade: number;
  contas: ContaDetalhada[];
  data: Date;
}

/**
 * Hook que processa as contas a pagar e agrupa por dia do mês atual
 */
export function useDadosDiarios(contas: AccountPayable[]) {
  const dadosDiarios = useMemo(() => {
    const hoje = new Date();
    const inicioMes = startOfMonth(hoje);
    const fimMes = endOfMonth(hoje);

    console.log('=== DEBUG useDadosDiarios ===');
    console.log('Total de contas recebidas:', contas.length);
    console.log('Mês atual:', hoje.getMonth() + 1, '/', hoje.getFullYear());
    console.log('Período:', inicioMes, 'até', fimMes);

    // Log das primeiras 5 contas para ver as datas
    if (contas.length > 0) {
      console.log('Primeiras 5 contas (raw):');
      contas.slice(0, 5).forEach((c, i) => {
        const dataParsed = parseBackendDate(c.due_date);
        console.log(`  ${i + 1}. due_date: "${c.due_date}" -> parsed:`, dataParsed,
                    `| Mês: ${dataParsed.getMonth() + 1}/${dataParsed.getFullYear()}`);
      });
    }

    // Cria array com todos os dias do mês que têm contas
    const diasComContas = new Map<string, DadosDia>();
    let contasNoMes = 0;

    contas.forEach(conta => {
      const dataVencimento = parseBackendDate(conta.due_date);

      // Verifica se a conta vence no mês atual
      if (dataVencimento >= inicioMes && dataVencimento <= fimMes) {
        contasNoMes++;
        const diaKey = format(dataVencimento, 'yyyy-MM-dd');

        const valor = parseFloat(conta.total_amount);

        const contaDetalhada: ContaDetalhada = {
          fornecedor: conta.supplier_name || 'Sem fornecedor',
          descricao: conta.description,
          valor
        };

        if (diasComContas.has(diaKey)) {
          const diaExistente = diasComContas.get(diaKey)!;
          diaExistente.valor += valor;
          diaExistente.quantidade += 1;
          diaExistente.contas.push(contaDetalhada);
        } else {
          diasComContas.set(diaKey, {
            dia: format(dataVencimento, 'dd/MM', { locale: ptBR }),
            diaCompleto: format(dataVencimento, "dd 'de' MMMM", { locale: ptBR }),
            valor,
            quantidade: 1,
            contas: [contaDetalhada],
            data: dataVencimento
          });
        }
      }
    });

    console.log('Total de contas no mês atual:', contasNoMes);
    console.log('Total de dias com contas:', diasComContas.size);

    // Converte para array e ordena por data
    return Array.from(diasComContas.values()).sort((a, b) =>
      a.data.getTime() - b.data.getTime()
    );
  }, [contas]);

  // Calcula estatísticas
  const estatisticas = useMemo(() => {
    const totalMes = dadosDiarios.reduce((sum, dia) => sum + dia.valor, 0);
    const mediaDiaria = dadosDiarios.length > 0 ? totalMes / dadosDiarios.length : 0;
    const diaMaiorValor = dadosDiarios.reduce((max, dia) =>
      dia.valor > max.valor ? dia : max
    , { dia: '', diaCompleto: '', valor: 0, quantidade: 0, contas: [], data: new Date() });

    return {
      totalMes,
      mediaDiaria,
      diaMaiorValor,
      totalDias: dadosDiarios.length
    };
  }, [dadosDiarios]);

  return {
    dadosDiarios,
    estatisticas
  };
}
