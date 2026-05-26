/**
 * Templates de Email - TorcidaClub
 * Templates HTML para emails transacionais via SMTP (Hostinger)
 */

export interface CadastroAprovadoData {
  nome: string
  torcidaNome: string
}

export interface CadastroRecusadoData {
  nome: string
  motivo: string
}

export interface LembretePagamento7DiasData {
  nome: string
  valor: number
  dataVencimento: string
}

export interface LembretePagamentoDiaData {
  nome: string
  valor: number
  dataVencimento: string
}

export interface RedefinicaoSenhaData {
  link: string
}

export interface IngressoAprovadoData {
  nome: string
}

export interface ComprovanteRecebidoData {
  nome: string
}

export interface MensalidadeConfirmadaData {
  nome: string
}

export interface ComprovanteRecusadoData {
  nome: string
  motivo: string
}

interface EmailTemplate {
  subject: string
  html: string
}

const baseStyles = `
  body { font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, Helvetica, Arial, sans-serif; line-height: 1.6; color: #333; margin: 0; padding: 0; background-color: #f5f5f5; }
  .container { max-width: 600px; margin: 0 auto; background-color: #ffffff; }
  .header { background-color: #263526; padding: 30px 20px; text-align: center; }
  .header h1 { color: #FAB515; margin: 0; font-size: 24px; }
  .content { padding: 30px 20px; }
  .footer { background-color: #f8f9fa; padding: 20px; text-align: center; font-size: 12px; color: #6c757d; }
  .button { display: inline-block; padding: 12px 24px; background-color: #FAB515; color: #263526; text-decoration: none; border-radius: 6px; font-weight: 600; margin: 20px 0; }
  .info-box { background-color: #f0fdf4; border: 1px solid #86efac; border-radius: 8px; padding: 16px; margin: 20px 0; }
  .warning-box { background-color: #fef3c7; border: 1px solid #fcd34d; border-radius: 8px; padding: 16px; margin: 20px 0; }
  h2 { color: #263526; margin-top: 0; }
  p { margin: 0 0 16px 0; }
`

const wrapTemplate = (content: string): string => `
<!DOCTYPE html>
<html lang="pt-BR">
<head>
  <meta charset="UTF-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <title>TorcidaClub</title>
  <style>${baseStyles}</style>
</head>
<body>
  <div class="container">
    <div class="header">
      <h1>TorcidaClub</h1>
    </div>
    <div class="content">
      ${content}
    </div>
    <div class="footer">
      <p>Este email foi enviado automaticamente pelo TorcidaClub.</p>
      <p>Se voce nao solicitou este email, por favor ignore-o.</p>
      <p>&copy; ${new Date().getFullYear()} TorcidaClub. Todos os direitos reservados.</p>
    </div>
  </div>
</body>
</html>
`

export const emailTemplates = {
  cadastro_aprovado: (data: CadastroAprovadoData, siteUrl: string): EmailTemplate => ({
    subject: `AGORA VOCÊ FAZ PARTE DA NOSSA TORCIDA! 🔥`,
    html: wrapTemplate(`
      <h2>AGORA VOCÊ FAZ PARTE DA NOSSA TORCIDA! 🔥</h2>

      <p>Olá, <strong>${data.nome}</strong>! Seja bem vindo à nossa Torcida! 🏆</p>

      <p>Prepara o coração que a partir de hoje você vai viver com mais emossão! O estádio vai ficar pequeno com a nossa torcida! Nosso time acaba de ganhar um reforço de peso: <strong>você!</strong></p>

      <p>Clique no link abaixo para conhecer nossa plataforma online:</p>

      <a href="${siteUrl}/painel" class="button">ACESSAR A PLATAFORMA</a>

      <p>Que tal entrar no Grupo Oficial da nossa Torcida e conhecer outros membros?<br>
      Acesse a Plataforma e Clique em <strong>WPP da Minha Torcida</strong></p>

      <p>Te esperamos lá!</p>
    `),
  }),

  cadastro_recusado: (data: CadastroRecusadoData, siteUrl: string): EmailTemplate => ({
    subject: `❌ CADASTRO NÃO APROVADO — TORCIDACLUB`,
    html: wrapTemplate(`
      <h2>❌ Cadastro não aprovado</h2>

      <p>Olá, <strong>${data.nome}</strong>!</p>

      <p>Agradecemos seu interesse em fazer parte da nossa torcida. Após a análise dos seus dados, infelizmente não foi possível aprovar o seu cadastro neste momento.</p>

      <div style="background-color: #fef2f2; border: 1px solid #fca5a5; border-radius: 8px; padding: 16px; margin: 20px 0;">
        <p style="margin: 0; color: #b91c1c;"><strong>O motivo da recusa foi:</strong></p>
        <p style="margin: 8px 0 0 0; color: #991b1b;">${data.motivo}</p>
      </div>

      <p>Caso tenha ocorrido algum equívoco, você pode revisar seus dados ou entrar em contato com a gestão da torcida através da nossa plataforma.</p>

      <a href="${siteUrl}/login" class="button">ACESSAR PLATAFORMA</a>

      <p>Atenciosamente,<br><strong>TorcidaClub® - Solução para Torcidas Organizadas</strong></p>
    `),
  }),

  lembrete_7_dias: (data: LembretePagamento7DiasData, siteUrl: string): EmailTemplate => ({
    subject: `SÓCIO-TORCEDOR | FATURA VENCE EM 7 DIAS ✅ | NÃO FIQUE DE FORA!!! ⏰`,
    html: wrapTemplate(`
      <h2>Fatura vence em 7 dias ⏰</h2>

      <p>Olá, <strong>Sócio-Torcedor</strong>!</p>

      <p>O tempo passa rápido, e em breve nosso time entra em campo! Queremos você lá torcendo com a gente! E por isso, viemos te avisar que o pagamento da sua fatura já está disponível ✅</p>

      <div class="warning-box">
        <p style="margin: 0;"><strong>Detalhes do pagamento:</strong></p>
        <p style="margin: 8px 0 0 0;">
          Valor: <strong>R$ ${data.valor.toFixed(2).replace('.', ',')}</strong><br>
          Vencimento: <strong>${data.dataVencimento}</strong>
        </p>
      </div>

      <a href="${siteUrl}/mensalidade" class="button">PAGAR MENSALIDADE</a>

      <p>Acesse a Plataforma, entre com seu E-mail e Senha, e esteja pronto para o Próximo Jogo!</p>

      <p>Atenciosamente,<br><strong>TorcidaClub® - Solução para Torcidas Organizadas</strong></p>
    `),
  }),

  lembrete_dia: (data: LembretePagamentoDiaData, siteUrl: string): EmailTemplate => ({
    subject: `SÓCIO-TORCEDOR | FATURA VENCE HOJE | NÃO FIQUE DE FORA!!! ⏰`,
    html: wrapTemplate(`
      <h2>Fatura vence HOJE ⏰</h2>

      <p>Olá, <strong>Sócio-Torcedor</strong>!</p>

      <p>Não queremos que você perca os jogos do seu time! ✅ E por isso, viemos te avisar que o pagamento da sua fatura vence hoje! ⏰</p>

      <div class="warning-box">
        <p style="margin: 0;"><strong>Detalhes do pagamento:</strong></p>
        <p style="margin: 8px 0 0 0;">
          Valor: <strong>R$ ${data.valor.toFixed(2).replace('.', ',')}</strong><br>
          Vencimento: <strong>${data.dataVencimento}</strong>
        </p>
      </div>

      <a href="${siteUrl}/mensalidade" class="button">PAGAR MENSALIDADE</a>

      <p>Acesse a Plataforma, entre com seus Dados e Senha, e esteja pronto para o Próximo Jogo!</p>

      <p>Atenciosamente,<br><strong>TorcidaClub® - Solução para Torcidas Organizadas</strong></p>
    `),
  }),

  redefinicao_senha: (data: RedefinicaoSenhaData, _siteUrl: string): EmailTemplate => ({
    subject: `🔐 ESQUECEU A SENHA? CLIQUE NO LINK E ESCOLHA UMA NOVA!`,
    html: wrapTemplate(`
      <h2>🔐 Redefinição de Senha</h2>

      <p>Olá,</p>

      <p>Hora de entrar em campo com uma nova senha. Clique no link abaixo para alterar sua senha.</p>

      <a href="${data.link}" class="button">REDEFINIR MINHA SENHA</a>

      <p>Se você não solicitou a redefinição de senha, ignore este email.</p>

      <p>Qualquer dúvida, estamos por perto!</p>
    `),
  }),

  ingresso_aprovado: (data: IngressoAprovadoData, _siteUrl: string): EmailTemplate => ({
    subject: `✅ PAGAMENTO INGRESSO APROVADO!`,
    html: wrapTemplate(`
      <h2>✅ Ingresso Aprovado!</h2>

      <p>Olá, <strong>${data.nome}</strong>!</p>

      <div class="info-box">
        <p style="margin: 0;">Seu ingresso está garantido! Agora é só preparar o coração para viver mais um grande momento com a gente no estádio.</p>
      </div>

      <p>⏰ Fique atento às informações no seu Grupo do WhatsApp.</p>

      <p>Qualquer dúvida, estamos por perto!</p>

      <p>Te esperamos lá!</p>
    `),
  }),

  comprovante_recebido: (data: ComprovanteRecebidoData, _siteUrl: string): EmailTemplate => ({
    subject: `🕒 PAGAMENTO EM ANÁLISE!`,
    html: wrapTemplate(`
      <h2>🕒 Pagamento em Análise</h2>

      <p>Olá, <strong>${data.nome}</strong>!</p>

      <div class="warning-box">
        <p style="margin: 0;">Recebemos seu comprovante pelo nosso <strong>Sistema de Validação de Comprovantes (TorPix®)</strong> e nosso <strong>VAR-Financeiro</strong> está validando as informações.</p>
      </div>

      <p>Fique tranquilo, assim que o processo terminar te avisamos sem demora.</p>

      <p>Qualquer dúvida, estamos por perto!</p>
    `),
  }),

  comprovante_recusado: (data: ComprovanteRecusadoData, siteUrl: string): EmailTemplate => ({
    subject: `❌ COMPROVANTE RECUSADO — REENVIE PARA CONTINUAR`,
    html: wrapTemplate(`
      <h2>❌ Comprovante Recusado</h2>

      <p>Olá, <strong>${data.nome}</strong>!</p>

      <div style="background-color: #fef2f2; border: 1px solid #fca5a5; border-radius: 8px; padding: 16px; margin: 20px 0;">
        <p style="margin: 0; color: #b91c1c;"><strong>Seu comprovante foi recusado pelo motivo:</strong></p>
        <p style="margin: 8px 0 0 0; color: #991b1b;">${data.motivo}</p>
      </div>

      <p>Para regularizar sua situação, acesse a plataforma e envie um novo comprovante.</p>

      <a href="${siteUrl}/mensalidade" class="button">REENVIAR COMPROVANTE</a>

      <p>Qualquer dúvida, estamos por perto!</p>
    `),
  }),

  mensalidade_confirmada: (data: MensalidadeConfirmadaData, _siteUrl: string): EmailTemplate => ({
    subject: `✅ PAGAMENTO MENSALIDADE CONFIRMADO!`,
    html: wrapTemplate(`
      <h2>✅ Pagamento Confirmado!</h2>

      <p>Olá, <strong>${data.nome}</strong>!</p>

      <div class="info-box">
        <p style="margin: 0;">Passando aqui para avisar que acabamos de confirmar seu pagamento! Isso significa que estaremos torcendo juntos por mais um tempo! 🔥🚀</p>
      </div>

      <p>Prepara o coração pra viver mais um mês de emoção com a gente.</p>

      <p>Qualquer dúvida, estamos por perto!</p>

      <p>Te esperamos lá!</p>
    `),
  }),
}
