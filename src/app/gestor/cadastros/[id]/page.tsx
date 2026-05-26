import { createClient } from '@/lib/supabase/server'
import { supabaseAdmin } from '@/lib/supabase/admin'
import { redirect, notFound } from 'next/navigation'
import Link from 'next/link'
import { Card } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import {
  ArrowLeft,
  User,
  MapPin,
  Phone,
  Heart,
  FileText,
  Download,
  AlertCircle,
} from 'lucide-react'
import { formatarCPF, formatarTelefone, formatarData } from '@/lib/utils/format'
import { calcularIdade } from '@/lib/utils/calculate'
import { AprovarCadastroButton } from '@/components/gestor/aprovar-cadastro-button'
import { RejeitarCadastroButton } from '@/components/gestor/rejeitar-cadastro-button'

interface PageProps {
  params: Promise<{
    id: string
  }>
}

export default async function DetalhesCadastroPage({ params }: PageProps) {
  const { id } = await params

  // Autenticação
  const supabase = await createClient()
  const {
    data: { user },
  } = await supabase.auth.getUser()

  if (!user) {
    redirect('/login')
  }

  // Buscar dados do gestor
  const { data: gestor } = await supabase
    .from('gestores')
    .select('id, torcida_id')
    .eq('auth_user_id', user.id)
    .maybeSingle()

  if (!gestor || !gestor.torcida_id) {
    redirect('/login')
  }

  // Buscar cadastro — supabaseAdmin contorna RLS com deleted_at removido
  const { data: socio, error } = await supabaseAdmin
    .from('socios')
    .select('*')
    .eq('id', id)
    .eq('torcida_id', gestor.torcida_id!)
    .maybeSingle()

  if (error || !socio) {
    notFound()
  }

  const idade = calcularIdade(new Date(socio.data_nascimento))

  return (
    <div className="space-y-6 max-w-5xl">
      {/* Header */}
      <div>
        <Link
          href="/gestor/cadastros"
          className="inline-flex items-center gap-2 text-sm text-muted-foreground hover:text-foreground mb-4"
        >
          <ArrowLeft className="w-4 h-4" />
          Voltar para lista
        </Link>

        <div className="flex items-start justify-between">
          <div>
            <h1 className="text-3xl font-bold tracking-tight">
              Análise de Cadastro
            </h1>
            <p className="text-muted-foreground">
              Revise os dados e documentos do candidato
            </p>
          </div>

          {socio.status === 'pendente' && (
            <div className="flex gap-2">
              <AprovarCadastroButton socioId={socio.id} />
              <RejeitarCadastroButton socioId={socio.id} />
            </div>
          )}
        </div>
      </div>

      {/* Status */}
      <Card className="p-6">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-4">
            {socio.selfie_url && (
              /* eslint-disable-next-line @next/next/no-img-element */
              <img
                src={socio.selfie_url}
                alt={socio.nome_completo}
                className="w-20 h-20 rounded-full object-cover border-4 border-white shadow-lg"
              />
            )}
            <div>
              <h2 className="text-2xl font-bold">{socio.nome_completo}</h2>
              <div className="flex items-center gap-2 mt-1">
                <Badge
                  variant={socio.status === 'pendente' ? 'outline' : 'default'}
                  className={
                    socio.status === 'pendente'
                      ? 'text-amber-600 border-amber-600'
                      : ''
                  }
                >
                  {socio.status === 'pendente' ? 'Pendente' : socio.status}
                </Badge>
                {socio.e_menor && (
                  <Badge variant="secondary">Menor de {idade} anos</Badge>
                )}
              </div>
            </div>
          </div>

          <div className="text-right text-sm text-muted-foreground">
            <p>
              <strong>Cadastrado em:</strong>
            </p>
            <p>{socio.data_cadastro ? formatarData(new Date(socio.data_cadastro)) : '-'}</p>
          </div>
        </div>
      </Card>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Dados Pessoais */}
        <Card className="p-6">
          <div className="flex items-center gap-2 mb-4">
            <User className="w-5 h-5 text-torcida-laranja" />
            <h3 className="text-lg font-semibold">Dados Pessoais</h3>
          </div>

          <dl className="space-y-3 text-sm">
            <div>
              <dt className="font-medium text-muted-foreground">CPF</dt>
              <dd className="font-mono">{formatarCPF(socio.cpf)}</dd>
            </div>
            <div>
              <dt className="font-medium text-muted-foreground">Data de Nascimento</dt>
              <dd>
                {formatarData(new Date(socio.data_nascimento))} ({idade} anos)
              </dd>
            </div>
            <div>
              <dt className="font-medium text-muted-foreground">Gênero</dt>
              <dd className="capitalize">{socio.genero?.replace('_', ' ')}</dd>
            </div>
            {socio.escolaridade && (
              <div>
                <dt className="font-medium text-muted-foreground">Escolaridade</dt>
                <dd className="capitalize">{socio.escolaridade.replace('_', ' ')}</dd>
              </div>
            )}
            {socio.profissao && (
              <div>
                <dt className="font-medium text-muted-foreground">Profissão</dt>
                <dd>{socio.profissao}</dd>
              </div>
            )}
          </dl>
        </Card>

        {/* Contato */}
        <Card className="p-6">
          <div className="flex items-center gap-2 mb-4">
            <Phone className="w-5 h-5 text-torcida-laranja" />
            <h3 className="text-lg font-semibold">Contato</h3>
          </div>

          <dl className="space-y-3 text-sm">
            <div>
              <dt className="font-medium text-muted-foreground">Email</dt>
              <dd>{socio.email}</dd>
            </div>
            <div>
              <dt className="font-medium text-muted-foreground">WhatsApp</dt>
              <dd>{formatarTelefone(socio.whatsapp)}</dd>
            </div>
            {socio.contato_emergencia_nome && (
              <>
                <div className="pt-2 border-t">
                  <dt className="font-medium text-muted-foreground">
                    Contato de Emergência
                  </dt>
                  <dd>{socio.contato_emergencia_nome}</dd>
                </div>
                {socio.contato_emergencia_telefone && (
                  <div>
                    <dt className="font-medium text-muted-foreground">Telefone</dt>
                    <dd>{formatarTelefone(socio.contato_emergencia_telefone)}</dd>
                  </div>
                )}
              </>
            )}
          </dl>
        </Card>

        {/* Endereço */}
        <Card className="p-6">
          <div className="flex items-center gap-2 mb-4">
            <MapPin className="w-5 h-5 text-torcida-laranja" />
            <h3 className="text-lg font-semibold">Endereço</h3>
          </div>

          <address className="not-italic text-sm space-y-1">
            <p>
              {socio.endereco_completo}, {socio.numero}
            </p>
            {socio.complemento && <p>{socio.complemento}</p>}
            <p>{socio.bairro}</p>
            <p>
              {socio.cidade} - {socio.estado}
            </p>
            {socio.cep && <p>CEP: {socio.cep}</p>}
          </address>
        </Card>

        {/* Documentos */}
        <Card className="p-6">
          <div className="flex items-center gap-2 mb-4">
            <FileText className="w-5 h-5 text-torcida-laranja" />
            <h3 className="text-lg font-semibold">Documentos</h3>
          </div>

          <div className="space-y-3">
            {socio.doc_identificacao_url && (
              <div>
                <p className="text-sm font-medium text-muted-foreground mb-1">
                  {socio.tipo_documento?.toUpperCase()}
                </p>
                <Button variant="outline" size="sm" asChild className="w-full">
                  <a
                    href={socio.doc_identificacao_url}
                    target="_blank"
                    rel="noopener noreferrer"
                  >
                    <Download className="w-4 w-4 mr-2" />
                    Ver Documento
                  </a>
                </Button>
              </div>
            )}

            {socio.comprovante_endereco_url && (
              <div>
                <p className="text-sm font-medium text-muted-foreground mb-1">
                  Comprovante de Endereço
                </p>
                <Button variant="outline" size="sm" asChild className="w-full">
                  <a
                    href={socio.comprovante_endereco_url}
                    target="_blank"
                    rel="noopener noreferrer"
                  >
                    <Download className="w-4 h-4 mr-2" />
                    Ver Comprovante
                  </a>
                </Button>
              </div>
            )}

            {socio.assinatura_url && (
              <div>
                <p className="text-sm font-medium text-muted-foreground mb-1">
                  Assinatura Digital
                </p>
                <div className="border rounded-lg p-4 bg-white">
                  {/* eslint-disable-next-line @next/next/no-img-element */}
                  <img
                    src={socio.assinatura_url}
                    alt="Assinatura"
                    className="h-16 mx-auto"
                  />
                </div>
              </div>
            )}
          </div>
        </Card>
      </div>

      {/* Informações de Saúde */}
      {(socio.descricao_necessidades || socio.alergias || socio.medicacao_detalhes) && (
        <Card className="p-6">
          <div className="flex items-center gap-2 mb-4">
            <Heart className="w-5 h-5 text-torcida-laranja" />
            <h3 className="text-lg font-semibold">Informações de Saúde</h3>
          </div>

          <dl className="space-y-3 text-sm">
            {socio.descricao_necessidades && (
              <div>
                <dt className="font-medium text-muted-foreground">
                  Necessidades Especiais
                </dt>
                <dd>{socio.descricao_necessidades}</dd>
              </div>
            )}
            {socio.alergias && (
              <div>
                <dt className="font-medium text-muted-foreground">Alergias</dt>
                <dd>{socio.alergias}</dd>
              </div>
            )}
            {socio.medicacao_detalhes && (
              <div>
                <dt className="font-medium text-muted-foreground">Medicação</dt>
                <dd>{socio.medicacao_detalhes}</dd>
              </div>
            )}
          </dl>
        </Card>
      )}

      {/* Dados do Responsável (se menor) */}
      {socio.e_menor && (
        <Card className="p-6 border-amber-300 bg-amber-50/50 dark:bg-amber-950/50">
          <div className="flex items-center gap-2 mb-4">
            <AlertCircle className="w-5 h-5 text-amber-600" />
            <h3 className="text-lg font-semibold">Dados do Responsável Legal</h3>
          </div>

          <dl className="space-y-3 text-sm">
            <div>
              <dt className="font-medium text-muted-foreground">Nome</dt>
              <dd>{socio.nome_responsavel}</dd>
            </div>
            <div>
              <dt className="font-medium text-muted-foreground">CPF</dt>
              <dd className="font-mono">{socio.cpf_responsavel ? formatarCPF(socio.cpf_responsavel) : '-'}</dd>
            </div>

            <div className="pt-2 space-y-2">
              {socio.documento_responsavel_url && (
                <Button variant="outline" size="sm" asChild className="w-full">
                  <a
                    href={socio.documento_responsavel_url}
                    target="_blank"
                    rel="noopener noreferrer"
                  >
                    <Download className="w-4 h-4 mr-2" />
                    Ver Documento do Responsável
                  </a>
                </Button>
              )}
              {socio.termo_menoridade_url && (
                <Button variant="outline" size="sm" asChild className="w-full">
                  <a
                    href={socio.termo_menoridade_url}
                    target="_blank"
                    rel="noopener noreferrer"
                  >
                    <Download className="w-4 h-4 mr-2" />
                    Ver Termo de Menoridade
                  </a>
                </Button>
              )}
            </div>
          </dl>
        </Card>
      )}
    </div>
  )
}
