/**
 * Validador de arquivos para upload
 * RN028: Validação de Arquivos
 */

import { LIMITES_UPLOAD, MENSAGENS_ERRO } from '@/lib/utils/constants'

export interface ValidacaoArquivo {
  valido: boolean
  erro?: string
}

/**
 * Valida arquivo de imagem (selfie, documentos)
 */
export function validarImagem(file: File): ValidacaoArquivo {
  // Validar tipo
  if (!(LIMITES_UPLOAD.IMAGEM.TIPOS as readonly string[]).includes(file.type)) {
    return {
      valido: false,
      erro: MENSAGENS_ERRO.ARQUIVO_TIPO_INVALIDO(
        LIMITES_UPLOAD.IMAGEM.TIPOS.join(', ')
      ),
    }
  }

  // Validar tamanho
  if (file.size > LIMITES_UPLOAD.IMAGEM.TAMANHO_MAX) {
    return {
      valido: false,
      erro: MENSAGENS_ERRO.ARQUIVO_GRANDE(
        LIMITES_UPLOAD.IMAGEM.TAMANHO_MAX_LABEL
      ),
    }
  }

  return { valido: true }
}

/**
 * Valida arquivo PDF (comprovantes)
 */
export function validarPDF(file: File): ValidacaoArquivo {
  // Validar tipo
  if (!(LIMITES_UPLOAD.PDF.TIPOS as readonly string[]).includes(file.type)) {
    return {
      valido: false,
      erro: MENSAGENS_ERRO.ARQUIVO_TIPO_INVALIDO(
        LIMITES_UPLOAD.PDF.TIPOS.join(', ')
      ),
    }
  }

  // Validar tamanho
  if (file.size > LIMITES_UPLOAD.PDF.TAMANHO_MAX) {
    return {
      valido: false,
      erro: MENSAGENS_ERRO.ARQUIVO_GRANDE(
        LIMITES_UPLOAD.PDF.TAMANHO_MAX_LABEL
      ),
    }
  }

  return { valido: true }
}

/**
 * Valida qualquer tipo de arquivo (imagem ou PDF)
 */
export function validarArquivo(file: File, tipo: 'imagem' | 'pdf'): ValidacaoArquivo {
  if (tipo === 'imagem') {
    return validarImagem(file)
  } else {
    return validarPDF(file)
  }
}

/**
 * Formata tamanho de arquivo para leitura humana
 */
export function formatarTamanhoArquivo(bytes: number): string {
  if (bytes === 0) return '0 Bytes'

  const k = 1024
  const sizes = ['Bytes', 'KB', 'MB', 'GB']
  const i = Math.floor(Math.log(bytes) / Math.log(k))

  return Math.round((bytes / Math.pow(k, i)) * 100) / 100 + ' ' + sizes[i]
}
