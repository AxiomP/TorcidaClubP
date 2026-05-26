/**
 * Validador de CPF seguindo algoritmo oficial brasileiro
 * RN001: Todo CPF deve ser único e válido no sistema
 */

/**
 * Valida CPF usando o algoritmo oficial
 * @param cpf - CPF com ou sem formatação
 * @returns true se válido, false se inválido
 */
export function validarCPF(cpf: string): boolean {
  // Remove caracteres não numéricos
  const cpfLimpo = cpf.replace(/\D/g, '')

  // Verifica se tem 11 dígitos
  if (cpfLimpo.length !== 11) {
    return false
  }

  // Verifica se todos os dígitos são iguais (CPF inválido)
  if (/^(\d)\1{10}$/.test(cpfLimpo)) {
    return false
  }

  // Validar primeiro dígito verificador
  let soma = 0
  for (let i = 0; i < 9; i++) {
    soma += parseInt(cpfLimpo.charAt(i)) * (10 - i)
  }
  let resto = 11 - (soma % 11)
  const digito1 = resto >= 10 ? 0 : resto

  if (parseInt(cpfLimpo.charAt(9)) !== digito1) {
    return false
  }

  // Validar segundo dígito verificador
  soma = 0
  for (let i = 0; i < 10; i++) {
    soma += parseInt(cpfLimpo.charAt(i)) * (11 - i)
  }
  resto = 11 - (soma % 11)
  const digito2 = resto >= 10 ? 0 : resto

  if (parseInt(cpfLimpo.charAt(10)) !== digito2) {
    return false
  }

  return true
}

/**
 * Remove formatação do CPF (pontos e traços)
 * @param cpf - CPF formatado
 * @returns CPF apenas com números
 */
export function limparCPF(cpf: string): string {
  return cpf.replace(/\D/g, '')
}
