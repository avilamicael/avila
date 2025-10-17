import { AppLayout } from "@/components/app-layout"
import { DataComboBox, type DataComboBoxRef } from "@/components/utils/data-combobox"
import { DataDialog } from "@/components/utils/data-dialog"
import { Input } from "@/components/ui/input"
import { Textarea } from "@/components/ui/textarea"
import { Button } from "@/components/ui/button"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { registrationsService, payablesService } from "@/services"
import { toast } from "sonner"
import { useState, useRef } from "react"
import { useNavigate } from "react-router-dom"
import type { AccountPayableCreate, RecurrenceFrequency } from "@/types/payables"
import { Loader2, BanknoteArrowDown, Upload, X } from "lucide-react"

// Máscaras e utilitários
const maskDate = (value: string): string => {
  const numbers = value.replace(/\D/g, "").slice(0, 8)
  if (numbers.length <= 2) return numbers
  if (numbers.length <= 4) return `${numbers.slice(0, 2)}/${numbers.slice(2)}`
  return `${numbers.slice(0, 2)}/${numbers.slice(2, 4)}/${numbers.slice(4)}`
}

const maskCurrency = (value: string): string => {
  const numbers = value.replace(/\D/g, "")
  const amount = Number(numbers) / 100
  return amount.toLocaleString("pt-BR", {
    minimumFractionDigits: 2,
    maximumFractionDigits: 2,
  })
}

const parseCurrency = (value: string): string => {
  return value.replace(/\D/g, "")
}

const parseDate = (value: string): string => {
  const parts = value.split("/")
  if (parts.length === 3) {
    let year = parts[2]
    if (year.length === 2) {
      const yearNum = parseInt(year, 10)
      year = yearNum < 50 ? `20${year}` : `19${year}`
    }
    return `${year}-${parts[1].padStart(2, '0')}-${parts[0].padStart(2, '0')}`
  }
  return ""
}

const validateDate = (value: string): boolean => {
  const parts = value.split("/")
  if (parts.length !== 3) return false

  const day = parseInt(parts[0], 10)
  const month = parseInt(parts[1], 10)
  let year = parts[2]

  if (year.length === 2) {
    const yearNum = parseInt(year, 10)
    year = yearNum < 50 ? `20${year}` : `19${year}`
  }

  const yearNum = parseInt(year, 10)

  if (day < 1 || day > 31) return false
  if (month < 1 || month > 12) return false
  if (year.length === 4 && (yearNum < 1900 || yearNum > 2100)) return false

  const date = new Date(yearNum, month - 1, day)
  return date.getFullYear() === yearNum &&
    date.getMonth() === month - 1 &&
    date.getDate() === day
}

export default function PayablesCreate() {
  const navigate = useNavigate()

  // Refs para os comboboxes
  const filialComboRef = useRef<DataComboBoxRef>(null)
  const fornecedorComboRef = useRef<DataComboBoxRef>(null)
  const categoriaComboRef = useRef<DataComboBoxRef>(null)
  const metodoComboRef = useRef<DataComboBoxRef>(null)

  // Estados dos comboboxes
  const [selectedFilialId, setSelectedFilialId] = useState<number | undefined>()
  const [selectedFornecedorId, setSelectedFornecedorId] = useState<number | undefined>()
  const [selectedCategoriaId, setSelectedCategoriaId] = useState<number | undefined>()
  const [selectedMetodoId, setSelectedMetodoId] = useState<number | undefined>()

  // Estados dos dialogs
  const [openFilialDialog, setOpenFilialDialog] = useState(false)
  const [openFornecedorDialog, setOpenFornecedorDialog] = useState(false)
  const [openCategoriaDialog, setOpenCategoriaDialog] = useState(false)
  const [openMetodoDialog, setOpenMetodoDialog] = useState(false)

  // Estados dos campos do formulário
  const [description, setDescription] = useState("")
  const [originalAmount, setOriginalAmount] = useState("")
  const [dueDate, setDueDate] = useState("")
  const [paymentType, setPaymentType] = useState<"unico" | "recorrente">("unico")
  const [invoiceNumbers, setInvoiceNumbers] = useState("")
  const [bankSlipNumber, setBankSlipNumber] = useState("")
  const [notes, setNotes] = useState("")
  const [recurrenceFrequency, setRecurrenceFrequency] = useState<RecurrenceFrequency | undefined>()
  const [recurrenceCount, setRecurrenceCount] = useState("")
  const [attachmentFiles, setAttachmentFiles] = useState<File[]>([])

  // Estado de loading
  const [isLoading, setIsLoading] = useState(false)

  // Validação do formulário
  const validateForm = (): boolean => {
    if (!selectedFilialId) {
      toast.error("Validação", { description: "Selecione uma filial" })
      return false
    }
    if (!selectedFornecedorId) {
      toast.error("Validação", { description: "Selecione um fornecedor" })
      return false
    }
    if (!selectedCategoriaId) {
      toast.error("Validação", { description: "Selecione uma categoria" })
      return false
    }
    if (!selectedMetodoId) {
      toast.error("Validação", { description: "Selecione um método de pagamento" })
      return false
    }
    if (!description.trim()) {
      toast.error("Validação", { description: "Preencha a descrição" })
      return false
    }
    if (!originalAmount) {
      toast.error("Validação", { description: "Preencha o valor original" })
      return false
    }
    if (!dueDate) {
      toast.error("Validação", { description: "Preencha a data de vencimento" })
      return false
    }
    if (!validateDate(dueDate)) {
      toast.error("Validação", { description: "Data de vencimento inválida. Use o formato DD/MM/AAAA ou DD/MM/AA" })
      return false
    }
    if (paymentType === "recorrente" && !recurrenceFrequency) {
      toast.error("Validação", { description: "Selecione a frequência de recorrência" })
      return false
    }
    if (paymentType === "recorrente" && (!recurrenceCount || Number(recurrenceCount) < 1)) {
      toast.error("Validação", { description: "Informe a quantidade de recorrências (mínimo 1)" })
      return false
    }
    return true
  }

  // Envio do formulário
  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()

    if (!validateForm()) return

    setIsLoading(true)
    try {
      // Gera a data de hoje no formato YYYY-MM-DD
      const today = new Date()
      const todayFormatted = `${today.getFullYear()}-${String(today.getMonth() + 1).padStart(2, '0')}-${String(today.getDate()).padStart(2, '0')}`

      const data: AccountPayableCreate = {
        branch: selectedFilialId!,
        supplier: selectedFornecedorId!,
        category: selectedCategoriaId!,
        payment_method: selectedMetodoId!,
        description,
        original_amount: (Number(parseCurrency(originalAmount)) / 100).toFixed(2),
        issue_date: todayFormatted, // Data de hoje automaticamente
        due_date: parseDate(dueDate),
        invoice_numbers: invoiceNumbers || undefined,
        bank_slip_number: bankSlipNumber || undefined,
        notes: notes || undefined,
        is_recurring: paymentType === "recorrente",
        recurrence_frequency: paymentType === "recorrente" ? recurrenceFrequency : undefined,
        recurrence_count: paymentType === "recorrente" ? Number(recurrenceCount) : undefined,
        attachment_files: attachmentFiles.length > 0 ? attachmentFiles : undefined,
      }

      await payablesService.createAccountPayable(data)
      toast.success("Conta cadastrada com sucesso!", {
        description: "A conta foi registrada no sistema."
      })

      // Limpa o formulário para permitir novo cadastro
      handleReset()
    } catch (error: any) {
      console.error("Erro ao cadastrar conta:", error)
      const errorMessage = error.response?.data?.message
        || error.response?.data?.detail
        || error.message
        || "Erro ao cadastrar conta"
      toast.error("Erro ao cadastrar conta", {
        description: errorMessage
      })
    } finally {
      setIsLoading(false)
    }
  }

  const handleCancel = () => {
    navigate("/payables")
  }

  const handleReset = () => {
    setSelectedFilialId(undefined)
    setSelectedFornecedorId(undefined)
    setSelectedCategoriaId(undefined)
    setSelectedMetodoId(undefined)
    setDescription("")
    setOriginalAmount("")
    setDueDate("")
    setPaymentType("unico")
    setInvoiceNumbers("")
    setBankSlipNumber("")
    setNotes("")
    setRecurrenceFrequency(undefined)
    setRecurrenceCount("")
    setAttachmentFiles([])

    filialComboRef.current?.refresh()
    fornecedorComboRef.current?.refresh()
    categoriaComboRef.current?.refresh()
    metodoComboRef.current?.refresh()
  }

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const files = e.target.files
    if (files) {
      setAttachmentFiles(Array.from(files))
    }
  }

  const handleRemoveFile = (index: number) => {
    setAttachmentFiles(prev => prev.filter((_, i) => i !== index))
  }

  return (
    <AppLayout>
      <div className="bg-card text-card-foreground rounded-lg shadow p-6">
        <h2 className="text-2xl font-bold mb-6">Cadastro de Contas a Pagar</h2>

        <form onSubmit={handleSubmit}>
          {/* Seção 1: Informações Básicas (4 colunas) */}
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
            {/* Filial */}
            <div>
              <label className="text-sm font-medium mb-2 block">FILIAL *</label>
              <DataComboBox
                ref={filialComboRef}
                value={selectedFilialId}
                onValueChange={(value) => setSelectedFilialId(value)}
                fetchData={(params) => registrationsService.listFilials(params)}
                mapItem={(filial) => ({
                  value: filial.id,
                  label: filial.name,
                  cnpj: filial.cnpj,
                })}
                placeholder="Selecione uma filial"
                searchPlaceholder="Buscar filial..."
                emptyMessage="Nenhuma filial encontrada"
                createLabel="Nova filial"
                allowCreate
                onCreateNew={() => setOpenFilialDialog(true)}
                renderItem={(item) => (
                  <div className="flex flex-col">
                    <span className="font-medium">{item.label}</span>
                    <span className="text-xs text-muted-foreground">{item.cnpj}</span>
                  </div>
                )}
              />
            </div>

            {/* Fornecedor */}
            <div>
              <label className="text-sm font-medium mb-2 block">FORNECEDOR *</label>
              <DataComboBox
                ref={fornecedorComboRef}
                value={selectedFornecedorId}
                onValueChange={(value) => setSelectedFornecedorId(value)}
                fetchData={(params) => registrationsService.listSuppliers(params)}
                mapItem={(fornecedor) => ({
                  value: fornecedor.id,
                  label: fornecedor.fantasy_name || fornecedor.name,
                })}
                placeholder="Selecione um fornecedor"
                searchPlaceholder="Buscar fornecedor..."
                emptyMessage="Nenhum fornecedor encontrado"
                createLabel="Novo fornecedor"
                allowCreate
                onCreateNew={() => setOpenFornecedorDialog(true)}
              />
            </div>

            {/* Categoria */}
            <div>
              <label className="text-sm font-medium mb-2 block">CATEGORIA *</label>
              <DataComboBox
                ref={categoriaComboRef}
                value={selectedCategoriaId}
                onValueChange={(value) => setSelectedCategoriaId(value)}
                fetchData={(params) => registrationsService.listCategories(params)}
                mapItem={(categoria) => ({
                  value: categoria.id,
                  label: categoria.name,
                })}
                placeholder="Selecione uma categoria"
                searchPlaceholder="Buscar categoria..."
                emptyMessage="Nenhuma categoria encontrada"
                createLabel="Nova categoria"
                allowCreate
                onCreateNew={() => setOpenCategoriaDialog(true)}
              />
            </div>

            {/* Método de Pagamento */}
            <div>
              <label className="text-sm font-medium mb-2 block">MÉTODO DE PAGAMENTO *</label>
              <DataComboBox
                ref={metodoComboRef}
                value={selectedMetodoId}
                onValueChange={(value) => setSelectedMetodoId(value)}
                fetchData={(params) => registrationsService.listPaymentMethods(params)}
                mapItem={(metodo) => ({
                  value: metodo.id,
                  label: metodo.name,
                })}
                placeholder="Selecione um método"
                searchPlaceholder="Buscar método..."
                emptyMessage="Nenhum método encontrado"
                createLabel="Novo método"
                allowCreate
                onCreateNew={() => setOpenMetodoDialog(true)}
              />
            </div>
          </div>

          {/* Seção 2: Descrição, Data e Valor (3 colunas) */}
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4 mt-6">
            {/* Descrição */}
            <div>
              <label className="text-sm font-medium mb-2 block">DESCRIÇÃO *</label>
              <Input
                value={description}
                onChange={(e) => setDescription(e.target.value.toUpperCase())}
                placeholder="INFORME A DESCRIÇÃO DA CONTA"
                className="w-full"
              />
            </div>

            {/* Data de Vencimento */}
            <div>
              <label className="text-sm font-medium mb-2 block">DATA DE VENCIMENTO *</label>
              <Input
                value={dueDate}
                onChange={(e) => setDueDate(maskDate(e.target.value))}
                placeholder="DD/MM/AAAA ou DD/MM/AA"
                className="w-full"
              />
            </div>

            {/* Valor Original */}
            <div>
              <label className="text-sm font-medium mb-2 block">VALOR ORIGINAL *</label>
              <div className="relative">
                <BanknoteArrowDown className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                <Input
                  value={originalAmount}
                  onChange={(e) => setOriginalAmount(maskCurrency(e.target.value))}
                  placeholder="0,00"
                  className="w-full pl-10"
                />
              </div>
            </div>
            {/* Tipo de Pagamento */}
            <div>
              <label className="text-sm font-medium mb-2 block">TIPO DE PAGAMENTO *</label>
              <Select
                value={paymentType}
                onValueChange={(value: "unico" | "recorrente") => setPaymentType(value)}
              >
                <SelectTrigger className="w-full">
                  <SelectValue placeholder="Selecione o tipo" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="unico">ÚNICO</SelectItem>
                  <SelectItem value="recorrente">RECORRENTE</SelectItem>
                </SelectContent>
              </Select>
            </div>
          </div>

          {/* Seção 3: Tipo de Pagamento, nota e boleto */}
          <div className="flex flex-col md:flex-row gap-4 mt-6">

            {/* Campos de Recorrência */}
            {paymentType === "recorrente" && (
              <>
                <div className="flex-[1.2] min-w-[160px]">
                  <label className="text-sm font-medium mb-2 block">FREQUÊNCIA *</label>
                  <Select
                    value={recurrenceFrequency}
                    onValueChange={(value: RecurrenceFrequency) => setRecurrenceFrequency(value)}
                  >
                    <SelectTrigger className="w-full">
                      <SelectValue placeholder="Selecione a frequência" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="weekly">Semanal</SelectItem>
                      <SelectItem value="biweekly">Quinzenal</SelectItem>
                      <SelectItem value="monthly">Mensal</SelectItem>
                      <SelectItem value="bimonthly">Bimestral</SelectItem>
                      <SelectItem value="quarterly">Trimestral</SelectItem>
                      <SelectItem value="semiannual">Semestral</SelectItem>
                      <SelectItem value="annual">Anual</SelectItem>
                    </SelectContent>
                  </Select>
                </div>

                <div className="flex-[0.6] min-w-[120px]">
                  <label className="text-sm font-medium mb-2 block">RECORRÊNCIAS *</label>
                  <Input
                    type="number"
                    value={recurrenceCount}
                    onChange={(e) => setRecurrenceCount(e.target.value)}
                    placeholder="Ex: 12"
                    min="1"
                    className="w-full"
                  />
                </div>
              </>
            )}
            <div className="flex-[1.3] min-w-[200px]">
              <label className="text-sm font-medium mb-2 block">NÚMERO(S) DA NOTA FISCAL</label>
              <Input
                value={invoiceNumbers}
                onChange={(e) => setInvoiceNumbers(e.target.value.toUpperCase())}
                placeholder="Ex: 123, 456, 789"
                className="w-full"
              />
            </div>

            <div className="flex-[1.3] min-w-[200px]">
              <label className="text-sm font-medium mb-2 block">NÚMERO DO BOLETO</label>
              <Input
                value={bankSlipNumber}
                onChange={(e) => setBankSlipNumber(e.target.value.replace(/\D/g, ""))}
                placeholder="Somente números"
                className="w-full"
              />
            </div>
          </div>


          {/* Seção 5: Observações e Anexo (2 colunas) */}
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mt-6">
            {/* Observações - 2 colunas */}
            <div className="md:col-span-2">
              <label className="text-sm font-medium mb-2 block">OBSERVAÇÕES</label>
              <Textarea
                value={notes}
                onChange={(e) => setNotes(e.target.value)}
                placeholder="Informações adicionais sobre esta conta..."
                rows={4}
                className="w-full resize-none"
              />
            </div>

            {/* Anexo - 1 coluna */}
            <div>
              <label className="text-sm font-medium mb-2 block">ANEXO</label>
              <div className="relative h-[116px]">
                <input
                  type="file"
                  multiple
                  onChange={handleFileChange}
                  className="hidden"
                  id="file-upload"
                  accept=".pdf,.jpg,.jpeg,.png,.doc,.docx,.xls,.xlsx"
                />
                <label
                  htmlFor="file-upload"
                  className="flex flex-col items-center justify-center h-full border-2 border-dashed border-border rounded-md cursor-pointer hover:border-gray-400 transition-colors"
                >
                  <Upload className="h-5 w-5 text-muted-foreground mb-1" />
                  <span className="text-xs text-muted-foreground text-center px-2">
                    {attachmentFiles.length > 0
                      ? `${attachmentFiles.length} arquivo(s) selecionado(s)`
                      : "Clique para adicionar"}
                  </span>
                  <span className="text-xs text-muted-foreground mt-1">PDF, Imagens, Office</span>
                </label>
              </div>
            </div>
          </div>

          {/* Lista de Arquivos Anexados */}
          {attachmentFiles.length > 0 && (
            <div className="mt-4 space-y-2">
              {attachmentFiles.map((file, index) => (
                <div
                  key={index}
                  className="flex items-center justify-between bg-muted/50 rounded-lg p-3"
                >
                  <div className="flex items-center gap-2 flex-1 min-w-0">
                    <div className="flex-1 min-w-0">
                      <p className="text-sm font-medium truncate">{file.name}</p>
                      <p className="text-xs text-muted-foreground">
                        {(file.size / 1024).toFixed(2)} KB
                      </p>
                    </div>
                  </div>
                  <Button
                    type="button"
                    variant="ghost"
                    size="sm"
                    onClick={() => handleRemoveFile(index)}
                    className="flex-shrink-0 ml-2"
                  >
                    <X className="w-4 h-4" />
                  </Button>
                </div>
              ))}
            </div>
          )}

          {/* Botões de Ação */}
          <div className="flex justify-end gap-4 mt-8 pt-4 border-t">
            <Button
              type="button"
              variant="outline"
              onClick={handleReset}
              disabled={isLoading}
            >
              Limpar
            </Button>
            <Button
              type="button"
              variant="outline"
              onClick={handleCancel}
              disabled={isLoading}
            >
              Cancelar
            </Button>
            <Button
              type="submit"
              disabled={isLoading}
            >
              {isLoading && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
              Cadastrar Conta
            </Button>
          </div>
        </form>
      </div>

      {/* DIALOG GENÉRICO PARA FILIAL */}
      <DataDialog
        open={openFilialDialog}
        onOpenChange={setOpenFilialDialog}
        title="Cadastrar Nova Filial"
        fields={[
          {
            name: "name",
            label: "Nome",
            type: "text",
            required: true,
            placeholder: "Nome"
          },
          {
            name: "cnpj",
            label: "CNPJ",
            type: "text",
            required: true,
            mask: "cnpj",
            placeholder: "00.000.000/0000-00",
            maxLength: 18
          },
          {
            name: "bank_account_name",
            label: "Nome da Conta Bancária",
            type: "text",
            placeholder: "Ex: Banco do Brasil - Conta Corrente"
          },
          {
            name: "bank_account_description",
            label: "Descrição da Conta Bancária",
            type: "textarea",
            placeholder: "Informações adicionais sobre a conta bancária",
            rows: 2
          },
          {
            name: "notes",
            label: "Observações",
            type: "textarea",
            placeholder: "Informações adicionais (opcional)",
            rows: 3
          }
        ]}
        onSubmit={(data) => registrationsService.createFilial(data as any)}
        onSuccess={(id) => {
          filialComboRef.current?.refresh()
          setSelectedFilialId(id)
          toast.success("Filial cadastrada", { description: "Filial criada com sucesso!" })
        }}
      />

      {/* DIALOG GENÉRICO PARA FORNECEDOR */}
      <DataDialog
        open={openFornecedorDialog}
        onOpenChange={setOpenFornecedorDialog}
        title="Cadastrar Novo Fornecedor"
        fields={[
          {
            name: "name",
            label: "Razão Social",
            type: "text",
            required: true,
            placeholder: "Nome"
          },
          {
            name: "fantasy_name",
            label: "Nome Fantasia",
            type: "text",
            placeholder: "Nome Fantasia"
          },
          {
            name: "cnpj",
            label: "CNPJ",
            type: "text",
            required: true,
            mask: "cnpj",
            placeholder: "00.000.000/0000-00",
            maxLength: 18
          },
          {
            name: "notes",
            label: "Observações",
            type: "textarea",
            placeholder: "Informações adicionais (opcional)",
            rows: 3
          }
        ]}
        onSubmit={(data) => registrationsService.createSupplier(data as any)}
        onSuccess={(id) => {
          fornecedorComboRef.current?.refresh()
          setSelectedFornecedorId(id)
          toast.success("Fornecedor cadastrado", { description: "Fornecedor criado com sucesso!" })
        }}
      />

      {/* DIALOG GENÉRICO PARA CATEGORIA */}
      <DataDialog
        open={openCategoriaDialog}
        onOpenChange={setOpenCategoriaDialog}
        title="Cadastrar Nova Categoria"
        description="Preencha os dados da categoria. Campos com * são obrigatórios."
        fields={[
          {
            name: "name",
            label: "Nome",
            type: "text",
            required: true,
            placeholder: "Ex: Despesas Operacionais"
          },
          {
            name: "description",
            label: "Descrição",
            type: "textarea",
            placeholder: "Descreva o uso desta categoria (opcional)",
            rows: 3
          }
        ]}
        onSubmit={(data) => registrationsService.createCategory(data as any)}
        onSuccess={(id) => {
          categoriaComboRef.current?.refresh()
          setSelectedCategoriaId(id)
          toast.success("Categoria cadastrada", { description: "Categoria criada com sucesso!" })
        }}
      />

      {/* DIALOG GENÉRICO PARA MÉTODO DE PAGAMENTO */}
      <DataDialog
        open={openMetodoDialog}
        onOpenChange={setOpenMetodoDialog}
        title="Cadastrar Novo Método de Pagamento"
        description="Preencha os dados do método de pagamento. Campos com * são obrigatórios."
        fields={[
          {
            name: "name",
            label: "Nome",
            type: "text",
            required: true,
            placeholder: "Ex: Dinheiro"
          },
          {
            name: "description",
            label: "Descrição",
            type: "textarea",
            placeholder: "Descreva o método de pagamento (opcional)",
            rows: 3
          }
        ]}
        onSubmit={(data) => registrationsService.createPaymentMethod(data as any)}
        onSuccess={(id) => {
          metodoComboRef.current?.refresh()
          setSelectedMetodoId(id)
          toast.success("Método cadastrado", { description: "Método de pagamento criado com sucesso!" })
        }}
      />
    </AppLayout>
  )
}
