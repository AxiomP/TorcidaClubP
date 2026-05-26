import { NextRequest, NextResponse } from 'next/server'
import { emailTemplates } from '@/lib/templates/email-templates'
import { sendEmail } from '@/lib/services/email-service'

const SITE_URL = process.env.NEXT_PUBLIC_SITE_URL || 'https://torcidacluboficial.com.br'

const mockData = {
  cadastro_aprovado: { nome: 'João da Silva', torcidaNome: 'Mancha Verde' },
  cadastro_recusado: { nome: 'João da Silva', motivo: 'Documentação incompleta' },
  lembrete_7_dias: { nome: 'João da Silva', valor: 50, dataVencimento: '10/05/2026' },
  lembrete_dia: { nome: 'João da Silva', valor: 50, dataVencimento: '17/04/2026' },
  redefinicao_senha: { link: `${SITE_URL}/redefinir-senha?token=exemplo` },
  ingresso_aprovado: { nome: 'João da Silva' },
  comprovante_recebido: { nome: 'João da Silva' },
  mensalidade_confirmada: { nome: 'João da Silva' },
}

type TemplateName = keyof typeof mockData

function buildTemplate(template: TemplateName): { subject: string; html: string } | null {
  const d = mockData[template]
  switch (template) {
    case 'cadastro_aprovado':
      return emailTemplates.cadastro_aprovado(d as typeof mockData.cadastro_aprovado, SITE_URL)
    case 'cadastro_recusado':
      return emailTemplates.cadastro_recusado(d as typeof mockData.cadastro_recusado, SITE_URL)
    case 'lembrete_7_dias':
      return emailTemplates.lembrete_7_dias(d as typeof mockData.lembrete_7_dias, SITE_URL)
    case 'lembrete_dia':
      return emailTemplates.lembrete_dia(d as typeof mockData.lembrete_dia, SITE_URL)
    case 'redefinicao_senha':
      return emailTemplates.redefinicao_senha(d as typeof mockData.redefinicao_senha, SITE_URL)
    case 'ingresso_aprovado':
      return emailTemplates.ingresso_aprovado(d as typeof mockData.ingresso_aprovado, SITE_URL)
    case 'comprovante_recebido':
      return emailTemplates.comprovante_recebido(d as typeof mockData.comprovante_recebido, SITE_URL)
    case 'mensalidade_confirmada':
      return emailTemplates.mensalidade_confirmada(d as typeof mockData.mensalidade_confirmada, SITE_URL)
    default:
      return null
  }
}

const TEMPLATES = Object.keys(mockData) as TemplateName[]

/**
 * GET /api/test-email
 * Sem parâmetros → lista de templates disponíveis
 * ?template=<nome> → HTML renderizado do template
 */
export async function GET(request: NextRequest) {
  const { searchParams } = new URL(request.url)
  const template = searchParams.get('template') as TemplateName | null

  if (!template) {
    const list = TEMPLATES.map(
      (t) => `<li style="margin:10px 0"><a href="?template=${t}" style="color:#FAB515;font-size:16px;text-decoration:none;font-weight:600">${t}</a></li>`
    ).join('')
    return new NextResponse(
      `<!DOCTYPE html><html lang="pt-BR"><head><meta charset="UTF-8"><title>Preview de Emails — TorcidaClub</title></head>
      <body style="font-family:sans-serif;padding:40px;background:#f5f5f5">
        <div style="max-width:500px;margin:0 auto;background:#fff;padding:30px;border-radius:8px">
          <h2 style="color:#1a1a2e;margin-top:0">Templates de Email — TorcidaClub</h2>
          <p style="color:#666">Clique em um template para visualizar o HTML:</p>
          <ul style="padding-left:20px">${list}</ul>
        </div>
      </body></html>`,
      { headers: { 'Content-Type': 'text/html; charset=utf-8' } }
    )
  }

  const built = buildTemplate(template)
  if (!built) {
    return NextResponse.json(
      { error: `Template "${template}" não encontrado. Disponíveis: ${TEMPLATES.join(', ')}` },
      { status: 400 }
    )
  }

  return new NextResponse(built.html, {
    headers: { 'Content-Type': 'text/html; charset=utf-8' },
  })
}

/**
 * POST /api/test-email
 * Envia um email de teste via SMTP Hostinger.
 * Body: { "email": "voce@exemplo.com", "template": "cadastro_aprovado" }
 */
export async function POST(request: NextRequest) {
  if (!process.env.SMTP_USER || !process.env.SMTP_PASS) {
    return NextResponse.json(
      { success: false, error: 'SMTP_USER ou SMTP_PASS não configurados no ambiente.' },
      { status: 503 }
    )
  }

  let body: { email?: string; template?: string }
  try {
    body = await request.json()
  } catch {
    return NextResponse.json({ error: 'Body JSON inválido' }, { status: 400 })
  }

  const { email, template = 'cadastro_aprovado' } = body

  if (!email) {
    return NextResponse.json({ error: 'Campo obrigatório: email' }, { status: 400 })
  }

  const built = buildTemplate(template as TemplateName)
  if (!built) {
    return NextResponse.json(
      { error: `Template "${template}" não encontrado. Disponíveis: ${TEMPLATES.join(', ')}` },
      { status: 400 }
    )
  }

  const result = await sendEmail(email, `[TESTE] ${built.subject}`, built.html)

  if (!result.success) {
    return NextResponse.json({ success: false, error: result.error }, { status: 500 })
  }

  return NextResponse.json({
    success: true,
    message: `Email de teste enviado para ${email}`,
    message_id: result.id,
    template,
    subject: `[TESTE] ${built.subject}`,
  })
}
