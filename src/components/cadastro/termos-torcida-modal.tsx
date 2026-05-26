'use client'

import { useState, useEffect } from 'react'
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from '@/components/ui/dialog'
import { ScrollArea } from '@/components/ui/scroll-area'
import { Skeleton } from '@/components/ui/skeleton'
import { createClient } from '@/lib/supabase/client'

type TipoTermo = 'politica_privacidade' | 'termos_uso' | 'termos_compra_ingresso'

interface TermosTorcidaModalProps {
  children: React.ReactNode
  torcidaId: string | null
  tipoTermo: TipoTermo
  titulo?: string
}

// Conteúdo padrão (fallback)
const TERMOS_PADRAO: Record<TipoTermo, string> = {
  politica_privacidade: `
# Política de Privacidade

Esta Política de Privacidade descreve como coletamos, usamos e protegemos suas informações pessoais.

## 1. Coleta de Dados
Coletamos os seguintes dados pessoais:
- Nome completo e apelido
- CPF e RG
- Data de nascimento
- Endereço e contato
- Foto e documentos de identificação

## 2. Uso dos Dados
Seus dados são utilizados para:
- Identificação como sócio-torcedor
- Controle de acesso em eventos
- Comunicação sobre atividades da torcida
- Gestão de pagamentos e mensalidades

## 3. Compartilhamento
Seus dados podem ser compartilhados com:
- Órgãos de segurança pública quando solicitado
- Federações e clubes para fins de identificação em eventos

## 4. Segurança
Implementamos medidas de segurança para proteger seus dados contra acesso não autorizado.

## 5. Seus Direitos
Você pode solicitar acesso, correção ou exclusão de seus dados a qualquer momento.

## 6. Contato
Para questões sobre privacidade, entre em contato com a diretoria da torcida.
  `,
  termos_uso: `
# Termos de Uso

Ao se cadastrar como sócio-torcedor, você concorda com os seguintes termos:

## 1. Cadastro
- Fornecer informações verdadeiras e atualizadas
- Manter seus dados cadastrais atualizados
- Não compartilhar suas credenciais de acesso

## 2. Conduta
- Respeitar o estatuto da torcida
- Manter conduta adequada em eventos
- Não praticar atos de violência ou discriminação

## 3. Pagamentos
- Manter a mensalidade em dia
- O atraso pode resultar em suspensão do acesso

## 4. Identificação
- Apresentar documentos quando solicitado
- Utilizar apenas sua própria identificação

## 5. Penalidades
O descumprimento dos termos pode resultar em:
- Advertência
- Suspensão temporária
- Exclusão do quadro de sócios

## 6. Alterações
Estes termos podem ser alterados a qualquer momento, com aviso prévio aos sócios.
  `,
  termos_compra_ingresso: `
# Termos de Compra de Ingresso

Ao adquirir ingressos através da plataforma, você concorda com:

## 1. Aquisição
- Ingressos são pessoais e intransferíveis
- A compra está sujeita a disponibilidade
- Pagamento deve ser realizado no prazo estipulado

## 2. Retirada
- Apresentar documento com foto no dia do evento
- Chegar com antecedência ao local de retirada
- Não é permitida retirada por terceiros

## 3. Cancelamento
- Cancelamentos devem ser solicitados com antecedência
- Reembolso sujeito às políticas do evento
- Eventos cancelados terão valor devolvido

## 4. Responsabilidades
- A torcida não se responsabiliza por objetos perdidos
- O portador do ingresso deve seguir as normas do estádio
- Condutas inadequadas podem resultar em retirada do local

## 5. Impedimentos
Não poderão adquirir ingressos:
- Sócios com mensalidades em atraso
- Sócios com restrições vigentes
- Não associados (exceto convidados autorizados)
  `,
}

const TITULOS_PADRAO: Record<TipoTermo, string> = {
  politica_privacidade: 'Política de Privacidade',
  termos_uso: 'Termos de Uso',
  termos_compra_ingresso: 'Termos de Compra de Ingresso',
}

export function TermosTorcidaModal({
  children,
  torcidaId,
  tipoTermo,
  titulo,
}: TermosTorcidaModalProps) {
  const [open, setOpen] = useState(false)
  const [loading, setLoading] = useState(false)
  const [conteudo, setConteudo] = useState<string | null>(null)
  const supabase = createClient()

  useEffect(() => {
    async function carregarTermos() {
      if (!open || !torcidaId) return

      setLoading(true)

      try {
        const { data: torcida } = await supabase
          .from('torcidas')
          .select(tipoTermo)
          .eq('id', torcidaId)
          .single()

        if (torcida && (torcida as Record<string, string | null>)[tipoTermo]) {
          setConteudo((torcida as Record<string, string | null>)[tipoTermo])
        } else {
          // Usar termo padrão se a torcida não tiver configurado
          setConteudo(TERMOS_PADRAO[tipoTermo])
        }
      } catch (error) {
        console.error('Erro ao carregar termos:', error)
        setConteudo(TERMOS_PADRAO[tipoTermo])
      } finally {
        setLoading(false)
      }
    }

    carregarTermos()
  }, [open, torcidaId, tipoTermo, supabase])

  // Função para renderizar markdown básico
  function renderMarkdown(text: string) {
    return text
      .split('\n\n')
      .map((paragraph, index) => {
        // Títulos
        if (paragraph.startsWith('# ')) {
          return (
            <h2 key={index} className="text-xl font-bold mb-4 mt-6 first:mt-0">
              {paragraph.replace('# ', '')}
            </h2>
          )
        }
        if (paragraph.startsWith('## ')) {
          return (
            <h3 key={index} className="text-lg font-semibold mb-3 mt-4">
              {paragraph.replace('## ', '')}
            </h3>
          )
        }

        // Lista
        if (paragraph.startsWith('- ')) {
          const items = paragraph.split('\n')
          return (
            <ul key={index} className="list-disc list-inside mb-4 space-y-1">
              {items.map((item, i) => (
                <li key={i} className="text-sm text-muted-foreground">
                  {item.replace('- ', '')}
                </li>
              ))}
            </ul>
          )
        }

        // Parágrafo normal
        return (
          <p key={index} className="mb-4 text-sm text-muted-foreground">
            {paragraph}
          </p>
        )
      })
  }

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger asChild>{children}</DialogTrigger>
      <DialogContent className="max-w-2xl max-h-[80vh]">
        <DialogHeader>
          <DialogTitle>{titulo || TITULOS_PADRAO[tipoTermo]}</DialogTitle>
        </DialogHeader>
        <ScrollArea className="h-[60vh] pr-4">
          {loading ? (
            <div className="space-y-4">
              <Skeleton className="h-6 w-3/4" />
              <Skeleton className="h-4 w-full" />
              <Skeleton className="h-4 w-full" />
              <Skeleton className="h-4 w-2/3" />
              <Skeleton className="h-6 w-1/2 mt-6" />
              <Skeleton className="h-4 w-full" />
              <Skeleton className="h-4 w-full" />
            </div>
          ) : (
            <div className="prose prose-sm dark:prose-invert max-w-none">
              {conteudo && renderMarkdown(conteudo)}
            </div>
          )}
        </ScrollArea>
      </DialogContent>
    </Dialog>
  )
}
