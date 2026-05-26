import { notFound } from 'next/navigation'
import { createClient } from '@/lib/supabase/server'
import {
  TorcidaHeader,
  TorcidaActions,
  TorcidaLinks,
  TorcidaInadimplente,
  TorcidaFooter,
} from '@/components/torcida-publica'
import { getHexFromPreset } from '@/lib/utils/color-presets'

/**
 * Página Pública da Torcida
 * Rota: /torcida/[slug]
 *
 * Exibe informações públicas da torcida para novos membros
 * Se a torcida estiver inadimplente, mostra mensagem de bloqueio
 */

interface PageProps {
  params: Promise<{ slug: string }>
}

// Buscar dados da torcida diretamente no servidor
async function getTorcidaData(slug: string) {
  const supabase = await createClient()

  // Buscar torcida
  const { data: torcida, error: torcidaError } = await supabase
    .from('torcidas')
    .select(`
      id,
      nome,
      slug,
      brasao_url,
      cor_fundo,
      frase_efeito,
      status
    `)
    .eq('slug', slug)
    .single()

  if (torcidaError || !torcida) {
    return null
  }

  // Buscar benefícios ativos
  const { data: beneficios } = await supabase
    .from('beneficios')
    .select('id, titulo, descricao, icone, ordem')
    .eq('torcida_id', torcida.id)
    .eq('ativo', true)
    .order('ordem', { ascending: true })

  // Buscar links ativos
  const { data: links } = await supabase
    .from('links')
    .select('id, titulo, url, icone, ordem')
    .eq('torcida_id', torcida.id)
    .eq('ativo', true)
    .order('ordem', { ascending: true })

  return {
    torcida: {
      ...torcida,
      isAtiva: torcida.status === 'ativo',
    },
    beneficios: beneficios || [],
    links: links || [],
  }
}

// Metadata dinâmica para SEO
export async function generateMetadata({ params }: PageProps) {
  const { slug } = await params
  const data = await getTorcidaData(slug)

  if (!data) {
    return {
      title: 'Torcida não encontrada | TorcidaClub',
    }
  }

  return {
    title: `${data.torcida.nome} | TorcidaClub`,
    description: data.torcida.frase_efeito || `Faça parte da ${data.torcida.nome}`,
    openGraph: {
      title: data.torcida.nome,
      description: data.torcida.frase_efeito || `Faça parte da ${data.torcida.nome}`,
      images: data.torcida.brasao_url ? [data.torcida.brasao_url] : [],
    },
  }
}

export default async function TorcidaPublicaPage({ params }: PageProps) {
  const { slug } = await params
  const data = await getTorcidaData(slug)

  if (!data) {
    notFound()
  }

  const { torcida, links } = data
  const isAtiva = torcida.isAtiva

  return (
    <div
      className="min-h-screen flex flex-col"
      style={{ backgroundColor: getHexFromPreset(torcida.cor_fundo) }}
    >
      {/* Conteúdo Principal */}
      <main className="flex-1 flex flex-col items-center justify-center px-4 sm:px-6 lg:px-8 py-20 md:py-32 space-y-10">
        {/* Cabeçalho: Logo, Nome, Frase */}
        <TorcidaHeader
          nome={torcida.nome}
          brasaoUrl={torcida.brasao_url}
          fraseEfeito={torcida.frase_efeito}
          corFundo={torcida.cor_fundo}
          isAtiva={isAtiva}
        />

        {/* Conteúdo Condicional baseado no status */}
        {isAtiva ? (
          <>
            {/* Botões de Ação */}
            <TorcidaActions torcidaId={torcida.id} />

            {/* Links de Redes Sociais */}
            <TorcidaLinks links={links} />
          </>
        ) : (
          /* Card de Inadimplência/Cancelamento */
          <TorcidaInadimplente slug={torcida.slug} status={torcida.status} />
        )}
      </main>

      {/* Rodapé Institucional */}
      <TorcidaFooter />
    </div>
  )
}
