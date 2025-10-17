import { useState, useEffect } from "react"
import { Avatar, AvatarFallback, AvatarImage } from "./avatar"

interface ProtectedAvatarProps {
  src: string
  alt: string
  fallback: string
  className?: string
}

/**
 * Componente Avatar que carrega imagens protegidas por autenticação JWT
 */
export function ProtectedAvatar({ src, alt, fallback, className }: ProtectedAvatarProps) {
  const [imageSrc, setImageSrc] = useState<string | null>(null)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState(false)

  useEffect(() => {
    if (!src) {
      setLoading(false)
      return
    }

    const fetchImage = async () => {
      try {
        setLoading(true)
        setError(false)

        // Pega o token do localStorage
        const token = localStorage.getItem('access_token')

        if (!token) {
          setError(true)
          setLoading(false)
          return
        }

        // Monta a URL completa
        const fullUrl = src.startsWith('http') ? src : `${import.meta.env.VITE_API_URL || 'http://localhost:8000'}${src}`

        // Faz o fetch com o token JWT
        const response = await fetch(fullUrl, {
          headers: {
            'Authorization': `Bearer ${token}`
          }
        })

        if (!response.ok) {
          throw new Error('Failed to fetch image')
        }

        // Converte a resposta em blob e cria uma URL local
        const blob = await response.blob()
        const objectUrl = URL.createObjectURL(blob)
        setImageSrc(objectUrl)
        setLoading(false)
      } catch (err) {
        console.error('Error loading protected avatar:', err)
        setError(true)
        setLoading(false)
      }
    }

    fetchImage()

    // Cleanup: revoga a URL do objeto quando o componente for desmontado
    return () => {
      if (imageSrc && imageSrc.startsWith('blob:')) {
        URL.revokeObjectURL(imageSrc)
      }
    }
  }, [src])

  return (
    <Avatar className={className}>
      {!loading && imageSrc && !error && (
        <AvatarImage src={imageSrc} alt={alt} className="object-cover" />
      )}
      <AvatarFallback className="rounded-full">{fallback}</AvatarFallback>
    </Avatar>
  )
}
