import { Input } from "@/components/ui/input"
import { Button } from "@/components/ui/button"
import { DataComboBox } from "@/components/utils/data-combobox"
import { MultiSelect } from "@/components/ui/multi-select"
import { registrationsService } from "@/services"
import { Search, X, Calendar } from "lucide-react"
import type { AccountPayableStatus } from "@/types/payables"

interface PayablesFiltersProps {
  searchTerm: string
  onSearchTermChange: (value: string) => void
  selectedStatuses: AccountPayableStatus[]
  onStatusesChange: (value: AccountPayableStatus[]) => void
  selectedSupplierId?: number
  onSupplierChange: (value?: number) => void
  selectedCategoryId?: number
  onCategoryChange: (value?: number) => void
  selectedBranchId?: number
  onBranchChange: (value?: number) => void
  selectedPaymentMethodId?: number
  onPaymentMethodChange: (value?: number) => void
  dueDateStart?: string
  onDueDateStartChange: (value: string) => void
  dueDateEnd?: string
  onDueDateEndChange: (value: string) => void
  paymentDateStart?: string
  onPaymentDateStartChange: (value: string) => void
  paymentDateEnd?: string
  onPaymentDateEndChange: (value: string) => void
  onClearFilters: () => void
  hasActiveFilters: boolean
}

const STATUS_OPTIONS = [
  { value: 'due', label: 'À Vencer' },
  { value: 'overdue', label: 'Vencida' },
  { value: 'paid', label: 'Paga' },
  { value: 'cancelled', label: 'Cancelada' }
]

export function PayablesFilters({
  searchTerm,
  onSearchTermChange,
  selectedStatuses,
  onStatusesChange,
  selectedSupplierId,
  onSupplierChange,
  selectedCategoryId,
  onCategoryChange,
  selectedBranchId,
  onBranchChange,
  selectedPaymentMethodId,
  onPaymentMethodChange,
  dueDateStart,
  onDueDateStartChange,
  dueDateEnd,
  onDueDateEndChange,
  paymentDateStart,
  onPaymentDateStartChange,
  paymentDateEnd,
  onPaymentDateEndChange,
  onClearFilters,
  hasActiveFilters
}: PayablesFiltersProps) {
  return (
    <div className="space-y-4">
      <div className="flex gap-4">
        <div className="flex-1 relative">
          <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-muted-foreground" />
          <Input
            placeholder="Buscar por descrição, fornecedor ou categoria..."
            value={searchTerm}
            onChange={(e) => onSearchTermChange(e.target.value)}
            className="pl-10"
          />
        </div>
        {hasActiveFilters && (
          <Button
            variant="outline"
            onClick={onClearFilters}
            className="flex items-center gap-2"
          >
            <X className="h-4 w-4" />
            Limpar Filtros
          </Button>
        )}
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-5 gap-4">
        <div>
          <label className="text-xs font-medium text-foreground mb-1 block">
            STATUS
          </label>
          <MultiSelect
            options={STATUS_OPTIONS}
            value={selectedStatuses}
            onChange={onStatusesChange}
            placeholder="Todos os status"
            emptyMessage="Nenhum status encontrado"
          />
        </div>

        <div>
          <label className="text-xs font-medium text-foreground mb-1 block">
            FORNECEDOR
          </label>
          <DataComboBox
            value={selectedSupplierId}
            onValueChange={onSupplierChange}
            fetchData={(params) => registrationsService.listSuppliers(params)}
            mapItem={(supplier) => ({
              value: supplier.id,
              label: supplier.fantasy_name || supplier.name,
            })}
            placeholder="Todos os fornecedores"
            searchPlaceholder="Buscar fornecedor..."
            emptyMessage="Nenhum fornecedor encontrado"
          />
        </div>

        <div>
          <label className="text-xs font-medium text-foreground mb-1 block">
            CATEGORIA
          </label>
          <DataComboBox
            value={selectedCategoryId}
            onValueChange={onCategoryChange}
            fetchData={(params) => registrationsService.listCategories(params)}
            mapItem={(category) => ({
              value: category.id,
              label: category.name,
            })}
            placeholder="Todas as categorias"
            searchPlaceholder="Buscar categoria..."
            emptyMessage="Nenhuma categoria encontrada"
          />
        </div>

        <div>
          <label className="text-xs font-medium text-foreground mb-1 block">
            FILIAL
          </label>
          <DataComboBox
            value={selectedBranchId}
            onValueChange={onBranchChange}
            fetchData={(params) => registrationsService.listFilials(params)}
            mapItem={(branch) => ({
              value: branch.id,
              label: branch.name,
            })}
            placeholder="Todas as filiais"
            searchPlaceholder="Buscar filial..."
            emptyMessage="Nenhuma filial encontrada"
          />
        </div>

        <div>
          <label className="text-xs font-medium text-foreground mb-1 block">
            MÉTODO DE PAGAMENTO
          </label>
          <DataComboBox
            value={selectedPaymentMethodId}
            onValueChange={onPaymentMethodChange}
            fetchData={(params) => registrationsService.listPaymentMethods(params)}
            mapItem={(method) => ({
              value: method.id,
              label: method.name,
            })}
            placeholder="Todos os métodos"
            searchPlaceholder="Buscar método..."
            emptyMessage="Nenhum método encontrado"
          />
        </div>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        <div className="border rounded-lg p-4 bg-muted/30">
          <div className="flex items-center gap-2 mb-3">
            <Calendar className="h-4 w-4 text-muted-foreground" />
            <label className="text-xs font-semibold text-foreground uppercase">
              Data de Vencimento
            </label>
          </div>
          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="text-xs text-muted-foreground mb-1 block">De:</label>
              <Input
                type="date"
                value={dueDateStart || ""}
                onChange={(e) => onDueDateStartChange(e.target.value)}
                className="text-sm"
              />
            </div>
            <div>
              <label className="text-xs text-muted-foreground mb-1 block">Até:</label>
              <Input
                type="date"
                value={dueDateEnd || ""}
                onChange={(e) => onDueDateEndChange(e.target.value)}
                className="text-sm"
              />
            </div>
          </div>
        </div>

        <div className="border rounded-lg p-4 bg-muted/30">
          <div className="flex items-center gap-2 mb-3">
            <Calendar className="h-4 w-4 text-muted-foreground" />
            <label className="text-xs font-semibold text-foreground uppercase">
              Data de Pagamento
            </label>
          </div>
          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="text-xs text-muted-foreground mb-1 block">De:</label>
              <Input
                type="date"
                value={paymentDateStart || ""}
                onChange={(e) => onPaymentDateStartChange(e.target.value)}
                className="text-sm"
              />
            </div>
            <div>
              <label className="text-xs text-muted-foreground mb-1 block">Até:</label>
              <Input
                type="date"
                value={paymentDateEnd || ""}
                onChange={(e) => onPaymentDateEndChange(e.target.value)}
                className="text-sm"
              />
            </div>
          </div>
        </div>
      </div>
    </div>
  )
}
