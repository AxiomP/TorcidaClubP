import jsPDF from 'jspdf'

/**
 * Serviço para geração de PDFs
 * Gera ficha de cadastro de sócios conforme modelo padrão
 */

export interface SocioDataForPDF {
  id: string
  codigo_referencia: string | null
  nome_completo: string
  apelido: string | null
  cpf: string
  numero_rg: string | null
  data_nascimento: string
  genero: string | null
  estado_civil: string | null
  profissao: string | null
  escolaridade: string | null
  nome_mae: string | null
  nome_pai: string | null
  email: string
  whatsapp: string
  endereco_completo: string
  numero: string
  complemento: string | null
  bairro: string
  cidade: string
  estado: string
  cep: string | null
  data_membro: string | null
  funcao_torcida?: string | null
  data_cadastro: string
  doc_frente_url: string | null
  doc_verso_url: string | null
  comprovante_endereco_url: string | null
  selfie_url: string | null
  assinatura_url: string | null
  termo_menoridade_url?: string | null
  e_menor?: boolean | null
  nome_responsavel?: string | null
  cpf_responsavel?: string | null
}

export interface IngressoRelatorio {
  id: string
  status: string
  valor: number
  created_at: string 
  socio_id: string | null
  socios?: {
    nome_completo: string
  } | null
}

export interface TorcidaDataForPDF {
  nome: string
  slug: string | null
  brasao_url: string | null
  presidente: string | null
  vice_presidente: string | null
  endereco_sede?: string | null
  idade_min_pagamento?: number | null
}

/**
 * Formata CPF para exibição (XXX.XXX.XXX-XX)
 */
function formatCPF(cpf: string): string {
  const cleanCPF = cpf.replace(/\D/g, '')
  if (cleanCPF.length !== 11) return cpf
  return cleanCPF.replace(/(\d{3})(\d{3})(\d{3})(\d{2})/, '$1.$2.$3-$4')
}

/**
 * Formata data para exibição (DD/MM/YYYY)
 */
function formatDate(dateString: string | null): string {
  if (!dateString) return '-'
  const [year, month, day] = dateString.split('-').map(Number)
  const date = new Date(Date.UTC(year, month - 1, day))
  return date.toLocaleDateString('pt-BR', { timeZone: 'UTC' })
}

/**
 * Formata telefone para exibição
 */
function formatPhone(phone: string): string {
  const cleanPhone = phone.replace(/\D/g, '')
  if (cleanPhone.length === 11) {
    return cleanPhone.replace(/(\d{2})(\d{5})(\d{4})/, '($1) $2-$3')
  }
  if (cleanPhone.length === 10) {
    return cleanPhone.replace(/(\d{2})(\d{4})(\d{4})/, '($1) $2-$3')
  }
  return phone
}

/**
 * Converte URL de imagem para base64 (para uso no PDF)
 */
async function imageUrlToBase64(url: string): Promise<string | null> {
  try {
    const response = await fetch(url)
    if (!response.ok) return null

    const blob = await response.blob()
    return new Promise((resolve) => {
      const reader = new FileReader()
      reader.onloadend = () => resolve(reader.result as string)
      reader.onerror = () => resolve(null)
      reader.readAsDataURL(blob)
    })
  } catch {
    return null
  }
}

/**
 * Gera o PDF da ficha de cadastro do sócio
 * Estrutura:
 * - Página 1: Ficha Cadastral (dados pessoais, assinatura, brasão)
 * - Página 2: Frente do RG
 * - Página 3: Verso do RG
 * - Página 4: Comprovante de Residência
 * - Página 5: Selfie
 */
export async function generateFichaCadastralPDF(
  socio: SocioDataForPDF,
  torcida: TorcidaDataForPDF
): Promise<Blob> {
  const doc = new jsPDF({
    orientation: 'portrait',
    unit: 'mm',
    format: 'a4',
  })

  const pageWidth = doc.internal.pageSize.getWidth()
  const pageHeight = doc.internal.pageSize.getHeight()
  const margin = 20
  const contentWidth = pageWidth - 2 * margin

  // Cores
  const primaryColor: [number, number, number] = [0, 0, 0]
  const grayColor: [number, number, number] = [100, 100, 100]

  // ========== PÁGINA 1: FICHA CADASTRAL ==========

  let yPos = margin

  // Título
  doc.setFontSize(16)
  doc.setFont('helvetica', 'bold')
  doc.setTextColor(...primaryColor)
  doc.text(`FICHA CADASTRAL - ${torcida.nome.toUpperCase()}`, pageWidth / 2, yPos, { align: 'center' })
  yPos += 15

  // Linha divisória
  doc.setLineWidth(0.5)
  doc.line(margin, yPos, pageWidth - margin, yPos)
  yPos += 10

  // Informações do sócio em grid
  doc.setFontSize(10)

  const addField = (label: string, value: string, x: number, y: number, width: number = 80) => {
    doc.setFont('helvetica', 'bold')
    doc.setTextColor(...primaryColor)
    doc.text(label, x, y)
    doc.setFont('helvetica', 'normal')
    doc.setTextColor(...grayColor)
    const lines = doc.splitTextToSize(value || '-', width)
    doc.text(lines, x, y + 5)
    return y + 5 + (lines.length * 4)
  }

  // Número de sócio e data de membro (destaque)
  doc.setFontSize(12)
  doc.setFont('helvetica', 'bold')
  doc.setTextColor(...primaryColor)
  const numAssociado = (socio.codigo_referencia || '').replace(/\D/g, '') || 'Pendente'
  doc.text(`N° Associado: ${numAssociado}`, margin, yPos)
  doc.text(`Data Membro: ${formatDate(socio.data_membro)}`, pageWidth - margin - 50, yPos)
  if (socio.funcao_torcida) {
    yPos += 7
    doc.setFontSize(11)
    doc.setFont('helvetica', 'bold')
    doc.setTextColor(...primaryColor)
    doc.text(`Função: ${socio.funcao_torcida}`, pageWidth - margin - 50, yPos)
  }
  yPos += 15

  // Grid de informações
  doc.setFontSize(9)

  // Coluna 1
  let col1Y = yPos
  col1Y = addField('Nome Completo:', socio.nome_completo, margin, col1Y)
  col1Y = addField('Apelido:', socio.apelido || '-', margin, col1Y + 5)
  col1Y = addField('CPF:', formatCPF(socio.cpf), margin, col1Y + 5)
  col1Y = addField('RG:', socio.numero_rg || '-', margin, col1Y + 5)
  col1Y = addField('Data de Nascimento:', formatDate(socio.data_nascimento), margin, col1Y + 5)
  col1Y = addField('Gênero:', socio.genero || '-', margin, col1Y + 5)
  col1Y = addField('Estado Civil:', socio.estado_civil || '-', margin, col1Y + 5)

  // Coluna 2
  let col2Y = yPos
  const col2X = pageWidth / 2
  col2Y = addField('Profissão:', socio.profissao || '-', col2X, col2Y)
  col2Y = addField('Escolaridade:', socio.escolaridade || '-', col2X, col2Y + 5)
  col2Y = addField('Nome da Mãe:', socio.nome_mae || '-', col2X, col2Y + 5)
  col2Y = addField('Nome do Pai:', socio.nome_pai || '-', col2X, col2Y + 5)
  col2Y = addField('Email:', socio.email, col2X, col2Y + 5)
  col2Y = addField('WhatsApp:', formatPhone(socio.whatsapp), col2X, col2Y + 5)

  yPos = Math.max(col1Y, col2Y) + 10

  // Endereço
  doc.setLineWidth(0.3)
  doc.line(margin, yPos, pageWidth - margin, yPos)
  yPos += 8

  doc.setFont('helvetica', 'bold')
  doc.setFontSize(10)
  doc.setTextColor(...primaryColor)
  doc.text('ENDEREÇO', margin, yPos)
  yPos += 8

  doc.setFontSize(9)
  doc.setFont('helvetica', 'normal')
  doc.setTextColor(...grayColor)

  const endereco = `${socio.endereco_completo}, ${socio.numero}${socio.complemento ? ' - ' + socio.complemento : ''}`
  const bairroCidade = `${socio.bairro} - ${socio.cidade}/${socio.estado}`
  const cep = socio.cep ? `CEP: ${socio.cep.replace(/(\d{5})(\d{3})/, '$1-$2')}` : ''

  doc.text(endereco, margin, yPos)
  yPos += 5
  doc.text(bairroCidade, margin, yPos)
  yPos += 5
  if (cep) {
    doc.text(cep, margin, yPos)
    yPos += 5
  }

  yPos += 15

  // Linha divisória
  doc.line(margin, yPos, pageWidth - margin, yPos)
  yPos += 10

  // Assinatura
  doc.setFont('helvetica', 'bold')
  doc.setFontSize(10)
  doc.setTextColor(...primaryColor)
  doc.text('ASSINATURA DO SÓCIO', margin, yPos)
  yPos += 5

  // Box para assinatura
  const assinaturaBoxHeight = 30
  doc.setDrawColor(200, 200, 200)
  doc.rect(margin, yPos, contentWidth / 2, assinaturaBoxHeight)

  // Tentar carregar assinatura se existir
  if (socio.assinatura_url) {
    try {
      const assinaturaBase64 = await imageUrlToBase64(socio.assinatura_url)
      if (assinaturaBase64) {
        doc.addImage(assinaturaBase64, 'PNG', margin + 5, yPos + 2, contentWidth / 2 - 10, assinaturaBoxHeight - 4)
      }
    } catch {
      // Assinatura não disponível
    }
  }

  yPos += assinaturaBoxHeight + 5
  doc.setFont('helvetica', 'normal')
  doc.setFontSize(8)
  doc.setTextColor(...grayColor)
  doc.text(`Data de Cadastro: ${formatDate(socio.data_cadastro)}`, margin, yPos)

  // Brasão e informações da torcida (canto inferior direito)
  const brasaoY = pageHeight - margin - 50

  if (torcida.brasao_url) {
    try {
      const brasaoBase64 = await imageUrlToBase64(torcida.brasao_url)
      if (brasaoBase64) {
        doc.addImage(brasaoBase64, 'PNG', pageWidth - margin - 40, brasaoY, 40, 40)
      }
    } catch {
      // Brasão não disponível
    }
  }

  // Presidente e Vice
  if (torcida.presidente || torcida.vice_presidente || torcida.endereco_sede) {
    doc.setFontSize(8)
    doc.setFont('helvetica', 'normal')
    doc.setTextColor(...grayColor)

    let infoY = brasaoY + 45
    if (torcida.presidente) {
      doc.text(`Presidente: ${torcida.presidente}`, pageWidth - margin - 40, infoY)
      infoY += 4
    }
    if (torcida.vice_presidente) {
      doc.text(`Vice: ${torcida.vice_presidente}`, pageWidth - margin - 40, infoY)
      infoY += 4
    }
    if (torcida.endereco_sede) {
      const sedeLines = doc.splitTextToSize(`Sede: ${torcida.endereco_sede}`, 60)
      doc.text(sedeLines, pageWidth - margin - 40, infoY)
    }
  }

  // Rodapé
  doc.setFontSize(7)
  doc.setTextColor(150, 150, 150)
  doc.text('Documento gerado automaticamente pelo TorcidaClub', pageWidth / 2, pageHeight - 10, { align: 'center' })

  // ========== PÁGINA 2: FRENTE DO RG ==========
  if (socio.doc_frente_url) {
    doc.addPage()
    await addDocumentPage(doc, 'DOCUMENTO DE IDENTIFICAÇÃO - FRENTE', socio.doc_frente_url, pageWidth, pageHeight, margin)
  }

  // ========== PÁGINA 3: VERSO DO RG ==========
  if (socio.doc_verso_url) {
    doc.addPage()
    await addDocumentPage(doc, 'DOCUMENTO DE IDENTIFICAÇÃO - VERSO', socio.doc_verso_url, pageWidth, pageHeight, margin)
  }

  // ========== PÁGINA 4: COMPROVANTE DE RESIDÊNCIA ==========
  if (socio.comprovante_endereco_url) {
    doc.addPage()
    await addDocumentPage(doc, 'COMPROVANTE DE RESIDÊNCIA', socio.comprovante_endereco_url, pageWidth, pageHeight, margin)
  }

  // ========== PÁGINA 5: SELFIE ==========
  if (socio.selfie_url) {
    doc.addPage()
    await addDocumentPage(doc, 'FOTO DO SÓCIO', socio.selfie_url, pageWidth, pageHeight, margin)
  }

  // ========== PÁGINA 6: TERMO DE MENORIDADE ==========
  if (socio.termo_menoridade_url) {
    doc.addPage()
    await addDocumentPage(doc, 'TERMO DE MENORIDADE - ASSINADO PELO RESPONSÁVEL', socio.termo_menoridade_url, pageWidth, pageHeight, margin)
  } else if (socio.e_menor) {
    doc.addPage()
    let termY = margin

    doc.setFontSize(13)
    doc.setFont('helvetica', 'bold')
    doc.setTextColor(...primaryColor)
    doc.text('TERMO DE AUTORIZAÇÃO DE MENOR DE IDADE', pageWidth / 2, termY, { align: 'center' })
    termY += 12

    doc.setFontSize(9)
    doc.setFont('helvetica', 'normal')
    doc.setTextColor(...grayColor)
    doc.text(`Torcida: ${torcida.nome}`, pageWidth / 2, termY, { align: 'center' })
    termY += 12

    doc.setDrawColor(200, 200, 200)
    doc.line(margin, termY, pageWidth - margin, termY)
    termY += 10

    const formatCPF = (cpf: string | null | undefined) => {
      if (!cpf) return '___________'
      const c = cpf.replace(/\D/g, '')
      return c.length === 11 ? c.replace(/(\d{3})(\d{3})(\d{3})(\d{2})/, '$1.$2.$3-$4') : cpf
    }

    const responsavel = socio.nome_responsavel || '___________________________'
    const cpfResp = formatCPF(socio.cpf_responsavel)
    const nomeMenor = socio.nome_completo
    const cpfMenor = formatCPF(socio.cpf)

    const termoTexto =
      `Eu, ${responsavel}, portador(a) do CPF nº ${cpfResp}, autorizo e apoio a participação ` +
      `do(a) menor de idade ${nomeMenor}, portador(a) do CPF nº ${cpfMenor}, ` +
      `na Torcida Organizada ${torcida.nome}, a partir da data de aprovação deste cadastro.`

    doc.setFontSize(11)
    doc.setFont('helvetica', 'normal')
    doc.setTextColor(30, 30, 30)
    const termoLines = doc.splitTextToSize(termoTexto, pageWidth - margin * 2)
    doc.text(termoLines, margin, termY)
    termY += termoLines.length * 6 + 15

    doc.setFontSize(9)
    doc.setTextColor(...grayColor)
    doc.text('Assinatura do Responsável:', margin, termY)
    termY += 8

    const boxH = 35
    doc.setDrawColor(200, 200, 200)
    doc.rect(margin, termY, (pageWidth - margin * 2) / 2, boxH)

    if (socio.assinatura_url) {
      try {
        const sigBase64 = await imageUrlToBase64(socio.assinatura_url)
        if (sigBase64) {
          doc.addImage(sigBase64, 'PNG', margin + 4, termY + 3, (pageWidth - margin * 2) / 2 - 8, boxH - 6)
        }
      } catch { /* assinatura indisponível */ }
    }

    termY += boxH + 8
    doc.setFontSize(8)
    doc.text(`${responsavel}`, margin, termY)
    doc.setFontSize(7)
    doc.text('Documento gerado automaticamente pelo TorcidaClub', pageWidth / 2, pageHeight - 10, { align: 'center' })
  }

  return doc.output('blob')
}

/**
 * Adiciona uma página com documento/imagem
 */
async function addDocumentPage(
  doc: jsPDF,
  title: string,
  imageUrl: string,
  pageWidth: number,
  pageHeight: number,
  margin: number
): Promise<void> {
  // Título
  doc.setFontSize(14)
  doc.setFont('helvetica', 'bold')
  doc.setTextColor(0, 0, 0)
  doc.text(title, pageWidth / 2, margin, { align: 'center' })

  // Linha divisória
  doc.setLineWidth(0.5)
  doc.line(margin, margin + 5, pageWidth - margin, margin + 5)

  // Imagem
  try {
    const imageBase64 = await imageUrlToBase64(imageUrl)
    if (imageBase64) {
      const imgWidth = pageWidth - 2 * margin
      const imgHeight = pageHeight - 2 * margin - 20 // Espaço para título

      // Detectar formato real da imagem pelo header base64 (evita imagem branca)
      const formatMatch = imageBase64.match(/^data:image\/([a-zA-Z+]+);/)
      const detectedFormat = formatMatch ? formatMatch[1].toUpperCase() : 'JPEG'
      const pdfFormat = detectedFormat === 'JPG' ? 'JPEG' : detectedFormat

      // Centralizar imagem mantendo proporção
      doc.addImage(
        imageBase64,
        pdfFormat,
        margin,
        margin + 15,
        imgWidth,
        imgHeight,
        undefined,
        'MEDIUM'
      )
    } else {
      doc.setFontSize(12)
      doc.setTextColor(150, 150, 150)
      doc.text('Documento não disponível', pageWidth / 2, pageHeight / 2, { align: 'center' })
    }
  } catch {
    doc.setFontSize(12)
    doc.setTextColor(150, 150, 150)
    doc.text('Erro ao carregar documento', pageWidth / 2, pageHeight / 2, { align: 'center' })
  }

  // Rodapé
  doc.setFontSize(7)
  doc.setTextColor(150, 150, 150)
  doc.text('Documento gerado automaticamente pelo TorcidaClub', pageWidth / 2, pageHeight - 10, { align: 'center' })
}

/**
 * Gera o nome do arquivo PDF
 * Formato: {NUMERO_SOCIO}_{NOME_SEM_ESPACOS}.pdf
 */
export function generatePDFFilename(socio: SocioDataForPDF): string {
  const codigo = socio.codigo_referencia || 'PENDENTE'
  const nome = socio.nome_completo
    .normalize('NFD')
    .replace(/[\u0300-\u036f]/g, '') // Remove acentos
    .replace(/[^a-zA-Z0-9]/g, '_') // Substitui caracteres especiais
    .replace(/_+/g, '_') // Remove underscores duplicados
    .toUpperCase()

  return `${codigo}_${nome}.pdf`
}

interface PagamentoRelatorio {
  id: string
  valor_original: number
  status: string
  referencia_mes: string
  data_vencimento: string
  socios?: {
    nome_completo: string
    apelido: string | null
    cpf?: string | null
    e_menor?: boolean | null
    data_nascimento?: string | null
  } | null
}

/**
 * Gera relatório financeiro em PDF com confirmados, pendentes e totalizadores
 */
export async function generateRelatorioFinanceiroPDF(
  pagamentos: PagamentoRelatorio[],
  ingressos: IngressoRelatorio[],
  listaDependentes: { cpf: string }[],
  torcida: TorcidaDataForPDF,
  periodo: string
): Promise<void> {
  const doc = new jsPDF({ orientation: 'portrait', unit: 'mm', format: 'a4' })
  const W = 210
  const margin = 15
  let y = margin

  const cpfsDependentes = new Set(listaDependentes.map(d => d.cpf));

  const pagamentosDependentes = pagamentos.filter(p => 
    p.socios?.cpf && cpfsDependentes.has(p.socios.cpf)
  );
  
  const confirmados = pagamentos.filter(p => 
    p.status === 'confirmado' && 
    !(p.socios?.cpf && cpfsDependentes.has(p.socios.cpf))
  );

  const pendentes = pagamentos.filter(p => 
    ['pendente', 'comprovante_enviado', 'recusado'].includes(p.status) && 
    !(p.socios?.cpf && cpfsDependentes.has(p.socios.cpf))
  );

  // --- Cabeçalho ---
  if (torcida.brasao_url) {
    const logo = await imageUrlToBase64(torcida.brasao_url)
    if (logo) {
      doc.addImage(logo, 'JPEG', margin, y, 20, 20)
    }
  }

  doc.setFontSize(16)
  doc.setFont('helvetica', 'bold')
  doc.text(torcida.nome, margin + 24, y + 8)
  doc.setFontSize(11)
  doc.setFont('helvetica', 'normal')
  doc.text('Relatório Financeiro', margin + 24, y + 15)
  doc.setFontSize(9)
  doc.setTextColor(100)
  doc.text(`Período: ${periodo}`, margin + 24, y + 21)
  doc.text(`Gerado em: ${new Date().toLocaleDateString('pt-BR')}`, W - margin - 50, y + 21)
  doc.setTextColor(0)
  y += 30

  // Linha separadora
  doc.setDrawColor(200)
  doc.line(margin, y, W - margin, y)
  y += 8

  const totalMensalidades = confirmados.reduce((acc, p) => acc + p.valor_original, 0);
  const totalIngressos = ingressos.filter(i => i.status === 'aprovado').reduce((acc, i) => acc + i.valor, 0);
  const totalRealizado = totalMensalidades + totalIngressos;
  const potencialDependentes = pagamentosDependentes.reduce((acc, p) => acc + p.valor_original, 0);

  // --- Resumo ---
  doc.setFontSize(11)
  doc.setFont('helvetica', 'bold')
  doc.text('Resumo', margin, y)
  y += 6

  const resumoItems = [
    ['Total Recebido (Mensalidades):', `R$ ${totalMensalidades.toFixed(2).replace('.', ',')}`],
    ['Total Recebido (Ingressos):', `R$ ${totalIngressos.toFixed(2).replace('.', ',')}`],
    ['TOTAL REALIZADO:', `R$ ${totalRealizado.toFixed(2).replace('.', ',')}`],
  ];

  doc.setFontSize(9)
  doc.setFont('helvetica', 'normal')
  for (const [label, value] of resumoItems) {
    doc.setFont('helvetica', 'bold')
    doc.text(label, margin, y)
    doc.setFont('helvetica', 'normal')
    doc.text(value, margin + 55, y)
    y += 5
  }
  y += 6

  // Função auxiliar para renderizar tabela
  const renderTable = (
    title: string,
    rows: PagamentoRelatorio[],
    color: [number, number, number]
  ) => {
    if (rows.length === 0) return

    if (y > 250) { doc.addPage(); y = margin }

    doc.setFontSize(11)
    doc.setFont('helvetica', 'bold')
    doc.setTextColor(color[0], color[1], color[2])
    doc.text(`${title} (${rows.length})`, margin, y)
    doc.setTextColor(0)
    y += 5

    // Header da tabela
    doc.setFontSize(8)
    doc.setFillColor(240, 240, 240)
    doc.rect(margin, y, W - margin * 2, 6, 'F')
    doc.setFont('helvetica', 'bold')
    doc.text('Sócio', margin + 2, y + 4)
    doc.text('Referência', margin + 80, y + 4)
    doc.text('Vencimento', margin + 120, y + 4)
    doc.text('Valor', margin + 158, y + 4)
    y += 7

    doc.setFont('helvetica', 'normal')
    for (const p of rows) {
      if (y > 270) { doc.addPage(); y = margin }

      const nome = (p.socios?.nome_completo || p.socios?.apelido || '-').substring(0, 35)
      const ref = formatDate(p.referencia_mes + '-01').substring(3) // MM/YYYY
      const venc = formatDate(p.data_vencimento)
      const valor = `R$ ${p.valor_original.toFixed(2).replace('.', ',')}`

      doc.setFontSize(8)
      doc.text(nome, margin + 2, y)
      doc.text(ref, margin + 80, y)
      doc.text(venc, margin + 120, y)
      doc.text(valor, margin + 158, y)
      y += 5

      // Linha separadora leve
      doc.setDrawColor(230)
      doc.line(margin, y, W - margin, y)
      y += 1
    }
    y += 6
  }

  const ingressosAprovados = ingressos.filter(i => i.status === 'aprovado');
  const ingressosParaTabela: PagamentoRelatorio[] = ingressosAprovados.map(i => ({
    id: i.id, 
    valor_original: Number(i.valor),
    status: 'confirmado',
    referencia_mes: 'Venda Avulsa',
    data_vencimento: i.created_at ? i.created_at.split('T')[0] : '',
    socios: { 
      nome_completo: i.socios?.nome_completo || 'Compra Avulsa', 
      apelido: null
    }
  }));

  renderTable('Pagamentos Confirmados', confirmados, [34, 139, 34])
  renderTable('Venda de Ingressos', ingressosParaTabela, [0, 100, 200]);
  renderTable('Pagamentos Pendentes / Em Análise', pendentes, [200, 100, 0])

  doc.setFontSize(10);
  doc.setFont('helvetica', 'bold');
  doc.text('ANÁLISE DE POTENCIAL (DEPENDENTES)', margin, y + 10);
  doc.setFont('helvetica', 'normal');
  doc.text(`Existem ${pagamentosDependentes.length} dependentes com registro de cobrança.`, margin, y + 16);
  doc.text(`Valor projetado: R$ ${potencialDependentes.toFixed(2).replace('.', ',')}`, margin, y + 22);


  // Rodapé
  const totalPages = doc.getNumberOfPages()
  for (let i = 1; i <= totalPages; i++) {
    doc.setPage(i)
    doc.setFontSize(7)
    doc.setTextColor(150)
    doc.text(`${torcida.nome} — Relatório Financeiro — ${periodo}`, margin, 292)
    doc.text(`Página ${i} de ${totalPages}`, W - margin - 20, 292)
    doc.setTextColor(0)
  }

  const filename = `relatorio_financeiro_${periodo.replace(/\//g, '-')}.pdf`
  doc.save(filename)
}
