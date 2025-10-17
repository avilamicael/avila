import { useState, useEffect } from "react"
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle } from "@/components/ui/dialog"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Textarea } from "@/components/ui/textarea"
import { DataComboBox } from "@/components/utils/data-combobox"
import { Loader2 } from "lucide-react"
import { registrationsService } from "@/services"
import { usePayment } from "@/hooks/payables/usePayment"
import { formatCurrency, formatDate, maskCurrency, parseCurrency } from "@/utils/formatters"
import { toast } from "sonner"
import type { AccountPayable } from "@/types/payables"

interface PaymentDialogProps {
  open: boolean
  onOpenChange: (open: boolean) => void
  account: AccountPayable | null
}

export function PaymentDialog({ open, onOpenChange, account }: PaymentDialogProps) {
  // Estados do formulário
  const [paymentDate, setPaymentDate] = useState("")
  const [interest, setInterest] = useState("")
  const [fine, setFine] = useState("")
  const [amountPaid, setAmountPaid] = useState("")
  const [manuallyEdited, setManuallyEdited] = useState(false)
  const [selectedBankAccountId, setSelectedBankAccountId] = useState<number | undefined>()
  const [selectedPaymentMethodId, setSelectedPaymentMethodId] = useState<number | undefined>()
  const [notes, setNotes] = useState("")

  // Mutation para pagamento
  const paymentMutation = usePayment()

  // Inicializa data de pagamento com hoje e valor sugerido
  useEffect(() => {
    if (open && account) {
      const today = new Date().toISOString().split('T')[0]
      setPaymentDate(today)

      // Pré-seleciona a conta bancária (branch da conta)
      setSelectedBankAccountId(account.branch)

      // Pré-seleciona a forma de pagamento da conta (se existir)
      if (account.payment_method) {
        setSelectedPaymentMethodId(account.payment_method)
      } else {
        // Se a conta não tem forma de pagamento, limpa a seleção
        setSelectedPaymentMethodId(undefined)
      }

      // Valor restante a pagar (considerando pagamentos já feitos)
      const remainingAmount = parseFloat(account.remaining_amount) || 0
      setAmountPaid(maskCurrency(String(remainingAmount * 100)))
      setInterest("")
      setFine("")
      setManuallyEdited(false)
    }
  }, [open, account])

  // Recalcula valor quando juros/multa mudam (se não foi editado manualmente)
  useEffect(() => {
    if (!account || manuallyEdited || !open) return

    const remainingAmount = parseFloat(account.remaining_amount) || 0
    const interestValue = parseCurrency(interest) / 100 || 0
    const fineValue = parseCurrency(fine) / 100 || 0

    const calculated = remainingAmount + interestValue + fineValue
    setAmountPaid(maskCurrency(String(Math.max(0, calculated * 100))))
  }, [interest, fine, account, manuallyEdited, open])

  const handleAmountChange = (value: string) => {
    setManuallyEdited(true)
    setAmountPaid(maskCurrency(value))
  }

  const handleInterestChange = (value: string) => {
    setInterest(maskCurrency(value))
    setManuallyEdited(false) // Volta para cálculo automático
  }

  const handleFineChange = (value: string) => {
    setFine(maskCurrency(value))
    setManuallyEdited(false) // Volta para cálculo automático
  }

  const handleSubmit = async () => {
    // Validações
    if (!account) return

    if (!paymentDate) {
      toast.error("Preencha a data de pagamento")
      return
    }

    if (!amountPaid || parseCurrency(amountPaid) === 0) {
      toast.error("Preencha o valor a pagar")
      return
    }

    if (!selectedBankAccountId) {
      toast.error("Selecione a conta bancária")
      return
    }

    if (!selectedPaymentMethodId) {
      toast.error("Selecione a forma de pagamento")
      return
    }

    const amount = parseCurrency(amountPaid) / 100
    const interestValue = parseCurrency(interest) / 100 || 0
    const fineValue = parseCurrency(fine) / 100 || 0
    const remaining = parseFloat(account.remaining_amount)

    // Aviso se o valor é maior que o restante
    if (amount > remaining + interestValue + fineValue) {
      const confirmed = window.confirm(
        `O valor do pagamento (${formatCurrency(amount)}) é maior que o saldo restante + juros/multa (${formatCurrency(remaining + interestValue + fineValue)}). Deseja continuar?`
      )
      if (!confirmed) return
    }

    // Prepara dados (formato esperado pelo hook usePayment - camelCase)
    const data = {
      accountPayable: account.id,
      paymentDate: paymentDate,
      amountPaid: amount,
      paymentMethod: selectedPaymentMethodId,
      paidByBranch: selectedBankAccountId,
      interest: interestValue > 0 ? interestValue : undefined,
      fine: fineValue > 0 ? fineValue : undefined,
      notes: notes || undefined
    }

    // Envia
    paymentMutation.mutate(data, {
      onSuccess: () => {
        handleClose()
      }
    })
  }

  const handleClose = () => {
    // Reset form
    setPaymentDate("")
    setInterest("")
    setFine("")
    setAmountPaid("")
    setManuallyEdited(false)
    setSelectedBankAccountId(undefined)
    setSelectedPaymentMethodId(undefined)
    setNotes("")
    onOpenChange(false)
  }

  if (!account) return null

  return (
    <Dialog open={open} onOpenChange={handleClose}>
      <DialogContent className="!max-w-[95vw] !w-[95vw] max-h-[95vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle>Registrar Pagamento</DialogTitle>
          <DialogDescription>
            Preencha os dados do pagamento. Campos com * são obrigatórios.
          </DialogDescription>
        </DialogHeader>

        <div className="space-y-6">
          {/* Seção 1: Informações da Conta (readonly) */}
          <div className="bg-blue-50 p-4 rounded-md border border-blue-200">
            <h3 className="font-semibold text-gray-700 mb-3">Informações da Conta</h3>
            <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
              <InfoRow label="Descrição" value={account.description} bold />
              <InfoRow label="Fornecedor" value={account.supplier_name} bold />
              <InfoRow label="Valor Total" value={formatCurrency(account.total_amount)} bold />
              <InfoRow
                label="Valor Já Pago"
                value={formatCurrency(account.paid_amount)}
                valueClassName="text-green-600 font-bold"
              />
            </div>
            <div className="mt-3 pt-3 border-t border-blue-200">
              <InfoRow
                label="Saldo Restante"
                value={formatCurrency(account.remaining_amount)}
                valueClassName="text-red-600 font-bold text-lg"
                bold
              />
            </div>
          </div>

          {/* Histórico de Pagamentos */}
          {account.payments && account.payments.length > 0 && (
            <div className="bg-green-50 p-4 rounded-md border border-green-200">
              <h3 className="font-semibold text-gray-700 mb-3">Histórico de Pagamentos</h3>
              <div className="space-y-2">
                {account.payments.map((payment, index) => (
                  <div key={payment.id} className="bg-white p-3 rounded border text-sm">
                    <div className="flex justify-between items-center">
                      <span className="text-gray-600">Pagamento {index + 1}</span>
                      <span className="font-bold text-green-600">{formatCurrency(payment.amount_paid)}</span>
                    </div>
                    <div className="flex justify-between items-center text-xs text-gray-500 mt-1">
                      <span>{formatDate(payment.payment_date)}</span>
                      <span>{payment.payment_method_name}</span>
                    </div>
                    {payment.notes && (
                      <p className="text-xs text-gray-600 mt-1 italic">{payment.notes}</p>
                    )}
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* Seção 2: Dados do Pagamento */}
          <div className="space-y-4">
            <h3 className="font-semibold text-gray-700">💵 Novo Pagamento</h3>

            <div className="grid grid-cols-4 gap-4">
              <div>
                <Label htmlFor="payment-date" className="mb-2 block">Data de Pagamento *</Label>
                <Input
                  id="payment-date"
                  type="date"
                  value={paymentDate}
                  onChange={(e) => setPaymentDate(e.target.value)}
                />
              </div>

              <div>
                <Label htmlFor="interest" className="mb-2 block">Juros</Label>
                <Input
                  id="interest"
                  value={interest}
                  onChange={(e) => handleInterestChange(e.target.value)}
                  placeholder="R$ 0,00"
                />
                <p className="text-xs text-gray-500 mt-1">
                  Opcional
                </p>
              </div>

              <div>
                <Label htmlFor="fine" className="mb-2 block">Multa</Label>
                <Input
                  id="fine"
                  value={fine}
                  onChange={(e) => handleFineChange(e.target.value)}
                  placeholder="R$ 0,00"
                />
                <p className="text-xs text-gray-500 mt-1">
                  Opcional
                </p>
              </div>

              <div>
                <Label htmlFor="amount-paid" className="mb-2 block">Valor a Pagar *</Label>
                <Input
                  id="amount-paid"
                  value={amountPaid}
                  onChange={(e) => handleAmountChange(e.target.value)}
                  className="font-bold text-lg"
                />
                <p className="text-xs text-blue-600 mt-1">
                  {manuallyEdited ? "✓ Valor editado manualmente" : "Calculado automaticamente"}
                </p>
              </div>
            </div>

            {/* Aviso visual sobre os cenários */}
            <div className="bg-yellow-50 border border-yellow-200 rounded-md p-3 text-xs">
              <p className="font-semibold text-yellow-800 mb-1">💡 Como usar:</p>
              <ul className="text-yellow-700 space-y-1 ml-4 list-disc">
                <li><strong>Com juros/multa:</strong> Preencha juros e/ou multa - o valor será calculado automaticamente</li>
                <li><strong>Valor diferente:</strong> Edite o valor final diretamente (ex: conta de R$ 1.500 que virou R$ 1.600)</li>
                <li><strong>Pagamento parcial:</strong> Digite o valor que deseja pagar agora</li>
              </ul>
            </div>

          </div>

          {/* Seção 3: Informações Bancárias */}
          <div className="space-y-4">
            <h3 className="font-semibold text-sm text-gray-700">🏦 Informações Bancárias</h3>

            <div className="grid grid-cols-2 gap-4">
              <div>
                <Label>Conta Bancária *</Label>
                <DataComboBox
                  value={selectedBankAccountId}
                  onValueChange={setSelectedBankAccountId}
                  fetchData={(params) => registrationsService.listFilials(params)}
                  mapItem={(filial) => ({
                    value: filial.id,
                    label: `${filial.name} - ${filial.bank_account_name || 'S/ Conta'}`
                  })}
                  placeholder="Selecione a conta bancária"
                />
              </div>

              <div>
                <Label>Forma de Pagamento *</Label>
                <DataComboBox
                  value={selectedPaymentMethodId}
                  onValueChange={setSelectedPaymentMethodId}
                  fetchData={(params) => registrationsService.listPaymentMethods(params)}
                  mapItem={(method) => ({
                    value: method.id,
                    label: method.name
                  })}
                  placeholder="Selecione a forma de pagamento"
                />
              </div>
            </div>
          </div>

          {/* Seção 4: Observações */}
          <div>
            <Label htmlFor="notes">Observações (opcional)</Label>
            <Textarea
              id="notes"
              value={notes}
              onChange={(e) => setNotes(e.target.value)}
              placeholder="Observações sobre este pagamento..."
              rows={3}
              maxLength={500}
            />
            <p className="text-xs text-gray-500 mt-1">{notes.length}/500 caracteres</p>
          </div>
        </div>

        <DialogFooter>
          <Button variant="outline" onClick={handleClose} disabled={paymentMutation.isPending}>
            Cancelar
          </Button>
          <Button onClick={handleSubmit} disabled={paymentMutation.isPending}>
            {paymentMutation.isPending && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
            Confirmar Pagamento
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  )
}

/**
 * Componente auxiliar para exibir informações readonly
 */
function InfoRow({ label, value, bold = false, valueClassName = "" }: {
  label: React.ReactNode
  value: string
  bold?: boolean
  valueClassName?: string
}) {
  return (
    <div className="flex flex-col">
      <span className="text-xs text-gray-600 mb-1">{label}</span>
      <span className={`text-sm ${bold ? "font-bold" : ""} ${valueClassName || "text-gray-900"}`}>
        {value}
      </span>
    </div>
  )
}
