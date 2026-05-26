import { NextRequest, NextResponse } from 'next/server'
import { supabaseAdmin } from '@/lib/supabase/admin'
import { LIMITES_UPLOAD } from '@/lib/utils/constants'

/**
 * API Route para upload de arquivos no Supabase Storage
 * POST /api/upload
 *
 * Body: FormData
 * - file: File (imagem ou PDF)
 * - bucket: string (tipo de arquivo)
 * - folder?: string (pasta opcional)
 */

export async function POST(request: NextRequest) {
  try {
    // Pegar FormData
    const formData = await request.formData()
    const file = formData.get('file') as File
    const bucket = formData.get('bucket') as string
    const folder = formData.get('folder') as string | null

    // Validações básicas
    if (!file) {
      return NextResponse.json(
        { error: 'Arquivo não fornecido' },
        { status: 400 }
      )
    }

    if (!bucket) {
      return NextResponse.json(
        { error: 'Bucket não especificado' },
        { status: 400 }
      )
    }

    // Determinar limites baseado no tipo
    let limites
    if (file.type.startsWith('image/')) {
      limites = LIMITES_UPLOAD.IMAGEM
    } else if (file.type === 'application/pdf') {
      limites = LIMITES_UPLOAD.PDF
    } else {
      return NextResponse.json(
        { error: 'Tipo de arquivo não suportado' },
        { status: 400 }
      )
    }

    // Validar tipo
    const tiposPermitidos = limites.TIPOS as readonly string[]
    if (!tiposPermitidos.includes(file.type)) {
      return NextResponse.json(
        {
          error: `Tipo de arquivo inválido. Aceitos: ${limites.TIPOS.join(', ')}`
        },
        { status: 400 }
      )
    }

    // Validar tamanho
    if (file.size > limites.TAMANHO_MAX) {
      return NextResponse.json(
        {
          error: `Arquivo muito grande. Tamanho máximo: ${limites.TAMANHO_MAX_LABEL}`
        },
        { status: 400 }
      )
    }

    // Verificar se bucket existe antes do upload (requer service role)
    const { error: bucketError } = await supabaseAdmin.storage.getBucket(bucket)
    if (bucketError) {
      return NextResponse.json(
        { error: `Bucket '${bucket}' não encontrado. Verifique as configurações do Storage no Supabase.` },
        { status: 400 }
      )
    }

    // Verificar autenticação (opcional - pode ser público para cadastro)
    // const { data: { user }, error: authError } = await supabase.auth.getUser()
    // if (authError || !user) {
    //   return NextResponse.json({ error: 'Não autenticado' }, { status: 401 })
    // }

    // Gerar nome único para o arquivo
    const timestamp = Date.now()
    const randomString = Math.random().toString(36).substring(2, 15)
    const fileExt = file.name.split('.').pop()
    const fileName = `${timestamp}-${randomString}.${fileExt}`

    // Determinar caminho completo
    const filePath = folder ? `${folder}/${fileName}` : fileName

    // Converter File para ArrayBuffer e depois para Buffer
    const arrayBuffer = await file.arrayBuffer()
    const buffer = Buffer.from(arrayBuffer)

    // Upload para Supabase Storage (requer service role)
    const { data, error } = await supabaseAdmin.storage
      .from(bucket)
      .upload(filePath, buffer, {
        contentType: file.type,
        cacheControl: '3600',
        upsert: false,
      })

    if (error) {
      console.error('Erro ao fazer upload:', error)
      return NextResponse.json(
        { error: `Erro no Storage: ${error.message}` },
        { status: 500 }
      )
    }

    // Gerar URL pública
    const { data: urlData } = supabaseAdmin.storage
      .from(bucket)
      .getPublicUrl(data.path)

    return NextResponse.json({
      success: true,
      url: urlData.publicUrl,
      path: data.path,
      bucket: bucket,
    })
  } catch (error) {
    console.error('Erro no upload:', error)
    return NextResponse.json(
      { error: 'Erro interno do servidor' },
      { status: 500 }
    )
  }
}
