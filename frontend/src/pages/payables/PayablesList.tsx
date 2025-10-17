import { useState, useEffect } from "react"
import { AppLayout } from "@/components/app-layout"
import { Button } from "@/components/ui/button"
import { Loader2, Plus } from "lucide-react"
import { useNavigate } from "react-router-dom"
import { PayablesFilters } from "./components/PayablesFilters"
import { PayablesTable } from "./components/PayablesTable"
import { PayablesTableSkeleton } from "./components/PayablesTableSkeleton"
import { SelectionBar } from "./components/SelectionBar"
import { PaymentDialog } from "./components/PaymentDialog"
import { BatchPaymentDialog } from "./components/BatchPaymentDialog"
import { ViewPayableDialog } from "./components/ViewPayableDialog"
import { usePayables } from "@/hooks/payables/usePayables"
import type { AccountPayable, AccountPayableStatus } from "@/types/payables"
import { toast } from "sonner"
import { Collapsible, CollapsibleContent, CollapsibleTrigger } from "@/components/ui/collapsible"
import { Filter, ChevronDown } from "lucide-react"

export default function PayablesList() {
  const navigate = useNavigate()

  // Estados da página
  const [page, setPage] = useState(1)
  const [pageSize, setPageSize] = useState(50) // Usando 50 como padrão
  const [ordering, setOrdering] = useState<string>('due_date')
  const [selectedIds, setSelectedIds] = useState<number[]>([])

  // Estados dos filtros
  const [searchTerm, setSearchTerm] = useState("")
  const [debouncedSearchTerm, setDebouncedSearchTerm] = useState("")
  const [selectedStatuses, setSelectedStatuses] = useState<AccountPayableStatus[]>([])
  const [selectedSupplierId, setSelectedSupplierId] = useState<number | undefined>()
  const [selectedCategoryId, setSelectedCategoryId] = useState<number | undefined>()
  const [selectedBranchId, setSelectedBranchId] = useState<number | undefined>()
  const [selectedPaymentMethodId, setSelectedPaymentMethodId] = useState<number | undefined>()
  const [dueDateStart, setDueDateStart] = useState("")
  const [dueDateEnd, setDueDateEnd] = useState("")
  const [paymentDateStart, setPaymentDateStart] = useState("")
  const [paymentDateEnd, setPaymentDateEnd] = useState("")
  const [filtersOpen, setFiltersOpen] = useState(false)
  // Estados dos dialogs
  const [paymentDialogOpen, setPaymentDialogOpen] = useState(false)
  const [viewDialogOpen, setViewDialogOpen] = useState(false)
  const [selectedAccount, setSelectedAccount] = useState<AccountPayable | null>(null)
  const [batchPaymentDialogOpen, setBatchPaymentDialogOpen] = useState(false)

  // Busca dados com o hook
  const { data, isLoading, isFetching } = usePayables({
    page,
    pageSize,
    searchTerm: debouncedSearchTerm,
    statuses: selectedStatuses.length > 0 ? selectedStatuses : undefined,
    supplierId: selectedSupplierId,
    categoryId: selectedCategoryId,
    branchId: selectedBranchId,
    paymentMethodId: selectedPaymentMethodId,
    dueDateStart: dueDateStart || undefined,
    dueDateEnd: dueDateEnd || undefined,
    paymentDateStart: paymentDateStart || undefined,
    paymentDateEnd: paymentDateEnd || undefined,
    ordering
  })

  // Debounce para busca (aguarda 500ms após o usuário parar de digitar)
  useEffect(() => {
    const timer = setTimeout(() => {
      setDebouncedSearchTerm(searchTerm)
      setPage(1) // Volta para primeira página ao buscar
    }, 500)
    return () => clearTimeout(timer)
  }, [searchTerm, setDebouncedSearchTerm, setPage])

  const accounts = data?.results || []
  const totalCount = data?.count || 0

  // Contas selecionadas (objetos completos)
  const selectedAccounts = accounts.filter(acc => selectedIds.includes(acc.id))

  // Verifica se há filtros ativos
  const hasActiveFilters = !!(
    searchTerm ||
    selectedStatuses.length > 0 ||
    selectedSupplierId ||
    selectedCategoryId ||
    selectedBranchId ||
    selectedPaymentMethodId ||
    dueDateStart ||
    dueDateEnd ||
    paymentDateStart ||
    paymentDateEnd
  )

  // Handlers
  const handleClearFilters = () => {
    setSearchTerm("")
    setSelectedStatuses([])
    setSelectedSupplierId(undefined)
    setSelectedCategoryId(undefined)
    setSelectedBranchId(undefined)
    setSelectedPaymentMethodId(undefined)
    setDueDateStart("")
    setDueDateEnd("")
    setPaymentDateStart("")
    setPaymentDateEnd("")
    setPage(1)
  }

  const handleToggleSelect = (id: number) => {
    setSelectedIds(prev =>
      prev.includes(id)
        ? prev.filter(selectedId => selectedId !== id)
        : [...prev, id]
    )
  }

  const handleToggleSelectAll = () => {
    if (selectedIds.length === accounts.length) {
      setSelectedIds([])
    } else {
      setSelectedIds(accounts.map(acc => acc.id))
    }
  }

  const handlePay = (account: AccountPayable) => {
    setSelectedAccount(account)
    setPaymentDialogOpen(true)
  }

  const handleView = (account: AccountPayable) => {
    setSelectedAccount(account)
    setViewDialogOpen(true)
  }

  const handlePaySelected = () => {
    if (selectedAccounts.length === 0) {
      toast.error("Selecione pelo menos uma conta para pagar")
      return
    }
    setBatchPaymentDialogOpen(true)
  }

  const handleBatchPaymentSuccess = () => {
    setSelectedIds([]) // Limpa seleção após sucesso
  }

  const handleExport = () => {
    // TODO: Implementar exportação
    toast.info("Exportar contas (a implementar)")
  }

  const handleClearSelection = () => {
    setSelectedIds([])
  }

  const handleCreateNew = () => {
    navigate("/payables/create")
  }

  const handleSort = (column: string) => {
    setOrdering(prev => {
      if (prev.endsWith(column) && !prev.startsWith('-')) {
        return `-${column}` // de asc para desc
      }
      return column // de desc para asc, ou nova coluna
    })
    setPage(1)
  }

  // Paginação
  const totalPages = Math.ceil(totalCount / pageSize)

  return (
    <AppLayout>
      <div className="space-y-6">
        {/* Header */}
        <div className="flex justify-between items-center">
          <div>
            <h1 className="text-3xl font-bold">Contas a Pagar</h1>
            <p className="text-muted-foreground mt-1">
              Gerencie e realize pagamentos de contas a pagar
            </p>
          </div>
          <Button onClick={handleCreateNew}>
            <Plus className="mr-2 h-4 w-4" />
            Nova Conta
          </Button>
        </div>

        {/* Card Colapsável com Filtros */}
        <Collapsible open={filtersOpen} onOpenChange={setFiltersOpen}>
          <div className="border rounded-lg bg-card shadow-sm">
            {/* Header do Card */}
            <CollapsibleTrigger asChild>
              <div className="flex items-center justify-between p-4 cursor-pointer hover:bg-accent transition-colors">
                <div className="flex items-center gap-2">
                  <Filter className="h-5 w-5 text-muted-foreground" />
                  <h3 className="font-semibold text-card-foreground">Filtros Avançados</h3>
                  {hasActiveFilters && (
                    <span className="ml-2 px-2 py-1 bg-primary/10 text-primary text-xs rounded-full font-medium">
                      Ativos
                    </span>
                  )}
                </div>
                <ChevronDown
                  className={`h-5 w-5 text-muted-foreground transition-transform ${filtersOpen ? 'transform rotate-180' : ''}`}
                />
              </div>
            </CollapsibleTrigger>

            {/* Conteúdo dos Filtros */}
            <CollapsibleContent>
              <div className="p-4 border-t">
                <PayablesFilters
                  onSearchTermChange={setSearchTerm}
                  selectedStatuses={selectedStatuses}
                  onStatusesChange={setSelectedStatuses}
                  selectedSupplierId={selectedSupplierId}
                  onSupplierChange={setSelectedSupplierId}
                  selectedCategoryId={selectedCategoryId}
                  onCategoryChange={setSelectedCategoryId}
                  selectedBranchId={selectedBranchId}
                  onBranchChange={setSelectedBranchId}
                  selectedPaymentMethodId={selectedPaymentMethodId}
                  onPaymentMethodChange={setSelectedPaymentMethodId}
                  dueDateStart={dueDateStart}
                  onDueDateStartChange={setDueDateStart}
                  dueDateEnd={dueDateEnd}
                  onDueDateEndChange={setDueDateEnd}
                  paymentDateStart={paymentDateStart}
                  onPaymentDateStartChange={setPaymentDateStart}
                  paymentDateEnd={paymentDateEnd}
                  onPaymentDateEndChange={setPaymentDateEnd}
                  onClearFilters={handleClearFilters}
                  hasActiveFilters={hasActiveFilters}
                  searchTerm={searchTerm}
                  />
              </div>
            </CollapsibleContent>
          </div>
        </Collapsible>

        {/* Contador de Resultados */}
        <div className="flex justify-between items-center text-sm text-muted-foreground">
          <div>
            {!isLoading && (
              <span>
                Mostrando {accounts.length} de {totalCount} conta(s)
              </span>
            )}
            {isFetching && (
              <span className="ml-2 inline-flex items-center gap-1 text-primary">
                <Loader2 className="h-3 w-3 animate-spin" />
                Atualizando...
              </span>
            )}
          </div>
          {totalPages > 1 && (
            <div className="text-muted-foreground">
              Página {page} de {totalPages}
            </div>
          )}
        </div>

        {/* Tabela */}
        {isLoading && !data ? (
          <PayablesTableSkeleton />
        ) : (
          <PayablesTable
            accounts={accounts}
            selectedIds={selectedIds}
            onToggleSelect={handleToggleSelect}
            onToggleSelectAll={handleToggleSelectAll}
            onPay={handlePay}
            onView={handleView}
            isLoading={isLoading && !!data} // Passa true se estiver carregando dados novos
            ordering={ordering}
            onSort={handleSort}
            onEdit={() => { }} // TODO
            onDelete={() => { }} // TODO
          />
        )}

        {/* Paginação Simples */}
        {totalPages > 1 && (
          <div className="flex justify-center gap-2">
            <Button
              variant="outline"
              onClick={() => setPage(p => Math.max(1, p - 1))}
              disabled={page === 1 || isLoading}
            >
              ← Anterior
            </Button>
            <div className="flex items-center gap-2">
              {Array.from({ length: Math.min(5, totalPages) }, (_, i) => {
                const pageNum = i + 1
                return (
                  <Button
                    key={pageNum}
                    variant={page === pageNum ? "default" : "outline"}
                    onClick={() => setPage(pageNum)}
                    disabled={isLoading}
                    size="sm"
                  >
                    {pageNum}
                  </Button>
                )
              })}
              {totalPages > 5 && (
                <>
                  <span className="text-muted-foreground">...</span>
                  <Button
                    variant={page === totalPages ? "default" : "outline"}
                    onClick={() => setPage(totalPages)}
                    disabled={isLoading}
                    size="sm"
                  >
                    {totalPages}
                  </Button>
                </>
              )}
            </div>
            <Button
              variant="outline"
              onClick={() => setPage(p => Math.min(totalPages, p + 1))}
              disabled={page === totalPages || isLoading}
            >
              Próxima →
            </Button>
          </div>
        )}

        {/* Barra de Seleção (aparece quando há itens selecionados) */}
        <SelectionBar
          selectedAccounts={selectedAccounts}
          onPaySelected={handlePaySelected}
          onExport={handleExport}
          onClearSelection={handleClearSelection}
        />
      </div>

      {/* Dialogs */}
      <PaymentDialog
        open={paymentDialogOpen}
        onOpenChange={setPaymentDialogOpen}
        account={selectedAccount}
      />

      <ViewPayableDialog
        open={viewDialogOpen}
        onOpenChange={setViewDialogOpen}
        account={selectedAccount}
      />

      <BatchPaymentDialog
        open={batchPaymentDialogOpen}
        onOpenChange={setBatchPaymentDialogOpen}
        accounts={selectedAccounts}
        onSuccess={handleBatchPaymentSuccess}
      />
    </AppLayout>
  )
}
