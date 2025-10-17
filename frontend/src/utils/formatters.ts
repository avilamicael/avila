/**
 * UTILITÁRIOS DE FORMATAÇÃO
 * Funções reutilizáveis para formatação de dados
 */

/**
 * Parse de data do backend evitando problemas de timezone
 * O backend envia datas no formato 'YYYY-MM-DD' e precisamos interpretá-las
 * no timezone local, não em UTC
 * @example parseBackendDate("2024-10-24") => Date em timezone local
 */
export const parseBackendDate = (dateString: string | Date): Date => {
  if (dateString instanceof Date) return dateString;

  // Se a data está no formato ISO (YYYY-MM-DD), cria a data em timezone local
  // para evitar problemas de fuso horário
  const [year, month, day] = dateString.split('-').map(Number);
  return new Date(year, month - 1, day);
}

/**
 * Formata valor para moeda brasileira
 * @example formatCurrency(1234.56) => "R$ 1.234,56"
 * @example formatCurrency("1234.56") => "R$ 1.234,56"
 */
export const formatCurrency = (value: string | number): string => {
  const numValue = typeof value === 'string' ? parseFloat(value) : value
  if (isNaN(numValue)) return 'R$ 0,00'

  return new Intl.NumberFormat('pt-BR', {
    style: 'currency',
    currency: 'BRL'
  }).format(numValue)
}

/**
 * Formata data para padrão brasileiro (DD/MM/YYYY)
 * @example formatDate("2024-12-25") => "25/12/2024"
 */
export const formatDate = (dateString: string): string => {
  if (!dateString) return '-'
  const date = new Date(dateString)
  return date.toLocaleDateString('pt-BR', {
    day: '2-digit',
    month: '2-digit',
    year: 'numeric',
    timeZone: 'UTC'
  })
}

/**
 * Calcula dias até o vencimento (negativo se vencido)
 * @example getDaysUntilDue("2024-12-25") => 5 (faltam 5 dias)
 * @example getDaysUntilDue("2024-12-15") => -5 (venceu há 5 dias)
 */
export const getDaysUntilDue = (dueDate: string): number => {
  const today = new Date()
  today.setHours(0, 0, 0, 0)

  const due = new Date(dueDate)
  due.setHours(0, 0, 0, 0)

  return Math.ceil((due.getTime() - today.getTime()) / (1000 * 60 * 60 * 24))
}

/**
 * Retorna label descritiva sobre dias até vencimento
 * @example getDaysLabel(-5) => "Venceu há 5 dias"
 * @example getDaysLabel(0) => "Vence hoje"
 * @example getDaysLabel(3) => "Vence em 3 dias"
 * @example getDaysLabel(10) => "" (não retorna nada se > 7 dias)
 */
export const getDaysLabel = (days: number): string => {
  if (days < 0) {
    const absDays = Math.abs(days)
    return `Venceu há ${absDays} dia${absDays !== 1 ? 's' : ''}`
  }
  if (days === 0) return 'Vence hoje'
  if (days <= 7) return `Vence em ${days} dia${days !== 1 ? 's' : ''}`
  return ''
}

/**
 * Aplica máscara de moeda (formato brasileiro)
 * @example maskCurrency("123456") => "1.234,56"
 */
export const maskCurrency = (value: string): string => {
  const numbers = value.replace(/\D/g, "")
  const amount = Number(numbers) / 100
  return amount.toLocaleString("pt-BR", {
    minimumFractionDigits: 2,
    maximumFractionDigits: 2,
  })
}

/**
 * Remove máscara de moeda e retorna valor em centavos
 * @example parseCurrency("1.234,56") => 123456
 * @example parseCurrency("R$ 1.234,56") => 123456
 */
export const parseCurrency = (value: string): number => {
  return parseInt(value.replace(/\D/g, "")) || 0
}

/**
 * Aplica máscara de data (DD/MM/YYYY ou DD/MM/AA)
 * @example maskDate("25122024") => "25/12/2024"
 */
export const maskDate = (value: string): string => {
  const numbers = value.replace(/\D/g, "").slice(0, 8)
  if (numbers.length <= 2) return numbers
  if (numbers.length <= 4) return `${numbers.slice(0, 2)}/${numbers.slice(2)}`
  return `${numbers.slice(0, 2)}/${numbers.slice(2, 4)}/${numbers.slice(4)}`
}

/**
 * Converte data de DD/MM/YYYY para YYYY-MM-DD (formato do backend)
 * @example parseDate("25/12/2024") => "2024-12-25"
 * @example parseDate("25/12/24") => "2024-12-25"
 */
export const parseDate = (value: string): string => {
  const parts = value.split("/")
  if (parts.length === 3) {
    let year = parts[2]
    // Converte ano de 2 dígitos para 4
    if (year.length === 2) {
      const yearNum = parseInt(year, 10)
      year = yearNum < 50 ? `20${year}` : `19${year}`
    }
    return `${year}-${parts[1].padStart(2, '0')}-${parts[0].padStart(2, '0')}`
  }
  return ""
}

/**
 * Valida se uma data está no formato correto e é válida
 * @example validateDate("25/12/2024") => true
 * @example validateDate("32/12/2024") => false
 * @example validateDate("25/12/24") => true
 */
export const validateDate = (value: string): boolean => {
  const parts = value.split("/")
  if (parts.length !== 3) return false

  const day = parseInt(parts[0], 10)
  const month = parseInt(parts[1], 10)
  let year = parts[2]

  // Converte ano de 2 dígitos
  if (year.length === 2) {
    const yearNum = parseInt(year, 10)
    year = yearNum < 50 ? `20${year}` : `19${year}`
  }

  const yearNum = parseInt(year, 10)

  // Validações básicas
  if (day < 1 || day > 31) return false
  if (month < 1 || month > 12) return false
  if (year.length === 4 && (yearNum < 1900 || yearNum > 2100)) return false

  // Valida se a data é real (ex: 31/02 é inválido)
  const date = new Date(yearNum, month - 1, day)
  return date.getFullYear() === yearNum &&
    date.getMonth() === month - 1 &&
    date.getDate() === day
}
