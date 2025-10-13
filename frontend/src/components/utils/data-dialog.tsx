import { useState, useEffect } from "react"
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { toast } from "sonner"

// ============================================================================
// TYPES & INTERFACES
// ============================================================================

export type FieldType = "text" | "textarea" | "number" | "email" | "tel"
export type MaskType = "cnpj" | "cpf" | "phone" | "cep" | "currency"

export interface FieldConfig {
  name: string
  label: string
  type?: FieldType
  placeholder?: string
  required?: boolean
  mask?: MaskType
  maxLength?: number
  rows?: number // Para textarea
  validation?: (value: string) => string | undefined // Validação customizada
}

export interface DataDialogProps<T = any> {
  // Controle do dialog
  open: boolean
  onOpenChange: (open: boolean) => void

  // Configuração
  title: string
  description?: string
  fields: FieldConfig[]

  // Dados
  initialData?: Partial<T>
  onSubmit: (data: T) => Promise<{ id: number } | any>
  onSuccess?: (id: number) => void
  onError?: (error: any) => void

  // Textos customizáveis
  submitLabel?: string
  cancelLabel?: string
  loadingLabel?: string
}

// ============================================================================
// MÁSCARAS
// ============================================================================

const masks = {
  cnpj: (value: string) => {
    const numbers = value.replace(/\D/g, "").slice(0, 14)
    return numbers
      .replace(/^(\d{2})(\d)/, "$1.$2")
      .replace(/^(\d{2})\.(\d{3})(\d)/, "$1.$2.$3")
      .replace(/\.(\d{3})(\d)/, ".$1/$2")
      .replace(/(\d{4})(\d)/, "$1-$2")
  },

  cpf: (value: string) => {
    const numbers = value.replace(/\D/g, "").slice(0, 11)
    return numbers
      .replace(/^(\d{3})(\d)/, "$1.$2")
      .replace(/^(\d{3})\.(\d{3})(\d)/, "$1.$2.$3")
      .replace(/\.(\d{3})(\d)/, ".$1-$2")
  },

  phone: (value: string) => {
    const numbers = value.replace(/\D/g, "").slice(0, 11)
    if (numbers.length <= 10) {
      return numbers
        .replace(/^(\d{2})(\d)/, "($1) $2")
        .replace(/(\d{4})(\d)/, "$1-$2")
    }
    return numbers
      .replace(/^(\d{2})(\d)/, "($1) $2")
      .replace(/(\d{5})(\d)/, "$1-$2")
  },

  cep: (value: string) => {
    const numbers = value.replace(/\D/g, "").slice(0, 8)
    return numbers.replace(/^(\d{5})(\d)/, "$1-$2")
  },

  currency: (value: string) => {
    const numbers = value.replace(/\D/g, "")
    const amount = Number(numbers) / 100
    return amount.toLocaleString("pt-BR", {
      minimumFractionDigits: 2,
      maximumFractionDigits: 2,
    })
  },
}

// ============================================================================
// VALIDAÇÕES PADRÃO
// ============================================================================

const defaultValidations = {
  cnpj: (value: string) => {
    const numbers = value.replace(/\D/g, "")
    if (numbers.length !== 14) {
      return "CNPJ deve ter 14 dígitos"
    }
    return undefined
  },

  cpf: (value: string) => {
    const numbers = value.replace(/\D/g, "")
    if (numbers.length !== 11) {
      return "CPF deve ter 11 dígitos"
    }
    return undefined
  },

  phone: (value: string) => {
    const numbers = value.replace(/\D/g, "")
    if (numbers.length < 10 || numbers.length > 11) {
      return "Telefone inválido"
    }
    return undefined
  },

  cep: (value: string) => {
    const numbers = value.replace(/\D/g, "")
    if (numbers.length !== 8) {
      return "CEP deve ter 8 dígitos"
    }
    return undefined
  },

  email: (value: string) => {
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/
    if (!emailRegex.test(value)) {
      return "E-mail inválido"
    }
    return undefined
  },
}

// ============================================================================
// COMPONENTE PRINCIPAL
// ============================================================================

/**
 * Dialog genérico para criar registros no backend
 *
 * Funciona como o DataComboBox - você passa as configurações e ele se adapta
 *
 * @example
 * // Filial (com CNPJ)
 * <DataDialog
 *   open={openDialog}
 *   onOpenChange={setOpenDialog}
 *   title="Cadastrar Nova Filial"
 *   fields={[
 *     { name: "name", label: "Nome", required: true },
 *     { name: "cnpj", label: "CNPJ", required: true, mask: "cnpj" },
 *     { name: "notes", label: "Observações", type: "textarea" }
 *   ]}
 *   onSubmit={(data) => registrationsService.createFilial(data)}
 *   onSuccess={(id) => {
 *     filialComboRef.current?.refresh()
 *     setSelectedFilialId(id)
 *   }}
 * />
 *
 * @example
 * // Categoria (simples, sem CNPJ)
 * <DataDialog
 *   open={openDialog}
 *   onOpenChange={setOpenDialog}
 *   title="Cadastrar Nova Categoria"
 *   fields={[
 *     { name: "name", label: "Nome", required: true },
 *     { name: "description", label: "Descrição", type: "textarea" }
 *   ]}
 *   onSubmit={(data) => registrationsService.createCategory(data)}
 *   onSuccess={(id) => categoriaComboRef.current?.refresh()}
 * />
 */
export function DataDialog<T = Record<string, any>>({
  open,
  onOpenChange,
  title,
  description = "Preencha os dados. Campos com * são obrigatórios.",
  fields,
  initialData = {},
  onSubmit,
  onSuccess,
  onError,
  submitLabel = "Cadastrar",
  cancelLabel = "Cancelar",
  loadingLabel = "Cadastrando...",
}: DataDialogProps<T>) {
  const [isLoading, setIsLoading] = useState(false)
  const [formData, setFormData] = useState<Record<string, any>>(initialData)
  const [errors, setErrors] = useState<Record<string, string>>({})

  // Reset form quando o dialog abre ou fecha
  useEffect(() => {
    if (open) {
      // Quando abre, usa initialData ou cria objeto vazio
      if (initialData && Object.keys(initialData).length > 0) {
        setFormData(initialData)
      } else {
        const emptyData: Record<string, any> = {}
        fields.forEach((field) => {
          emptyData[field.name] = ""
        })
        setFormData(emptyData)
      }
      setErrors({})
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [open])

  // ============================================================================
  // VALIDAÇÃO
  // ============================================================================

  const validateForm = (): boolean => {
    const newErrors: Record<string, string> = {}

    fields.forEach((field) => {
      const value = formData[field.name] || ""

      // Validação de campo obrigatório
      if (field.required && !value.trim()) {
        newErrors[field.name] = `${field.label} é obrigatório`
        return
      }

      // Se campo estiver vazio e não for obrigatório, não valida
      if (!value.trim()) return

      // Validação customizada
      if (field.validation) {
        const error = field.validation(value)
        if (error) {
          newErrors[field.name] = error
          return
        }
      }

      // Validação por máscara
      if (field.mask && defaultValidations[field.mask]) {
        const error = defaultValidations[field.mask](value)
        if (error) {
          newErrors[field.name] = error
          return
        }
      }

      // Validação por tipo
      if (field.type === "email" && defaultValidations.email) {
        const error = defaultValidations.email(value)
        if (error) {
          newErrors[field.name] = error
          return
        }
      }
    })

    setErrors(newErrors)
    return Object.keys(newErrors).length === 0
  }

  // ============================================================================
  // SUBMIT
  // ============================================================================

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()

    if (!validateForm()) {
      return
    }

    setIsLoading(true)
    try {
      // Remove formatação dos campos com máscara antes de enviar
      const dataToSubmit: any = { ...formData }
      fields.forEach((field) => {
        if (field.mask && dataToSubmit[field.name]) {
          dataToSubmit[field.name] = dataToSubmit[field.name].replace(/\D/g, "")
        }
      })

      const response = await onSubmit(dataToSubmit as T)

      toast.success(`${title.replace("Cadastrar Nova ", "").replace("Cadastrar Novo ", "")} cadastrado com sucesso!`)

      // Extrai o ID da resposta
      const id = response?.id || response?.data?.id
      if (id) {
        onSuccess?.(id)
      }

      onOpenChange(false)
    } catch (error: any) {
      console.error(`Erro ao cadastrar:`, error)

      // Trata erros de validação do backend
      if (error.response?.data) {
        const backendErrors = error.response.data
        const newErrors: Record<string, string> = {}

        Object.keys(backendErrors).forEach((key) => {
          const errorMessages = backendErrors[key]
          newErrors[key] = Array.isArray(errorMessages)
            ? errorMessages[0]
            : errorMessages
        })

        if (Object.keys(newErrors).length > 0) {
          setErrors(newErrors)
        } else {
          toast.error(`Erro ao cadastrar`)
        }
      } else {
        toast.error(`Erro ao cadastrar`)
      }

      onError?.(error)
    } finally {
      setIsLoading(false)
    }
  }

  // ============================================================================
  // HANDLERS
  // ============================================================================

  const handleChange = (fieldName: string, value: string, mask?: MaskType) => {
    let processedValue = value

    // Aplica máscara se definida
    if (mask && masks[mask]) {
      processedValue = masks[mask](value)
    }

    setFormData((prev) => ({ ...prev, [fieldName]: processedValue }))

    // Limpa erro do campo ao digitar
    if (errors[fieldName]) {
      setErrors((prev) => ({ ...prev, [fieldName]: undefined }))
    }
  }

  // ============================================================================
  // RENDER
  // ============================================================================

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-[600px]">
        <DialogHeader>
          <DialogTitle>{title}</DialogTitle>
          <DialogDescription>{description}</DialogDescription>
        </DialogHeader>

        <form onSubmit={handleSubmit}>
          <div className="grid gap-4 py-4">
            {fields.map((field) => (
              <div key={field.name} className="grid gap-2">
                <Label htmlFor={field.name}>
                  {field.label}
                  {field.required && <span className="text-destructive"> *</span>}
                </Label>

                {field.type === "textarea" ? (
                  <textarea
                    id={field.name}
                    value={formData[field.name] || ""}
                    onChange={(e) => handleChange(field.name, e.target.value)}
                    placeholder={field.placeholder}
                    rows={field.rows || 3}
                    className="flex min-h-[80px] w-full rounded-md border border-input bg-background px-3 py-2 text-sm ring-offset-background placeholder:text-muted-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 disabled:cursor-not-allowed disabled:opacity-50"
                  />
                ) : (
                  <Input
                    id={field.name}
                    type={field.type || "text"}
                    value={formData[field.name] || ""}
                    onChange={(e) => handleChange(field.name, e.target.value, field.mask)}
                    placeholder={field.placeholder}
                    maxLength={field.maxLength}
                    className={errors[field.name] ? "border-destructive" : ""}
                  />
                )}

                {errors[field.name] && (
                  <span className="text-xs text-destructive">{errors[field.name]}</span>
                )}
              </div>
            ))}
          </div>

          <DialogFooter>
            <Button
              type="button"
              variant="outline"
              onClick={() => onOpenChange(false)}
              disabled={isLoading}
            >
              {cancelLabel}
            </Button>
            <Button type="submit" disabled={isLoading}>
              {isLoading ? loadingLabel : submitLabel}
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  )
}
