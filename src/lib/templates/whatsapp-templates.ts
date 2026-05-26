/**
 * Templates de Mensagens WhatsApp
 * Templates pré-definidos para notificações via WhatsApp
 */

import { format } from 'date-fns'
import { ptBR } from 'date-fns/locale'

const SITE_URL = process.env.NEXT_PUBLIC_SITE_URL || 'https://torcidacluboficial.com.br'

export const whatsappTemplates = {
  /**
   * Lembrete 7 dias antes do vencimento
   */
  lembrete_7_dias: (nome: string, valor: number, dataVenc: Date): string => `
🔔 *TorcidaClub®* - Lembrete de Pagamento

Olá, ${nome}! 👋

Sua mensalidade vence em *7 dias* (${format(dataVenc, 'dd/MM/yyyy', { locale: ptBR })}).

💰 Valor: R$ ${valor.toFixed(2).replace('.', ',')}

Entre no seu painel para realizar o pagamento:
${SITE_URL}/mensalidade

Obrigado pelo apoio! 💚💛
  `.trim(),

  /**
   * Lembrete 3 dias antes do vencimento
   */
  lembrete_3_dias: (nome: string, valor: number, dataVenc: Date): string => `
⚠️ *TorcidaClub®* - Lembrete de Pagamento

Olá, ${nome}! 👋

Sua mensalidade vence em *3 dias* (${format(dataVenc, 'dd/MM/yyyy', { locale: ptBR })}).

💰 Valor: R$ ${valor.toFixed(2).replace('.', ',')}

Entre no seu painel para realizar o pagamento:
${SITE_URL}/mensalidade

Não deixe para a última hora! ⚡
  `.trim(),

  /**
   * Lembrete no dia do vencimento
   */
  lembrete_dia: (nome: string, valor: number): string => `
🚨 *TorcidaClub®* - Último Aviso

Olá, ${nome}! 👋

Sua mensalidade vence *HOJE*!

💰 Valor: R$ ${valor.toFixed(2).replace('.', ',')}

Entre no seu painel para realizar o pagamento:
${SITE_URL}/mensalidade

Não perca o acesso aos benefícios! 💚💛
  `.trim(),

  /**
   * Cadastro aprovado
   */
  cadastro_aprovado: (nome: string): string => `
✅ *TorcidaClub®* - Cadastro Aprovado!

Parabéns, ${nome}! 🎉

Seu cadastro foi aprovado com sucesso!

Agora você pode:
✓ Acessar seu painel
✓ Realizar pagamentos
✓ Comprar ingressos
✓ Adicionar dependentes

Acesse seu painel:
${SITE_URL}/painel

Bem-vindo à família! 💚💛
  `.trim(),

  /**
   * Pagamento aprovado
   */
  pagamento_aprovado: (nome: string, dataProximo: Date): string => `
✅ *TorcidaClub®* - Pagamento Confirmado!

Parabéns, ${nome}! 🎉

Seu pagamento foi aprovado e seu acesso está ativo!

📅 Próximo vencimento: ${format(dataProximo, 'dd/MM/yyyy', { locale: ptBR })}

Obrigado pelo apoio! 💚💛

Acesse seu painel:
${SITE_URL}/painel
  `.trim(),

  /**
   * Pagamento recusado
   */
  pagamento_recusado: (nome: string, motivo: string): string => `
❌ *TorcidaClub®* - Comprovante Recusado

Olá, ${nome}!

Infelizmente seu comprovante foi recusado.

📝 Motivo: ${motivo}

Por favor, envie um novo comprovante válido:
${SITE_URL}/mensalidade

Em caso de dúvidas, entre em contato com o gestor.
  `.trim(),

  /**
   * Bloqueio por inadimplência
   */
  bloqueio_acesso: (nome: string, meses: number, divida: number): string => `
🚫 *TorcidaClub®* - Acesso Bloqueado

Olá, ${nome}.

Seu acesso foi bloqueado devido à inadimplência.

📊 Situação:
• Meses pendentes: ${meses}
• Valor total: R$ ${divida.toFixed(2).replace('.', ',')}

Para regularizar sua situação, acesse:
${SITE_URL}/mensalidade

Qualquer dúvida, entre em contato com o gestor.
  `.trim(),

  /**
   * Dívida perdoada
   */
  divida_perdoada: (nome: string): string => `
✅ *TorcidaClub®* - Dívida Perdoada!

Olá, ${nome}! 🎉

Boa notícia! Sua dívida foi perdoada pelo gestor.

Sua situação foi regularizada e seu acesso está ativo novamente!

Continue apoiando a torcida! 💚💛

Acesse seu painel:
${SITE_URL}/painel
  `.trim(),

  /**
   * Ingresso aprovado
   */
  ingresso_aprovado: (nome: string, nomeEvento: string): string => `
🎫 *TorcidaClub®* - Ingresso Aprovado!

Parabéns, ${nome}! 🎉

Seu ingresso para o evento foi aprovado!

📅 Evento: ${nomeEvento}

Acesse seu painel para visualizar o QR Code:
${SITE_URL}/ingressos

Nos vemos lá! 💚💛
  `.trim(),

  /**
   * Novo evento criado
   */
  novo_evento: (nome: string, nomeEvento: string, dataEvento: Date): string => `
🎉 *TorcidaClub®* - Novo Evento!

Olá, ${nome}! 👋

Novo evento disponível para compra de ingressos:

📅 ${nomeEvento}
🗓️ Data: ${format(dataEvento, "dd/MM/yyyy 'às' HH:mm", { locale: ptBR })}

Garanta já seu ingresso:
${SITE_URL}/eventos

Corra, vagas limitadas! ⚡
  `.trim(),

  /**
   * Lembrete evento próximo
   */
  lembrete_evento: (nome: string, nomeEvento: string, dataEvento: Date): string => `
⚠️ *TorcidaClub®* - Lembrete de Evento

Olá, ${nome}! 👋

Não esqueça do evento:

📅 ${nomeEvento}
🗓️ Data: ${format(dataEvento, "dd/MM/yyyy 'às' HH:mm", { locale: ptBR })}

Seu ingresso está disponível no painel:
${SITE_URL}/ingressos

Nos vemos lá! 💚💛
  `.trim(),

  /**
   * Dependente adicionado
   */
  dependente_adicionado: (nome: string, nomeDependente: string): string => `
✅ *TorcidaClub®* - Dependente Adicionado!

Olá, ${nome}! 👋

O dependente *${nomeDependente}* foi adicionado com sucesso!

Agora ele também pode:
✓ Comprar ingressos
✓ Acessar benefícios

Acesse seu painel:
${SITE_URL}/dependentes
  `.trim(),
}

export type WhatsAppTemplateKey = keyof typeof whatsappTemplates
