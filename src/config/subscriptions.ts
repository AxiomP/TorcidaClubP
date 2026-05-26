/**
 * Configuração central de preços da plataforma TorcidaClub®
 * Altere os valores aqui para atualizar todos os módulos de cobrança.
 *
 * IMPORTANTE: O valor lido em runtime vem de ASAAS_SUBSCRIPTION_VALUE (env).
 * Esta constante serve como fallback e documentação.
 */

// Valor mensal da assinatura paga pelos gestores/torcidas à plataforma (R$)
export const PLATFORM_SUBSCRIPTION_VALUE = parseFloat(
  process.env.ASAAS_SUBSCRIPTION_VALUE || '279.00'
)
