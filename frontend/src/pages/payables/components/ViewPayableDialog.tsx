import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle } from "@/components/ui/dialog"
import { Badge } from "@/components/ui/badge"
import { formatCurrency, formatDate } from "@/utils/formatters"
import type { AccountPayable } from "@/types/payables"
import { cn } from "@/lib/utils"

interface ViewPayableDialogProps {
  open: boolean
  onOpenChange: (open: boolean) => void
  account: AccountPayable | null
}

export function ViewPayableDialog({ open, onOpenChange, account }: ViewPayableDialogProps) {
  if (!account) return null

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-4xl max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle>Detalhes da Conta a Pagar</DialogTitle>
          <DialogDescription>
            Visualize todas as informações sobre esta conta
          </DialogDescription>
        </DialogHeader>

        <div className="space-y-6">
          {/* Status e Informações Básicas */}
          <div className="bg-gray-50 p-4 rounded-lg border">
            <div className="flex items-center justify-between mb-4">
              <h3 className="font-semibold text-gray-700">Status e Identificação</h3>
              <Badge
                className={cn(
                  account.status === 'paid' ? 'bg-green-900 text-white' : '',
                  account.status === 'cancelled' ? 'bg-gray-200 text-gray-600' : '',
                  account.status === 'partially_paid' ? 'bg-yellow-600 text-white' : '',
                  account.status === 'due' ? 'bg-blue-900 text-white' : '',
                  account.status === 'overdue' ? 'bg-red-900 text-white' : ''
                )}
              >
                {account.status_display}
              </Badge>
            </div>
            <div className="grid grid-cols-2 gap-4">
              <InfoRow label="ID" value={`#${account.id}`} />
              <InfoRow label="Descrição" value={account.description} bold />
            </div>
          </div>

          {/* Informações do Fornecedor e Filial */}
          <div className="grid grid-cols-2 gap-4">
            <div className="bg-gray-50 p-4 rounded-lg border">
              <h3 className="font-semibold text-gray-700 mb-3">Fornecedor</h3>
              <InfoRow label="Nome" value={account.supplier_name} bold />
            </div>
            <div className="bg-gray-50 p-4 rounded-lg border">
              <h3 className="font-semibold text-gray-700 mb-3">Filial</h3>
              <InfoRow label="Nome" value={account.branch_name} bold />
            </div>
          </div>

          {/* Informações Financeiras */}
          <div className="bg-blue-50 p-4 rounded-lg border border-blue-200">
            <h3 className="font-semibold text-gray-700 mb-3">Informações Financeiras</h3>
            <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
              <InfoRow label="Valor Original" value={formatCurrency(account.original_amount)} bold />
              <InfoRow label="Desconto" value={formatCurrency(account.discount)} />
              <InfoRow label="Juros" value={formatCurrency(account.interest)} />
              <InfoRow label="Multa" value={formatCurrency(account.fine)} />
            </div>
            <div className="mt-4 pt-4 border-t border-blue-200">
              <div className="grid grid-cols-3 gap-4">
                <InfoRow label="Valor Total" value={formatCurrency(account.total_amount)} bold />
                <InfoRow
                  label="Valor Pago"
                  value={formatCurrency(account.paid_amount)}
                  valueClassName="text-green-600 font-bold"
                />
                <InfoRow
                  label="Saldo Restante"
                  value={formatCurrency(account.remaining_amount)}
                  valueClassName={parseFloat(account.remaining_amount) > 0 ? "text-red-600 font-bold" : "text-gray-600"}
                />
              </div>
            </div>
          </div>

          {/* Datas */}
          <div className="bg-gray-50 p-4 rounded-lg border">
            <h3 className="font-semibold text-gray-700 mb-3">Datas</h3>
            <div className="grid grid-cols-3 gap-4">
              <InfoRow label="Data de Emissão" value={formatDate(account.issue_date)} />
              <InfoRow label="Data de Vencimento" value={formatDate(account.due_date)} />
              <InfoRow
                label="Data de Pagamento"
                value={account.payment_date ? formatDate(account.payment_date) : "Não pago"}
              />
            </div>
          </div>

          {/* Categoria e Método de Pagamento */}
          <div className="grid grid-cols-2 gap-4">
            <div className="bg-gray-50 p-4 rounded-lg border">
              <h3 className="font-semibold text-gray-700 mb-3">Categoria</h3>
              <InfoRow label="Nome" value={account.category_name} bold />
            </div>
            <div className="bg-gray-50 p-4 rounded-lg border">
              <h3 className="font-semibold text-gray-700 mb-3">Método de Pagamento</h3>
              <InfoRow label="Nome" value={account.payment_method_name} bold />
            </div>
          </div>

          {/* Informações Adicionais */}
          {(account.invoice_numbers || account.bank_slip_number || account.notes) && (
            <div className="bg-gray-50 p-4 rounded-lg border">
              <h3 className="font-semibold text-gray-700 mb-3">Informações Adicionais</h3>
              <div className="space-y-2">
                {account.invoice_numbers && (
                  <InfoRow label="Número(s) da Nota Fiscal" value={account.invoice_numbers} />
                )}
                {account.bank_slip_number && (
                  <InfoRow label="Número do Boleto" value={account.bank_slip_number} />
                )}
                {account.notes && (
                  <div>
                    <p className="text-sm text-gray-600 mb-1">Observações:</p>
                    <p className="text-sm text-gray-900 bg-white p-3 rounded border">{account.notes}</p>
                  </div>
                )}
              </div>
            </div>
          )}

          {/* Recorrência */}
          {account.is_recurring && (
            <div className="bg-purple-50 p-4 rounded-lg border border-purple-200">
              <h3 className="font-semibold text-gray-700 mb-3">Informações de Recorrência</h3>
              <div className="grid grid-cols-2 gap-4">
                <InfoRow label="Recorrente" value="Sim" />
                <InfoRow
                  label="Frequência"
                  value={account.recurrence_frequency ? getRecurrenceLabel(account.recurrence_frequency) : "-"}
                />
                {account.recurrence_count && (
                  <InfoRow label="Quantidade de Parcelas" value={account.recurrence_count.toString()} />
                )}
              </div>
            </div>
          )}

          {/* Histórico de Pagamentos */}
          {account.payments && account.payments.length > 0 && (
            <div className="bg-green-50 p-4 rounded-lg border border-green-200">
              <h3 className="font-semibold text-gray-700 mb-3">Histórico de Pagamentos</h3>
              <div className="space-y-3">
                {account.payments.map((payment) => (
                  <div key={payment.id} className="bg-white p-3 rounded border">
                    <div className="grid grid-cols-4 gap-4 text-sm">
                      <div>
                        <p className="text-gray-600">Data</p>
                        <p className="font-medium">{formatDate(payment.payment_date)}</p>
                      </div>
                      <div>
                        <p className="text-gray-600">Valor</p>
                        <p className="font-medium text-green-600">{formatCurrency(payment.amount_paid)}</p>
                      </div>
                      <div>
                        <p className="text-gray-600">Método</p>
                        <p className="font-medium">{payment.payment_method_name}</p>
                      </div>
                      <div>
                        <p className="text-gray-600">Registrado por</p>
                        <p className="font-medium">{payment.created_by_name}</p>
                      </div>
                    </div>
                    {payment.notes && (
                      <div className="mt-2 pt-2 border-t">
                        <p className="text-xs text-gray-600">Observações: {payment.notes}</p>
                      </div>
                    )}
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* Metadados */}
          <div className="bg-gray-50 p-4 rounded-lg border text-xs text-gray-500">
            <div className="grid grid-cols-2 gap-2">
              <p>Criado em: {new Date(account.created_at).toLocaleString('pt-BR')}</p>
              <p>Atualizado em: {new Date(account.updated_at).toLocaleString('pt-BR')}</p>
            </div>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  )
}

/**
 * Componente auxiliar para exibir informações em formato label: valor
 */
function InfoRow({
  label,
  value,
  bold = false,
  valueClassName = ""
}: {
  label: string
  value: string
  bold?: boolean
  valueClassName?: string
}) {
  return (
    <div className="flex flex-col">
      <span className="text-xs text-gray-600 mb-1">{label}</span>
      <span className={cn(
        "text-sm",
        bold && "font-bold text-gray-900",
        !bold && "text-gray-900",
        valueClassName
      )}>
        {value}
      </span>
    </div>
  )
}

/**
 * Retorna a label da frequência de recorrência em português
 */
function getRecurrenceLabel(frequency: string): string {
  const labels: Record<string, string> = {
    weekly: 'Semanal',
    biweekly: 'Quinzenal',
    monthly: 'Mensal',
    bimonthly: 'Bimestral',
    quarterly: 'Trimestral',
    semiannual: 'Semestral',
    annual: 'Anual'
  }
  return labels[frequency] || frequency
}
