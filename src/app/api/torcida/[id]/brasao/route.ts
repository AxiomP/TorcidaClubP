import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '@/lib/supabase/server'
import { supabaseAdmin } from '@/lib/supabase/admin'

/**
 * API: Upload do Brasão da Torcida
 * POST /api/torcida/[id]/brasao - Upload de imagem do brasão
 */

interface RouteParams {
  params: Promise<{ id: string }>
}

// Tipos de arquivo permitidos
const ALLOWED_TYPES = ['image/jpeg', 'image/png', 'image/webp', 'image/svg+xml']
const MAX_FILE_SIZE = 5 * 1024 * 1024 // 5MB

export async function POST(request: NextRequest, { params }: RouteParams) {
  try {
    const { id } = await params
    const supabase = await createClient()

    // Verificar autenticação
    const { data: { user }, error: authError } = await supabase.auth.getUser()
    if (authError || !user) {
      return NextResponse.json(
        { error: 'Não autorizado' },
        { status: 401 }
      )
    }

    // Verificar se o gestor tem acesso a esta torcida
    const { data: gestor, error: gestorError } = await supabaseAdmin
      .from('gestores')
      .select('torcida_id, role')
      .eq('auth_user_id', user.id)
      .single()

    if (gestorError || !gestor) {
      return NextResponse.json(
        { error: 'Gestor não encontrado' },
        { status: 404 }
      )
    }

    if (gestor.torcida_id !== id) {
      return NextResponse.json(
        { error: 'Sem permissão para editar esta torcida' },
        { status: 403 }
      )
    }

    // Apenas admin pode editar configurações
    if (gestor.role !== 'admin') {
      return NextResponse.json(
        { error: 'Apenas administradores podem alterar o brasão' },
        { status: 403 }
      )
    }

    // Parse form data
    const formData = await request.formData()
    const file = formData.get('file') as File | null

    if (!file) {
      return NextResponse.json(
        { error: 'Nenhum arquivo enviado' },
        { status: 400 }
      )
    }

    // Validar tipo de arquivo
    if (!ALLOWED_TYPES.includes(file.type)) {
      return NextResponse.json(
        { error: 'Tipo de arquivo não permitido. Use JPG, PNG, WebP ou SVG.' },
        { status: 400 }
      )
    }

    // Validar tamanho do arquivo
    if (file.size > MAX_FILE_SIZE) {
      return NextResponse.json(
        { error: 'Arquivo muito grande. Tamanho máximo: 5MB' },
        { status: 400 }
      )
    }

    // Gerar nome único para o arquivo
    const fileExt = file.name.split('.').pop() || 'png'
    const fileName = `${id}/brasao_${Date.now()}.${fileExt}`

    // Garantir que o bucket 'brasoes' existe e é público
    const { error: createBucketError } = await supabaseAdmin.storage.createBucket('brasoes', {
      public: true,
      allowedMimeTypes: ['image/jpeg', 'image/png', 'image/webp', 'image/svg+xml'],
      fileSizeLimit: 5 * 1024 * 1024,
    })

    if (createBucketError) {
      const jaExiste =
        createBucketError.message?.toLowerCase().includes('already exists') ||
        createBucketError.message?.toLowerCase().includes('duplicate')

      if (jaExiste) {
        const { error: updateBucketError } = await supabaseAdmin.storage
          .updateBucket('brasoes', { public: true })
        if (updateBucketError) {
          console.error('[brasao] Falha ao atualizar bucket para público:', updateBucketError)
        }
      } else {
        console.error('[brasao] Erro inesperado ao criar bucket:', createBucketError)
      }
    }

    // Converter File para ArrayBuffer e depois para Uint8Array
    const arrayBuffer = await file.arrayBuffer()
    const fileBuffer = new Uint8Array(arrayBuffer)

    // Upload para Supabase Storage (requer service role)
    const { error: uploadError } = await supabaseAdmin.storage
      .from('brasoes')
      .upload(fileName, fileBuffer, {
        contentType: file.type,
        upsert: true,
      })

    if (uploadError) {
      console.error('Erro no upload:', uploadError)
      return NextResponse.json(
        { error: `Erro no Storage: ${uploadError.message}` },
        { status: 500 }
      )
    }

    // Obter URL pública
    const { data: publicUrlData } = supabaseAdmin.storage
      .from('brasoes')
      .getPublicUrl(fileName)

    const brasaoUrl = publicUrlData.publicUrl

    // Atualizar URL do brasão na torcida (requer service role para bypass RLS)
    const { error: updateError } = await supabaseAdmin
      .from('torcidas')
      .update({
        brasao_url: brasaoUrl,
        updated_at: new Date().toISOString(),
      })
      .eq('id', id)

    if (updateError) {
      console.error('Erro ao atualizar brasão:', updateError)
      return NextResponse.json(
        { error: 'Erro ao salvar URL do brasão' },
        { status: 500 }
      )
    }

    return NextResponse.json({
      message: 'Brasão atualizado com sucesso',
      url: brasaoUrl,
    })
  } catch (error) {
    console.error('Erro na API upload brasão:', error)
    return NextResponse.json(
      { error: 'Erro interno do servidor' },
      { status: 500 }
    )
  }
}
