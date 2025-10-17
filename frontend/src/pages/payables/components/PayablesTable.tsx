import { Checkbox } from "@/components/ui/checkbox"
import { Table, TableBody, TableHead, TableHeader, TableRow } from "@/components/ui/table"
import { Skeleton } from "@/components/ui/skeleton"
import { Button } from "@/components/ui/button"
import { ArrowUpDown } from "lucide-react"
import { PayablesTableRow } from "./PayablesTableRow"
import type { AccountPayable } from "@/types/payables"

interface PayablesTableProps {
  accounts: AccountPayable[]
  selectedIds: number[]
  ordering: string
  onToggleSelect: (id: number) => void
  onToggleSelectAll: () => void
  onPay: (account: AccountPayable) => void
  onView: (account: AccountPayable) => void
  onSort: (column: string) => void
  isLoading?: boolean
}

export function PayablesTable({
  accounts,
  selectedIds,
  ordering,
  onToggleSelect,
  onToggleSelectAll,
  onPay,
  onView,
  onSort,
  isLoading = false
}: PayablesTableProps) {
  const SortableHeader = ({ column, children, className }: { column: string, children: React.ReactNode, className?: string }) => {
    const isActive = ordering.endsWith(column)
    return (
      <Button variant="ghost" onClick={() => onSort(column)} className={`px-2 py-1 h-auto -ml-2 ${className}`}>
        {children}
        <ArrowUpDown className={`ml-2 h-4 w-4 ${isActive ? 'text-foreground' : 'text-muted-foreground/50'}`} />
      </Button>
    )
  }

  // Verifica se todos estão selecionados
  const allSelected = accounts.length > 0 && selectedIds.length === accounts.length
  const someSelected = selectedIds.length > 0 && selectedIds.length < accounts.length

  if (isLoading) {
    return <TableSkeleton />
  }

  if (accounts.length === 0) {
    return (
      <div className="rounded-md border bg-muted/20">
        <div className="flex flex-col items-center justify-center py-16">
          <div className="rounded-full bg-muted p-4 mb-4">
            <svg
              className="h-12 w-12 text-muted-foreground"
              fill="none"
              viewBox="0 0 24 24"
              stroke="currentColor"
              strokeWidth={1.5}
            >
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                d="M9 12h3.75M9 15h3.75M9 18h3.75m3 .75H18a2.25 2.25 0 002.25-2.25V6.108c0-1.135-.845-2.098-1.976-2.192a48.424 48.424 0 00-1.123-.08m-5.801 0c-.065.21-.1.433-.1.664 0 .414.336.75.75.75h4.5a.75.75 0 00.75-.75 2.25 2.25 0 00-.1-.664m-5.8 0A2.251 2.251 0 0113.5 2.25H15c1.012 0 1.867.668 2.15 1.586m-5.8 0c-.376.023-.75.05-1.124.08C9.095 4.01 8.25 4.973 8.25 6.108V8.25m0 0H4.875c-.621 0-1.125.504-1.125 1.125v11.25c0 .621.504 1.125 1.125 1.125h9.75c.621 0 1.125-.504 1.125-1.125V9.375c0-.621-.504-1.125-1.125-1.125H8.25zM6.75 12h.008v.008H6.75V12zm0 3h.008v.008H6.75V15zm0 3h.008v.008H6.75V18z"
              />
            </svg>
          </div>
          <h3 className="text-lg font-semibold mb-1">
            Nenhuma conta encontrada
          </h3>
          <p className="text-sm text-muted-foreground mb-6 max-w-sm text-center">
            Não há contas a pagar nesta categoria. Tente alterar os filtros ou criar uma nova conta.
          </p>
        </div>
      </div>
    )
  }

  return (
    <div className="rounded-md border">
      <Table>
        <TableHeader>
          <TableRow>
            <TableHead className="w-[40px] text-center">
              <Checkbox
                checked={allSelected}
                onCheckedChange={onToggleSelectAll}
                className={someSelected ? "data-[state=checked]:bg-blue-400" : ""}
              />
            </TableHead>
            <TableHead className="w-[120px]"><SortableHeader column="status">Status</SortableHeader></TableHead>
            <TableHead><SortableHeader column="description">Descrição / Categoria</SortableHeader></TableHead>
            <TableHead><SortableHeader column="supplier__name">Fornecedor</SortableHeader></TableHead>
            <TableHead><SortableHeader column="due_date">Vencimento</SortableHeader></TableHead>
            <TableHead className="text-right"><SortableHeader column="original_amount" className="ml-auto">Valor</SortableHeader></TableHead>
            <TableHead className="text-right"><SortableHeader column="paid_amount" className="ml-auto">Pago</SortableHeader></TableHead>
            <TableHead className="w-[180px] text-center">Ações</TableHead>
          </TableRow>
        </TableHeader>
        <TableBody>
          {accounts.map((account) => (
            <PayablesTableRow
              key={account.id}
              account={account}
              isSelected={selectedIds.includes(account.id)}
              onToggleSelect={onToggleSelect}
              onPay={onPay}
              onView={onView}
            />
          ))}
        </TableBody>
      </Table>
    </div>
  )
}

/**
 * Skeleton loader para a tabela com animação pulse
 */
function TableSkeleton() {
  return (
    <div className="rounded-md border animate-pulse">
      <Table>
        <TableHeader>
          <TableRow className="bg-muted/20">
            <TableHead className="w-[40px]">
              <Skeleton className="h-4 w-4" />
            </TableHead>
            <TableHead className="w-[120px]">
              <Skeleton className="h-4 w-20" />
            </TableHead>
            <TableHead>
              <Skeleton className="h-4 w-32" />
            </TableHead>
            <TableHead>
              <Skeleton className="h-4 w-32" />
            </TableHead>
            <TableHead>
              <Skeleton className="h-4 w-24" />
            </TableHead>
            <TableHead className="text-right">
              <Skeleton className="h-4 w-24 ml-auto" />
            </TableHead>
            <TableHead className="text-right">
              <Skeleton className="h-4 w-20 ml-auto" />
            </TableHead>
            <TableHead>
              <Skeleton className="h-4 w-32" />
            </TableHead>
          </TableRow>
        </TableHeader>
        <TableBody>
          {Array.from({ length: 8 }).map((_, index) => (
            <TableRow key={index} className="hover:bg-muted/20">
              <td className="p-4">
                <Skeleton className="h-4 w-4 rounded" />
              </td>
              <td className="p-4">
                <Skeleton className="h-6 w-24 rounded-full" />
              </td>
              <td className="p-4">
                <div className="space-y-2">
                  <Skeleton className="h-4 w-48 rounded" />
                  <Skeleton className="h-3 w-32 rounded" />
                </div>
              </td>
              <td className="p-4">
                <Skeleton className="h-4 w-36 rounded" />
              </td>
              <td className="p-4">
                <div className="space-y-2">
                  <Skeleton className="h-4 w-24 rounded" />
                  <Skeleton className="h-3 w-20 rounded" />
                </div>
              </td>
              <td className="p-4 text-right">
                <Skeleton className="h-4 w-24 ml-auto rounded" />
              </td>
              <td className="p-4 text-right">
                <Skeleton className="h-4 w-20 ml-auto rounded" />
              </td>
              <td className="p-4">
                <div className="flex gap-2">
                  <Skeleton className="h-8 w-16 rounded" />
                  <Skeleton className="h-8 w-20 rounded" />
                </div>
              </td>
            </TableRow>
          ))}
        </TableBody>
      </Table>
    </div>
  )
}
