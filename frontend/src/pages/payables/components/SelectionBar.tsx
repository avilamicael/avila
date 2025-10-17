import { Button } from "@/components/ui/button"
import { formatCurrency } from "@/utils/formatters"
import type { AccountPayable } from "@/types/payables"

interface SelectionBarProps {
  selectedAccounts: AccountPayable[]
  onPaySelected: () => void
  onExport: () => void
  onClearSelection: () => void
}

export function SelectionBar({
  selectedAccounts,
  onPaySelected,
  onExport,
  onClearSelection
}: SelectionBarProps) {
  if (selectedAccounts.length === 0) return null

  // Calcula total selecionado
  const totalAmount = selectedAccounts.reduce((sum, account) => {
    return sum + parseFloat(account.original_amount)
  }, 0)

  return (
    <div className="sticky bottom-0 bg-blue-50 border-t border-blue-200 p-4 flex justify-between items-center animate-in slide-in-from-bottom duration-200">
      <div className="flex items-center gap-4">
        <div className="text-sm font-medium">
          <span className="text-blue-900">
            {selectedAccounts.length} conta(s) selecionada(s)
          </span>
          <span className="mx-2 text-blue-400">|</span>
          <span className="text-blue-900">
            Total: <span className="font-bold">{formatCurrency(totalAmount)}</span>
          </span>
        </div>
        <Button
          size="sm"
          variant="ghost"
          onClick={onClearSelection}
          className="text-blue-600 hover:text-blue-800"
        >
          Limpar seleção
        </Button>
      </div>

      <div className="flex gap-2">
        {/* <Button
          variant="outline"
          onClick={onExport}
          className="bg-white"
        >
          📥 Exportar
        </Button> */}
        <Button
          onClick={onPaySelected}
          className="bg-green-900 hover:bg-green-700"
        >
          Pagar Selecionadas ({selectedAccounts.length})
        </Button>
      </div>
    </div>
  )
}
