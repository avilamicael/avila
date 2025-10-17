import { useState, useEffect, useMemo } from "react"
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle } from "@/components/ui/dialog"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Textarea } from "@/components/ui/textarea"
import { DataComboBox } from "@/components/utils/data-combobox"
import { Progress } from "@/components/ui/progress"
import { Loader2 } from "lucide-react"
import { registrationsService } from "@/services"
import { useBatchPayment } from "@/hooks/payables/useBatchPayment"
import { formatCurrency, maskCurrency, parseCurrency } from "@/utils/formatters"
import { toast } from "sonner"
import type { AccountPayable } from "@/types/payables"

interface BatchPaymentDialogProps {
  open: boolean
  onOpenChange: (open: boolean) => void
  accounts: AccountPayable[]
  onSuccess: () => void
}

interface AccountPaymentData {
  accountId: number
  paymentDate: string
  interest: string
  fine: string
  amountPaid: string
  bankAccountId?: number
  paymentMethodId?: number
  notes: string
}

export function BatchPaymentDialog({
  open,
  onOpenChange,
  accounts,
  onSuccess
}: BatchPaymentDialogProps) {
  // Estados dos dados individuais de cada conta
  const [accountsData, setAccountsData] = useState<AccountPaymentData[]>([])

  // Hook de pagamento em lote
  const { processBatch, isProcessing, progress } = useBatchPayment()

  // Inicializa dados de cada conta quando o dialog abre
  useEffect(() => {
    if (open && accounts.length > 0) {
      const today = new Date().toISOString().split('T')[0]

      const initialData = accounts.map(account => {
        // Usa remaining_amount que já vem calculado do backend
        const remainingAmount = parseFloat(account.remaining_amount) || 0

        return {
          accountId: account.id,
          paymentDate: today,
          interest: "",
          fine: "",
          amountPaid: maskCurrency(String(remainingAmount * 100)),
          bankAccountId: account.branch, // Pré-seleciona a filial da conta
          paymentMethodId: account.payment_method || undefined, // Pré-seleciona a forma de pagamento
          notes: ""
        }
      })

      setAccountsData(initialData)
    }
  }, [open, accounts])

  // Atualiza dados de uma conta específica
  const updateAccountData = (accountId: number, field: keyof AccountPaymentData, value: string | number | undefined) => {
    setAccountsData(prev => prev.map(data => {
      if (data.accountId === accountId) {
        const updated = { ...data, [field]: value }

        // Recalcula valor a pagar se for juros ou multa
        if (field === 'interest' || field === 'fine') {
          const account = accounts.find(a => a.id === accountId)
          if (account) {
            const remainingAmount = parseFloat(account.remaining_amount) || 0
            const interest = parseCurrency(field === 'interest' ? value as string : data.interest) / 100 || 0
            const fine = parseCurrency(field === 'fine' ? value as string : data.fine) / 100 || 0
            const calculated = remainingAmount + interest + fine
            updated.amountPaid = maskCurrency(String(calculated * 100))
          }
        }

        return updated
      }
      return data
    }))
  }

  // Cálculos dos totais
  const totals = useMemo(() => {
    const totalAmount = accountsData.reduce((sum, data) => {
      return sum + (parseCurrency(data.amountPaid) / 100)
    }, 0)

    return {
      count: accounts.length,
      total: totalAmount
    }
  }, [accountsData, accounts.length])

  const handleSubmit = async () => {
    // Validações
    if (accountsData.some(data => !data.paymentDate)) {
      toast.error("Preencha a data de pagamento de todas as contas")
      return
    }

    if (accountsData.some(data => !data.amountPaid || parseCurrency(data.amountPaid) === 0)) {
      toast.error("Preencha o valor a pagar de todas as contas")
      return
    }

    if (accountsData.some(data => !data.bankAccountId)) {
      toast.error("Selecione a conta bancária para todas as contas")
      return
    }

    if (accountsData.some(data => !data.paymentMethodId)) {
      toast.error("Selecione a forma de pagamento para todas as contas")
      return
    }

    // Prepara dados individuais para cada conta
    const paymentsData = accountsData.map(data => {
      const account = accounts.find(a => a.id === data.accountId)!
      const interestValue = parseCurrency(data.interest) / 100 || 0
      const fineValue = parseCurrency(data.fine) / 100 || 0

      return {
        account,
        paymentDate: data.paymentDate,
        amountPaid: parseCurrency(data.amountPaid) / 100,
        paymentMethod: data.paymentMethodId!,
        paidByBranch: data.bankAccountId!,
        interest: interestValue > 0 ? interestValue : undefined,
        fine: fineValue > 0 ? fineValue : undefined,
        notes: data.notes || undefined
      }
    })

    // Processa
    const result = await processBatch(paymentsData)

    // Se teve sucesso total ou parcial, fecha dialog
    if (result.success.length > 0) {
      handleClose()
      onSuccess()
    }
  }

  const handleClose = () => {
    if (isProcessing) return // Não permite fechar durante processamento

    // Reset form
    setAccountsData([])
    onOpenChange(false)
  }

  const progressPercent = progress.total > 0
    ? (progress.current / progress.total) * 100
    : 0

  return (
    <Dialog open={open} onOpenChange={handleClose}>
      <DialogContent className="!max-w-[95vw] !w-[95vw] max-h-[95vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle>💰 Pagamento em Lote ({accounts.length} contas)</DialogTitle>
          <DialogDescription>
            Preencha os dados de pagamento para cada conta selecionada. Os campos em comum serão aplicados a todas.
          </DialogDescription>
        </DialogHeader>

        <div className="space-y-6">
          {/* Seção de Dados Individuais por Conta */}
          <div className="space-y-4">
            <div className="flex justify-between items-center">
              <h3 className="font-semibold text-sm text-gray-700">💵 Dados de Pagamento por Conta</h3>
              <span className="text-sm text-gray-500">
                Preencha os dados de cada conta abaixo
              </span>
            </div>

            {accounts.map((account, index) => {
              const accountData = accountsData.find(d => d.accountId === account.id)
              if (!accountData) return null

              return (
                <div key={account.id} className="bg-gray-50 p-4 rounded-md border space-y-3">
                  {/* Cabeçalho da conta */}
                  <div className="flex justify-between items-start border-b pb-2">
                    <div>
                      <h4 className="font-semibold text-sm text-gray-900">
                        {index + 1}. {account.description}
                      </h4>
                      <p className="text-xs text-gray-600">
                        Fornecedor: {account.supplier_name} | Valor Original: {formatCurrency(account.original_amount)}
                      </p>
                    </div>
                  </div>

                  {/* Campos de pagamento */}
                  <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-3">
                    <div>
                      <Label htmlFor={`date-${account.id}`} className="text-xs">Data de Pagamento *</Label>
                      <Input
                        id={`date-${account.id}`}
                        type="date"
                        value={accountData.paymentDate}
                        onChange={(e) => updateAccountData(account.id, 'paymentDate', e.target.value)}
                        disabled={isProcessing}
                        className="text-sm"
                      />
                    </div>

                    <div>
                      <Label htmlFor={`interest-${account.id}`} className="text-xs">Juros</Label>
                      <Input
                        id={`interest-${account.id}`}
                        value={accountData.interest}
                        onChange={(e) => updateAccountData(account.id, 'interest', maskCurrency(e.target.value))}
                        placeholder="R$ 0,00"
                        disabled={isProcessing}
                        className="text-sm"
                      />
                    </div>

                    <div>
                      <Label htmlFor={`fine-${account.id}`} className="text-xs">Multa</Label>
                      <Input
                        id={`fine-${account.id}`}
                        value={accountData.fine}
                        onChange={(e) => updateAccountData(account.id, 'fine', maskCurrency(e.target.value))}
                        placeholder="R$ 0,00"
                        disabled={isProcessing}
                        className="text-sm"
                      />
                    </div>

                    <div>
                      <Label htmlFor={`amount-${account.id}`} className="text-xs">Valor a Pagar *</Label>
                      <Input
                        id={`amount-${account.id}`}
                        value={accountData.amountPaid}
                        onChange={(e) => updateAccountData(account.id, 'amountPaid', maskCurrency(e.target.value))}
                        disabled={isProcessing}
                        className="text-sm font-bold"
                      />
                    </div>
                  </div>

                  {/* Campos bancários e observações */}
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-3 pt-2">
                    <div className="grid grid-cols-2 gap-3">
                       <div>
                        <Label className="text-xs">Conta Bancária *</Label>
                        <DataComboBox
                          value={accountData.bankAccountId}
                          onValueChange={(value) => updateAccountData(account.id, 'bankAccountId', value)}
                          fetchData={(params) => registrationsService.listFilials(params)}
                          mapItem={(filial) => ({
                            value: filial.id,
                            label: `${filial.name} - ${filial.bank_account_name || 'S/ Conta'}`
                          })}
                          placeholder="Selecione a conta"
                          disabled={isProcessing}
                        />
                      </div>
                      <div>
                        <Label className="text-xs">Forma de Pagamento *</Label>
                        <DataComboBox
                          value={accountData.paymentMethodId}
                          onValueChange={(value) => updateAccountData(account.id, 'paymentMethodId', value)}
                          fetchData={(params) => registrationsService.listPaymentMethods(params)}
                          mapItem={(method) => ({
                            value: method.id,
                            label: method.name
                          })}
                          placeholder="Selecione a forma"
                          disabled={isProcessing}
                        />
                      </div>
                    </div>
                    <div>
                      <Label htmlFor={`notes-${account.id}`} className="text-xs">Observações</Label>
                      <Textarea
                        id={`notes-${account.id}`}
                        value={accountData.notes}
                        onChange={(e) => updateAccountData(account.id, 'notes', e.target.value)}
                        placeholder="Observações deste pagamento..."
                        rows={1}
                        maxLength={500}
                        disabled={isProcessing}
                        className="text-sm min-h-[38px]"
                      />
                    </div>
                  </div>
                </div>
              )
            })}
          </div>

          {/* Resumo Total */}
          <div className="bg-blue-50 p-4 rounded-md border border-blue-200">
            <div className="flex justify-between items-center">
              <span className="font-semibold text-sm text-gray-700">💰 Total Geral</span>
              <span className="font-bold text-xl text-blue-900">
                {formatCurrency(totals.total)}
              </span>
            </div>
            <p className="text-xs text-gray-600 mt-1">
              {totals.count} conta(s) selecionada(s)
            </p>
          </div>

          {/* Progress Bar (durante processamento) */}
          {isProcessing && (
            <div className="space-y-2">
              <div className="flex justify-between text-sm text-gray-600">
                <span>Processando pagamentos...</span>
                <span>{progress.current} de {progress.total}</span>
              </div>
              <Progress value={progressPercent} className="h-2" />
            </div>
          )}
        </div>

        <DialogFooter>
          <Button variant="outline" onClick={handleClose} disabled={isProcessing}>
            Cancelar
          </Button>
          <Button onClick={handleSubmit} disabled={isProcessing}>
            {isProcessing && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
            ✅ Confirmar Todos ({accounts.length} contas)
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  )
}
