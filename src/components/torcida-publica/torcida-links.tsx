'use client'

/**
 * TorcidaLinks - Links de redes sociais da torcida
 */

import {
  Instagram,
  Facebook,
  Twitter,
  Youtube,
  Globe,
  MessageCircle,
  Link as LinkIcon
} from 'lucide-react'

interface Link {
  id: string
  titulo: string
  url: string
  icone: string | null
}

interface TorcidaLinksProps {
  links: Link[]
}

// Mapeamento de ícones por nome ou título
const getIconByName = (icone: string | null, titulo: string) => {
  const iconName = (icone || titulo).toLowerCase()

  if (iconName.includes('instagram')) return Instagram
  if (iconName.includes('facebook')) return Facebook
  if (iconName.includes('twitter') || iconName.includes('x')) return Twitter
  if (iconName.includes('youtube')) return Youtube
  if (iconName.includes('whatsapp')) return MessageCircle
  if (iconName.includes('site') || iconName.includes('web')) return Globe

  return LinkIcon
}

export function TorcidaLinks({ links }: TorcidaLinksProps) {
  if (!links || links.length === 0) {
    return null
  }

  return (
    <div className="flex flex-wrap justify-center gap-4">
      {links.map((link) => {
        const Icon = getIconByName(link.icone, link.titulo)

        return (
          <a
            key={link.id}
            href={link.url}
            target="_blank"
            rel="noopener noreferrer"
            className="flex items-center justify-center w-12 h-12 rounded-full bg-gray-800 hover:bg-gray-700 transition-colors"
            title={link.titulo}
          >
            <Icon className="w-6 h-6 text-white" />
          </a>
        )
      })}
    </div>
  )
}
