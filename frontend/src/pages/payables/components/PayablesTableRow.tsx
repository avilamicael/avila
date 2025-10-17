import { Checkbox } from "@/components/ui/checkbox"
import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"
import { cn } from "@/lib/utils"
import { formatCurrency, formatDate, getDaysUntilDue, getDaysLabel } from "@/utils/formatters"
import type { AccountPayable, AccountPayableStatus } from "@/types/payables"

interface PayablesTableRowProps {
  account: AccountPayable
  isSelected: boolean
  onToggleSelect: (id: number) => void
  onPay: (account: AccountPayable) => void
  onView: (account: AccountPayable) => void
}

export function PayablesTableRow({
  account,
  isSelected,
  onToggleSelect,
  onPay,
  onView
}: PayablesTableRowProps) {
  const days = getDaysUntilDue(account.due_date)
  const daysLabel = getDaysLabel(days)
  const isOverdue = (account.status === 'overdue' || days < 0) && account.status !== 'paid'

  return (
    <tr
      className={cn(
        "transition-all duration-200 hover:bg-muted/50 hover:shadow-sm",
        "border-b border-border last:border-b-0",
        isSelected && "bg-blue-50/70 dark:bg-blue-950/30 hover:bg-blue-50 dark:hover:bg-blue-950/40",
        isOverdue && "border-l-4 border-l-red-500 bg-red-50/30 dark:bg-red-950/20"
      )}
    >
      {/* Checkbox */}
      <td className="p-4 text-center">
        <Checkbox
          checked={isSelected}
          onCheckedChange={() => onToggleSelect(account.id)}
        />
      </td>

      {/* Status */}
      <td className="p-4">
        <Badge
          className={cn(
            account.status === 'paid' ? 'bg-green-900 text-white' : '',
            account.status === 'cancelled' ? 'bg-gray-200 text-gray-600' : '',
            account.status === 'partially_paid' ? 'bg-yellow-600 text-white' : '',
            account.status === 'due' ? 'bg-blue-900 text-white' : '',
            account.status === 'overdue' ? 'bg-red-900 text-white' : ''
          )}
        >
          {getStatusLabel(account.status)}
        </Badge>
      </td>

      {/* Descrição + Categoria */}
      <td className="p-4">
        <div className="flex flex-col">
          <span className="font-medium text-foreground">{account.description}</span>
          <span className="text-xs text-muted-foreground">{account.category_name}</span>
        </div>
      </td>

      {/* Fornecedor */}
      <td className="p-4">
        <span className="text-sm text-foreground">{account.supplier_name}</span>
      </td>

      {/* Vencimento */}
      <td className="p-4">
        <div className="flex flex-col">
          <span className="text-sm text-foreground">{formatDate(account.due_date)}</span>
          {account.status === 'paid' && account.payment_date ? (
            <span className="text-xs text-green-600 dark:text-green-400 font-medium">
              Pago em {formatDate(account.payment_date)}
            </span>
          ) : daysLabel && (
            <span
              className={cn(
                "text-xs",
                days < 0 && "text-red-600 dark:text-red-400 font-medium",
                days === 0 && "text-orange-600 dark:text-orange-400 font-medium",
                days <= 7 && days > 0 && "text-yellow-600 dark:text-yellow-400"
              )}
            >
              {daysLabel}
            </span>
          )}
        </div>
      </td>

      {/* Valor Original */}
      <td className="p-4 text-right">
        <span className="font-medium text-foreground">
          {formatCurrency(account.original_amount)}
        </span>
      </td>

      {/* Valor Pago */}
      <td className="p-4 text-right">
        <span
          className={cn(
            parseFloat(account.paid_amount) > 0 ? "text-green-600 dark:text-green-400 font-medium" : "text-muted-foreground"
          )}
        >
          {formatCurrency(account.paid_amount)}
        </span>
      </td>

      {/* Ações */}
      <td className="p-4">
        <div className="flex gap-2">
          <Button
            size="sm"
            onClick={() => onView(account)}
            className="text-xs bg-green-900 text-white hover:bg-green-600"
          >
            Ver
          </Button>
          {account.status !== 'paid' && account.status !== 'cancelled' && (
            <Button
              size="sm"
              onClick={() => onPay(account)}
              className="text-xs"
            >
              Pagar
            </Button>
          )}
        </div>
      </td>
    </tr>
  )
}



/**
 * Retorna a label do status em português
 */
function getStatusLabel(status: AccountPayableStatus): string {
  const labels: Record<AccountPayableStatus, string> = {
    overdue: 'Vencida',
    due: 'À Vencer',
    pending: 'Pendente',
    paid: 'Paga',
    partially_paid: 'Parcial',
    cancelled: 'Cancelada'
  }
  return labels[status] || status
}
