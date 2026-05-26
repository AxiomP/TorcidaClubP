/**
 * Asaas API v3 — Wrapper HTTP
 * Documentação: https://docs.asaas.com
 */

const ASAAS_URL = process.env.ASAAS_URL || 'https://sandbox.asaas.com/api'
const ASAAS_API_KEY = process.env.ASAAS_API_KEY || ''

interface AsaasHeaders {
  'Content-Type': string
  access_token: string
}

function getHeaders(): AsaasHeaders {
  if (!ASAAS_API_KEY) {
    throw new Error('ASAAS_API_KEY não configurado')
  }
  return {
    'Content-Type': 'application/json',
    access_token: ASAAS_API_KEY,
  }
}

async function asaasFetch<T>(path: string, options?: RequestInit): Promise<T> {
  const url = `${ASAAS_URL}${path}`
  const res = await fetch(url, {
    ...options,
    headers: {
      ...getHeaders(),
      ...(options?.headers ?? {}),
    },
  })

  if (!res.ok) {
    const body = await res.text()
    throw new Error(`Asaas ${options?.method ?? 'GET'} ${path} → ${res.status}: ${body}`)
  }

  return res.json() as Promise<T>
}

// ---------- Tipos retornados pela API ----------

export interface AsaasCustomer {
  id: string
  name: string
  email: string
  externalReference: string | null
}

export interface AsaasPayment {
  id: string
  customer: string
  billingType: string
  value: number
  dueDate: string
  status: string
  invoiceUrl: string | null
  externalReference: string | null
}

export interface AsaasSubscription {
  id: string
  customer: string
  billingType: string
  value: number
  nextDueDate: string
  cycle: string
  status: string
  description: string | null
  externalReference: string | null
}

export interface AsaasPaymentList {
  data: AsaasPayment[]
  totalCount: number
}

// ---------- Funções públicas ----------

/**
 * Cria um cliente no Asaas.
 * cpfCnpj é opcional — obrigatório para produção, pode ser omitido no sandbox.
 * NOTE: adicione a coluna `cpf_cnpj TEXT` na tabela `gestores` para persistir este dado.
 */
export async function createCustomer(params: {
  name: string
  email: string
  externalReference: string
  cpfCnpj?: string
}): Promise<AsaasCustomer> {
  return asaasFetch<AsaasCustomer>('/v3/customers', {
    method: 'POST',
    body: JSON.stringify({
      name: params.name,
      email: params.email,
      externalReference: params.externalReference,
      ...(params.cpfCnpj ? { cpfCnpj: params.cpfCnpj } : {}),
    }),
  })
}

/**
 * Cria uma cobrança avulsa no Asaas (débito/crédito/pix avulso).
 * Para assinaturas recorrentes, use createSubscription.
 */
export async function createPayment(params: {
  customerId: string
  value: number
  description: string
  externalReference: string
  billingType?: 'UNDEFINED' | 'PIX' | 'DEBIT_CARD' | 'CREDIT_CARD'
}): Promise<AsaasPayment> {
  const dueDate = new Date()
  dueDate.setDate(dueDate.getDate() + 3)
  const dueDateStr = dueDate.toISOString().split('T')[0]

  return asaasFetch<AsaasPayment>('/v3/payments', {
    method: 'POST',
    body: JSON.stringify({
      customer: params.customerId,
      billingType: params.billingType ?? 'UNDEFINED',
      value: params.value,
      dueDate: dueDateStr,
      description: params.description,
      externalReference: params.externalReference,
    }),
  })
}

/**
 * Busca os dados de uma cobrança pelo ID.
 */
export async function getPayment(paymentId: string): Promise<AsaasPayment> {
  return asaasFetch<AsaasPayment>(`/v3/payments/${paymentId}`)
}

/**
 * Atualiza dados de um cliente no Asaas.
 * Usado para adicionar cpfCnpj a um cliente já existente.
 */
export async function updateCustomer(
  customerId: string,
  params: { cpfCnpj?: string; name?: string; email?: string }
): Promise<AsaasCustomer> {
  return asaasFetch<AsaasCustomer>(`/v3/customers/${customerId}`, {
    method: 'POST',
    body: JSON.stringify(params),
  })
}

/**
 * Cria uma assinatura recorrente no Asaas.
 * billingType: PIX gera cobranças mensais via PIX com link de pagamento (invoiceUrl).
 * Asaas gerencia automaticamente as renovações conforme o cycle escolhido.
 */
export async function createSubscription(params: {
  customerId: string
  value: number
  nextDueDate: string // YYYY-MM-DD
  cycle: 'WEEKLY' | 'BIWEEKLY' | 'MONTHLY' | 'QUARTERLY' | 'SEMIANNUALLY' | 'YEARLY'
  description: string
  externalReference: string
  billingType?: 'PIX' | 'UNDEFINED' | 'DEBIT_CARD' | 'CREDIT_CARD'
}): Promise<AsaasSubscription> {
  return asaasFetch<AsaasSubscription>('/v3/subscriptions', {
    method: 'POST',
    body: JSON.stringify({
      customer: params.customerId,
      billingType: params.billingType ?? 'PIX',
      value: params.value,
      nextDueDate: params.nextDueDate,
      cycle: params.cycle,
      description: params.description,
      externalReference: params.externalReference,
    }),
  })
}

/**
 * Lista os pagamentos de uma assinatura.
 * Retorna as cobranças geradas pelo Asaas para a assinatura especificada.
 */
export async function getSubscriptionPayments(
  subscriptionId: string,
  limit = 1
): Promise<AsaasPaymentList> {
  return asaasFetch<AsaasPaymentList>(
    `/v3/payments?subscription=${subscriptionId}&limit=${limit}`
  )
}

/**
 * Cancela uma assinatura no Asaas.
 * Após o cancelamento, cobranças futuras não serão geradas.
 */
export async function cancelSubscription(subscriptionId: string): Promise<void> {
  await asaasFetch(`/v3/subscriptions/${subscriptionId}`, { method: 'DELETE' })
}

const asaasService = {
  createCustomer,
  updateCustomer,
  cancelSubscription,
  createPayment,
  getPayment,
  createSubscription,
  getSubscriptionPayments,
}
export default asaasService
