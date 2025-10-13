import { useState, useEffect, useImperativeHandle, forwardRef } from "react"
import { ComboBox, type ComboBoxItem } from "@/components/ui/combobox"
import { toast } from "sonner"

export interface DataComboBoxItem extends ComboBoxItem {
  value: number
  label: string
  [key: string]: any // Permite propriedades adicionais
}

interface DataComboBoxProps {
  // Dados
  value?: number
  onValueChange: (value: number | undefined, item?: DataComboBoxItem) => void

  // Função para carregar dados do backend
  fetchData: (params?: { search?: string; page?: number }) => Promise<{
    results: any[]
  }>

  // Função para mapear os dados do backend para ComboBoxItem
  mapItem: (item: any) => DataComboBoxItem

  // Textos customizáveis
  placeholder?: string
  searchPlaceholder?: string
  emptyMessage?: string
  loadingMessage?: string
  createLabel?: string

  // Estilos e comportamento
  disabled?: boolean
  className?: string
  allowCreate?: boolean
  onCreateNew?: () => void

  // Customização de renderização do item
  renderItem?: (item: DataComboBoxItem) => React.ReactNode
}

// Métodos que podem ser chamados externamente
export interface DataComboBoxRef {
  refresh: () => Promise<void>
}

/**
 * ComboBox genérico conectado ao backend
 *
 * Este componente é reutilizável para QUALQUER tipo de dado (filiais, fornecedores, categorias, etc)
 *
 * @example
 * // Para Filiais
 * const filialComboRef = useRef<DataComboBoxRef>(null)
 *
 * <DataComboBox
 *   ref={filialComboRef}
 *   value={selectedFilialId}
 *   onValueChange={(value) => setSelectedFilialId(value)}
 *   fetchData={(params) => registrationsService.listFilials(params)}
 *   mapItem={(filial) => ({
 *     value: filial.id,
 *     label: filial.name,
 *     cnpj: filial.cnpj,
 *   })}
 *   placeholder="Selecione uma filial"
 *   searchPlaceholder="Buscar filial..."
 *   emptyMessage="Nenhuma filial encontrada"
 *   createLabel="Cadastrar nova filial"
 *   allowCreate
 *   onCreateNew={() => setOpenFilialDialog(true)}
 *   renderItem={(item) => (
 *     <div className="flex flex-col">
 *       <span className="font-medium">{item.label}</span>
 *       <span className="text-xs text-muted-foreground">{item.cnpj}</span>
 *     </div>
 *   )}
 * />
 *
 * @example
 * // Para Fornecedores (simples)
 * <DataComboBox
 *   value={selectedFornecedorId}
 *   onValueChange={(value) => setSelectedFornecedorId(value)}
 *   fetchData={(params) => registrationsService.listSuppliers(params)}
 *   mapItem={(fornecedor) => ({
 *     value: fornecedor.id,
 *     label: fornecedor.fantasy_name || fornecedor.name,
 *   })}
 *   placeholder="Selecione um fornecedor"
 *   searchPlaceholder="Buscar fornecedor..."
 * />
 *
 * @example
 * // Para Categorias
 * <DataComboBox
 *   value={selectedCategoriaId}
 *   onValueChange={(value) => setSelectedCategoriaId(value)}
 *   fetchData={(params) => registrationsService.listCategories(params)}
 *   mapItem={(categoria) => ({
 *     value: categoria.id,
 *     label: categoria.name,
 *   })}
 *   placeholder="Selecione uma categoria"
 * />
 */
export const DataComboBox = forwardRef<DataComboBoxRef, DataComboBoxProps>(
  function DataComboBox({
    value,
    onValueChange,
    fetchData,
    mapItem,
    placeholder = "Selecione...",
    searchPlaceholder = "Buscar...",
    emptyMessage = "Nenhum item encontrado.",
    loadingMessage = "Carregando...",
    createLabel = "Cadastrar novo",
    disabled = false,
    className,
    allowCreate = false,
    onCreateNew,
    renderItem,
  }, ref) {
  const [items, setItems] = useState<DataComboBoxItem[]>([])
  const [isLoading, setIsLoading] = useState(false)
  const [searchTerm, setSearchTerm] = useState("")

  // Carrega dados iniciais
  useEffect(() => {
    loadData()
  }, [])

  // Debounce da busca
  useEffect(() => {
    if (!searchTerm) return

    const timer = setTimeout(() => {
      loadData(searchTerm)
    }, 500)

    return () => clearTimeout(timer)
  }, [searchTerm])

  const loadData = async (search?: string) => {
    setIsLoading(true)
    try {
      const response = await fetchData({ search, page: 1 })

      // Verifica se a resposta tem results
      if (!response || !response.results) {
        console.error("❌ [DataComboBox] Resposta inválida do backend:", response)
        toast.error("Erro ao carregar dados: resposta inválida")
        setItems([])
        return
      }

      const formattedItems = response.results.map(mapItem)
      setItems(formattedItems)
    } catch (error: any) {
      console.error("❌ [DataComboBox] Erro ao carregar dados:", error)

      // Exibe mensagem de erro mais específica
      const errorMessage = error?.response?.data?.error ||
                          error?.message ||
                          "Erro ao carregar dados"
      toast.error(errorMessage)
      setItems([])
    } finally {
      setIsLoading(false)
    }
  }

  const handleSearch = (search: string) => {
    setSearchTerm(search)
  }

  const handleValueChange = (newValue: string | number, item?: DataComboBoxItem) => {
    if (newValue === undefined) {
      onValueChange(undefined, undefined)
    } else {
      onValueChange(newValue as number, item)
    }
  }

  // Expõe o método refresh para ser chamado externamente
  useImperativeHandle(ref, () => ({
    refresh: async () => {
      await loadData()
    }
  }))

  return (
    <ComboBox<DataComboBoxItem>
      items={items}
      value={value}
      onValueChange={handleValueChange}
      placeholder={placeholder}
      searchPlaceholder={searchPlaceholder}
      emptyMessage={emptyMessage}
      loadingMessage={loadingMessage}
      disabled={disabled}
      className={className}
      isLoading={isLoading}
      allowCreate={allowCreate}
      createLabel={createLabel}
      onCreateNew={onCreateNew}
      onSearch={handleSearch}
      renderItem={renderItem}
    />
  )
})
