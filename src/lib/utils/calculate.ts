/**
 * Funções de cálculo para regras de negócio
 * RN029: Validação de Idade
 */

/**
 * Calcula idade baseado na data de nascimento de forma segura contra fusos horários
 * @param dataNascimento - Data de nascimento (Objeto Date ou string YYYY-MM-DD)
 * @returns Idade em anos
 */
export function calcularIdade(dataNascimento: Date | string): number {
  let anoNasc: number
  let mesNasc: number
  let diaNasc: number

  if (typeof dataNascimento === 'string') {
    const partes = dataNascimento.split('T')[0].split('-').map(Number)
    anoNasc = partes[0]
    mesNasc = partes[1]
    diaNasc = partes[2]
  } else {
    anoNasc = dataNascimento.getFullYear()
    mesNasc = dataNascimento.getMonth() + 1
    diaNasc = dataNascimento.getDate()
  }

  const hoje = new Date()
  const anoAtual = hoje.getFullYear()
  const mesAtual = hoje.getMonth() + 1
  const diaAtual = hoje.getDate()

  let dIdade = anoAtual - anoNasc

  if (mesAtual < mesNasc || (mesAtual === mesNasc && diaAtual < diaNasc)) {
    dIdade--
  }

  return Math.max(0, dIdade)
}

/**
 * Verifica se pessoa é maior de idade (18 anos)
 */
export function isMaiorDeIdade(dataNascimento: Date | string): boolean {
  return calcularIdade(dataNascimento) >= 18
}

/**
 * Verifica se pessoa é menor de idade
 */
export function isMenorDeIdade(dataNascimento: Date | string): boolean {
  return calcularIdade(dataNascimento) < 18
}

/**
 * Valida se idade mínima foi atingida
 */
export function validarIdadeMinima(
  dataNascimento: Date | string,
  minima: number
): boolean {
  return calcularIdade(dataNascimento) >= minima
}

/**
 * Calcula data de quando pessoa completará determinada idade
 */
export function calcularDataIdade(
  dataNascimento: Date | string,
  idadeAlvo: number
): Date {
  let anoNasc: number
  let mesNasc: number
  let diaNasc: number

  if (typeof dataNascimento === 'string') {
    const partes = dataNascimento.split('T')[0].split('-').map(Number)
    anoNasc = partes[0]
    mesNasc = partes[1] - 1
    diaNasc = partes[2]
  } else {
    anoNasc = dataNascimento.getFullYear()
    mesNasc = dataNascimento.getMonth()
    diaNasc = dataNascimento.getDate()
  }

  return new Date(anoNasc + idadeAlvo, mesNasc, diaNasc, 12, 0, 0)
}

/**
 * 🌟 ADICIONADO DE VOLTA: RN008: Calcula dívida acumulada de um sócio
 * @param pagamentos - Array de pagamentos pendentes
 * @returns Objeto com total e quantidade de meses
 */
export function calcularDivida(pagamentos: Array<{
  valor_original: number
  valor_perdoado: number
}>): { total: number; meses: number } {
  const total = pagamentos.reduce((acc, pgto) => {
    return acc + (pgto.valor_original - (pgto.valor_perdoado || 0))
  }, 0)

  return {
    total,
    meses: pagamentos.length
  }
}

/**
 * Calcula total de uma lista de valores
 */
export function calcularTotal(valores: number[]): number {
  return valores.reduce((acc, val) => acc + val, 0)
}

/**
 * Calcula percentual de um valor
 */
export function calcularPercentual(valor: number, percentual: number): number {
  return (valor * percentual) / 100
}

/**
 * Calcula desconto de um valor
 */
export function calcularDesconto(
  valorOriginal: number,
  desconto: number
): number {
  return valorOriginal - calcularPercentual(valorOriginal, desconto)
}