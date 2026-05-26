/**
 * Serviço de Email - TorcidaClub
 * Utiliza nodemailer + SMTP Hostinger para envio de emails transacionais
 */

import nodemailer from 'nodemailer'
import {
  emailTemplates,
  CadastroAprovadoData,
  CadastroRecusadoData,
  LembretePagamento7DiasData,
  LembretePagamentoDiaData,
  IngressoAprovadoData,
  ComprovanteRecebidoData,
  MensalidadeConfirmadaData,
  ComprovanteRecusadoData,
} from '@/lib/templates/email-templates'

const EMAIL_FROM = process.env.EMAIL_FROM || 'TorcidaClub <noreply@torcidacluboficial.com.br>'
const SITE_URL = process.env.NEXT_PUBLIC_SITE_URL || 'https://torcidacluboficial.com.br'

function createTransporter() {
  return nodemailer.createTransport({
    host: process.env.SMTP_HOST || 'smtp.hostinger.com',
    port: Number(process.env.SMTP_PORT ?? 465),
    secure: process.env.SMTP_SECURE !== 'false',
    auth: {
      user: process.env.SMTP_USER,
      pass: process.env.SMTP_PASS,
    },
  })
}

interface SendEmailResult {
  success: boolean
  id?: string
  error?: string
}

export async function sendEmail(
  to: string,
  subject: string,
  html: string
): Promise<SendEmailResult> {
  try {
    const transporter = createTransporter()
    const info = await transporter.sendMail({
      from: EMAIL_FROM,
      to,
      subject,
      html,
      bcc: process.env.SMTP_USER,
    })
    return { success: true, id: info.messageId }
  } catch (error) {
    console.error('Erro ao enviar email:', error)
    return { success: false, error: String(error) }
  }
}

export async function enviarEmailCadastroAprovado(
  email: string,
  data: CadastroAprovadoData
): Promise<SendEmailResult> {
  const template = emailTemplates.cadastro_aprovado(data, SITE_URL)
  return sendEmail(email, template.subject, template.html)
}

export async function enviarEmailCadastroRecusado(
  email: string,
  data: CadastroRecusadoData
): Promise<SendEmailResult> {
  const template = emailTemplates.cadastro_recusado(data, SITE_URL)
  return sendEmail(email, template.subject, template.html)
}

export async function enviarEmailLembretePagamento7Dias(
  email: string,
  data: LembretePagamento7DiasData
): Promise<SendEmailResult> {
  const template = emailTemplates.lembrete_7_dias(data, SITE_URL)
  return sendEmail(email, template.subject, template.html)
}

export async function enviarEmailLembretePagamentoDia(
  email: string,
  data: LembretePagamentoDiaData
): Promise<SendEmailResult> {
  const template = emailTemplates.lembrete_dia(data, SITE_URL)
  return sendEmail(email, template.subject, template.html)
}

export async function enviarEmailIngressoAprovado(
  email: string,
  data: IngressoAprovadoData
): Promise<SendEmailResult> {
  const template = emailTemplates.ingresso_aprovado(data, SITE_URL)
  return sendEmail(email, template.subject, template.html)
}

export async function enviarEmailComprovanteRecebido(
  email: string,
  data: ComprovanteRecebidoData
): Promise<SendEmailResult> {
  const template = emailTemplates.comprovante_recebido(data, SITE_URL)
  return sendEmail(email, template.subject, template.html)
}

export async function enviarEmailComprovanteRecusado(
  email: string,
  data: ComprovanteRecusadoData
): Promise<SendEmailResult> {
  const template = emailTemplates.comprovante_recusado(data, SITE_URL)
  return sendEmail(email, template.subject, template.html)
}

export async function enviarEmailMensalidadeConfirmada(
  email: string,
  data: MensalidadeConfirmadaData
): Promise<SendEmailResult> {
  const template = emailTemplates.mensalidade_confirmada(data, SITE_URL)
  return sendEmail(email, template.subject, template.html)
}

export function isEmailServiceConfigured(): boolean {
  return !!(process.env.SMTP_USER && process.env.SMTP_PASS)
}
