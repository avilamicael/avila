import * as React from "react"
import { Check, ChevronsUpDown, Plus, Loader2 } from "lucide-react"

import { cn } from "@/lib/utils"
import { Button } from "@/components/ui/button"
import {
  Command,
  CommandEmpty,
  CommandGroup,
  CommandInput,
  CommandItem,
  CommandList,
  CommandSeparator,
} from "@/components/ui/command"
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from "@/components/ui/popover"

/**
 * Interface para os itens do ComboBox
 * Voce pode estender isso em seus tipos especificos
 */
export interface ComboBoxItem {
  value: string | number
  label: string
  [key: string]: any // Permite propriedades adicionais especificas
}

/**
 * Props do ComboBox
 * @template T - Tipo do item (deve estender ComboBoxItem)
 */
export interface ComboBoxProps<T extends ComboBoxItem = ComboBoxItem> {
  // Dados
  items: T[]
  value?: string | number
  onValueChange?: (value: string | number, item?: T) => void

  // Textos e labels
  placeholder?: string
  searchPlaceholder?: string
  emptyMessage?: string
  loadingMessage?: string

  // Estilos
  className?: string
  disabled?: boolean

  // Funcionalidade de criar novo item
  allowCreate?: boolean
  createLabel?: string | ((searchValue: string) => string)
  onCreateNew?: (searchValue: string) => void | Promise<void>

  // Busca assíncrona (opcional)
  onSearch?: (searchValue: string) => void | Promise<void>
  isLoading?: boolean

  // Customização de renderização
  renderItem?: (item: T) => React.ReactNode
  getItemLabel?: (item: T) => string

  // Controle externo do popover (opcional)
  open?: boolean
  onOpenChange?: (open: boolean) => void
}

/**
 * ComboBox reutilizável e modular
 *
 * Exemplo de uso:
 *
 * ```tsx
 * // Para filiais
 * <ComboBox
 *   items={filiais}
 *   value={selectedFilial}
 *   onValueChange={setSelectedFilial}
 *   placeholder="Selecione uma filial"
 *   allowCreate
 *   createLabel="Cadastrar nova filial"
 *   onCreateNew={(searchValue) => openFilialModal(searchValue)}
 *   onSearch={async (search) => await fetchFiliais(search)}
 * />
 *
 * // Para fornecedores
 * <ComboBox
 *   items={fornecedores}
 *   value={selectedFornecedor}
 *   onValueChange={setSelectedFornecedor}
 *   placeholder="Selecione um fornecedor"
 *   allowCreate
 *   createLabel={(search) => `Cadastrar "${search}" como fornecedor`}
 *   onCreateNew={handleCreateFornecedor}
 * />
 * ```
 */
export function ComboBox<T extends ComboBoxItem = ComboBoxItem>({
  items = [],
  value,
  onValueChange,
  placeholder = "Selecione...",
  searchPlaceholder = "Pesquisar...",
  emptyMessage = "Nenhum item encontrado.",
  loadingMessage = "Carregando...",
  className,
  disabled = false,
  allowCreate = false,
  createLabel = "Cadastrar novo item",
  onCreateNew,
  onSearch,
  isLoading = false,
  renderItem,
  getItemLabel,
  open: controlledOpen,
  onOpenChange: controlledOnOpenChange,
}: ComboBoxProps<T>) {
  const [internalOpen, setInternalOpen] = React.useState(false)
  const [searchValue, setSearchValue] = React.useState("")

  // Usa controle externo se fornecido, senão usa estado interno
  const open = controlledOpen !== undefined ? controlledOpen : internalOpen
  const setOpen = controlledOnOpenChange || setInternalOpen

  const selectedItem = items.find((item) => item.value === value)

  const handleSelect = (currentValue: string | number) => {
    const item = items.find((i) => i.value === currentValue)
    const newValue = currentValue === value ? undefined : currentValue
    onValueChange?.(newValue as string | number, item)
    setOpen(false)
  }

  const handleSearch = React.useCallback(
    (search: string) => {
      setSearchValue(search)
      onSearch?.(search)
    },
    [onSearch]
  )

  const handleCreateNew = async () => {
    if (onCreateNew) {
      await onCreateNew(searchValue)
      setSearchValue("")
      setOpen(false)
    }
  }

  const displayLabel = (item: T) => {
    if (getItemLabel) return getItemLabel(item)
    return item.label
  }

  const getCreateLabel = () => {
    if (typeof createLabel === "function") {
      return createLabel(searchValue)
    }
    return searchValue ? `${createLabel} "${searchValue}"` : createLabel
  }

  return (
    <Popover open={open} onOpenChange={setOpen}>
      <PopoverTrigger asChild>
        <Button
          variant="outline"
          role="combobox"
          aria-expanded={open}
          className={cn("w-full justify-between", className)}
          disabled={disabled}
        >
          {selectedItem ? displayLabel(selectedItem) : placeholder}
          <ChevronsUpDown className="ml-2 h-4 w-4 shrink-0 opacity-50" />
        </Button>
      </PopoverTrigger>
      <PopoverContent className="w-[var(--radix-popover-trigger-width)] p-0" align="start">
        <Command shouldFilter={!onSearch}>
          <CommandInput
            placeholder={searchPlaceholder}
            value={searchValue}
            onValueChange={handleSearch}
          />
          <CommandList>
            {isLoading ? (
              <CommandEmpty>
                <div className="flex items-center justify-center py-6">
                  <Loader2 className="h-4 w-4 animate-spin mr-2" />
                  <span>{loadingMessage}</span>
                </div>
              </CommandEmpty>
            ) : (
              <>
                {items.length === 0 ? (
                  <CommandEmpty>{emptyMessage}</CommandEmpty>
                ) : (
                  <CommandGroup>
                    {items.map((item) => (
                      <CommandItem
                        key={item.value}
                        value={String(item.value)}
                        onSelect={() => handleSelect(item.value)}
                      >
                        <Check
                          className={cn(
                            "mr-2 h-4 w-4",
                            value === item.value ? "opacity-100" : "opacity-0"
                          )}
                        />
                        {renderItem ? renderItem(item) : displayLabel(item)}
                      </CommandItem>
                    ))}
                  </CommandGroup>
                )}

                {/* Opção de criar novo item */}
                {allowCreate && onCreateNew && (
                  <>
                    <CommandSeparator />
                    <CommandGroup>
                      <CommandItem
                        onSelect={handleCreateNew}
                        className="text-primary cursor-pointer"
                      >
                        <Plus className="mr-2 h-4 w-4" />
                        {getCreateLabel()}
                      </CommandItem>
                    </CommandGroup>
                  </>
                )}
              </>
            )}
          </CommandList>
        </Command>
      </PopoverContent>
    </Popover>
  )
}

export default ComboBox
