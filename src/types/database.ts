export type Json =
  | string
  | number
  | boolean
  | null
  | { [key: string]: Json | undefined }
  | Json[]

export interface Database {
  public: {
    Tables: {
      torcidas: {
        Row: {
          id: string
          nome: string
          slug: string
          endereco_sede: string | null
          presidente: string | null
          vice_presidente: string | null
          brasao_url: string | null
          cor_fundo: string
          frase_efeito: string | null
          chave_pix: string | null
          dia_vencimento_mensalidade: number
          idade_min_pagamento: number
          idade_min_compra_ingresso: number
          whatsapp_grupo: string | null
          politica_privacidade: string | null
          termos_uso: string | null
          termos_compra_ingresso: string | null
          status: 'pendente' | 'ativo' | 'suspenso' | 'cancelado'
          plano: 'basico' | 'profissional' | 'empresarial'
          valor_adicional_dependente: number
          quem_somos: string | null
          telefone: string | null
          mensagem_bloqueio: string | null
          created_at: string
          updated_at: string
        }
        Insert: {
          id?: string
          nome: string
          slug: string
          endereco_sede?: string | null
          presidente?: string | null
          vice_presidente?: string | null
          brasao_url?: string | null
          cor_fundo?: string
          frase_efeito?: string | null
          chave_pix?: string | null
          dia_vencimento_mensalidade?: number
          idade_min_pagamento?: number
          idade_min_compra_ingresso?: number
          whatsapp_grupo?: string | null
          politica_privacidade?: string | null
          termos_uso?: string | null
          termos_compra_ingresso?: string | null
          status?: 'pendente' | 'ativo' | 'suspenso' | 'cancelado'
          plano?: 'basico' | 'profissional' | 'empresarial'
          valor_adicional_dependente?: number
          quem_somos?: string | null
          telefone?: string | null
          mensagem_bloqueio?: string | null
          created_at?: string
          updated_at?: string
        }
        Update: {
          id?: string
          nome?: string
          slug?: string
          endereco_sede?: string | null
          presidente?: string | null
          vice_presidente?: string | null
          brasao_url?: string | null
          cor_fundo?: string
          frase_efeito?: string | null
          chave_pix?: string | null
          dia_vencimento_mensalidade?: number
          idade_min_pagamento?: number
          idade_min_compra_ingresso?: number
          whatsapp_grupo?: string | null
          politica_privacidade?: string | null
          termos_uso?: string | null
          termos_compra_ingresso?: string | null
          status?: 'pendente' | 'ativo' | 'suspenso' | 'cancelado'
          plano?: 'basico' | 'profissional' | 'empresarial'
          valor_adicional_dependente?: number
          quem_somos?: string | null
          telefone?: string | null
          mensagem_bloqueio?: string | null
          created_at?: string
          updated_at?: string
        }
        Relationships: []
      }
      gestores: {
        Row: {
          id: string
          torcida_id: string | null
          auth_user_id: string
          email: string
          nome_completo: string
          google_id: string | null
          role: 'gestor' | 'admin' | 'operador'
          permissoes: Json
          ativo: boolean
          created_at: string
          last_login: string | null
          asaas_customer_id: string | null
          asaas_payment_id: string | null
          asaas_pix_auth_id: string | null
          assinatura_status: 'pendente' | 'ativa' | 'vencida' | null
          assinatura_validade: string | null
          telefone: string | null
        }
        Insert: {
          id?: string
          torcida_id?: string | null
          auth_user_id: string
          email: string
          nome_completo: string
          google_id?: string | null
          role?: 'gestor' | 'admin' | 'operador'
          permissoes?: Json
          ativo?: boolean
          created_at?: string
          last_login?: string | null
          asaas_customer_id?: string | null
          asaas_payment_id?: string | null
          asaas_pix_auth_id?: string | null
          assinatura_status?: 'pendente' | 'ativa' | 'vencida' | null
          assinatura_validade?: string | null
          telefone?: string | null
        }
        Update: {
          id?: string
          torcida_id?: string | null
          auth_user_id?: string
          email?: string
          nome_completo?: string
          google_id?: string | null
          role?: 'gestor' | 'admin' | 'operador'
          permissoes?: Json
          ativo?: boolean
          created_at?: string
          last_login?: string | null
          asaas_customer_id?: string | null
          asaas_payment_id?: string | null
          asaas_pix_auth_id?: string | null
          assinatura_status?: 'pendente' | 'ativa' | 'vencida' | null
          assinatura_validade?: string | null
          telefone?: string | null
        }
        Relationships: []
      }
      tipos_mensalidade: {
        Row: {
          id: string
          torcida_id: string
          nome: string
          valor: number
          permite_dependentes: boolean
          qtd_max_dependentes: number | null
          permite_ingressos_adicionais: boolean
          qtd_max_ingressos_adicionais: number | null
          beneficios: Json
          ativo: boolean
          ordem: number
          created_at: string
          updated_at: string
        }
        Insert: {
          id?: string
          torcida_id: string
          nome: string
          valor: number
          permite_dependentes?: boolean
          qtd_max_dependentes?: number | null
          permite_ingressos_adicionais?: boolean
          qtd_max_ingressos_adicionais?: number | null
          beneficios?: Json
          ativo?: boolean
          ordem?: number
          created_at?: string
          updated_at?: string
        }
        Update: {
          id?: string
          torcida_id?: string
          nome?: string
          valor?: number
          permite_dependentes?: boolean
          qtd_max_dependentes?: number | null
          permite_ingressos_adicionais?: boolean
          qtd_max_ingressos_adicionais?: number | null
          beneficios?: Json
          ativo?: boolean
          ordem?: number
          created_at?: string
          updated_at?: string
        }
        Relationships: []
      }
      socios: {
        Row: {
          id: string
          torcida_id: string
          tipo_mensalidade_id: string | null
          auth_user_id: string | null
          cpf: string
          nome_completo: string
          apelido: string | null
          email: string
          data_nascimento: string
          genero: string | null
          whatsapp: string
          endereco_completo: string
          cidade: string
          estado: string
          doc_identificacao_url: string | null
          comprovante_endereco_url: string | null
          selfie_url: string | null
          assinatura_url: string | null
          status: 'pendente' | 'ativo' | 'inadimplente' | 'bloqueado' | 'cancelado' | 'rejeitado'
          membro_desde: string | null
          data_ultimo_pagamento: string | null
          data_proximo_pagamento: string | null
          meses_pendentes: number
          valor_divida_total: number
          created_at: string
          updated_at: string
          // Campos adicionais para importação
          bairro: string | null
          profissao: string | null
          nome_mae: string | null
          nome_pai: string | null
          contato_emergencia_telefone: string | null
          alergias: string | null
          origem: string | null
          importado: boolean
          data_importacao: string | null
          // Campos adicionais para cadastro completo
          escolaridade: string | null
          numero: string | null
          complemento: string | null
          cep: string | null
          contato_emergencia_nome: string | null
          contato_emergencia_parentesco: string | null
          descricao_necessidades: string | null
          medicacao_detalhes: string | null
          tipo_documento: string | null
          tipo_comprovante: string | null
          senha_hash: string | null
          e_menor: boolean
          cpf_responsavel: string | null
          nome_responsavel: string | null
          documento_responsavel_url: string | null
          termo_menoridade_url: string | null
          data_cadastro: string | null
          data_aprovacao: string | null
          aprovado_por: string | null
          motivo_rejeicao: string | null
          data_rejeicao: string | null
          rejeitado_por: string | null
          bloqueado_em: string | null
          codigo_referencia: string | null
          // Novos campos - Tarefas 12 e 13
          estado_civil: string | null
          numero_rg: string | null
          rede_social: string | null
          doc_frente_url: string | null
          doc_verso_url: string | null
          // Soft-delete
          deleted_at: string | null
          // Ranking do sócio
          ranking: 'bronze' | 'prata' | 'ouro'
          // Campos de saúde
          necessidades_especiais: boolean
          usa_medicacao: boolean
          // Primeiro acesso do sócio
          primeiro_acesso_feito: boolean | null
        }
        Insert: {
          id?: string
          torcida_id: string
          tipo_mensalidade_id?: string | null
          auth_user_id?: string | null
          cpf: string
          nome_completo: string
          apelido?: string | null
          email: string
          data_nascimento: string
          genero?: string | null
          whatsapp: string
          endereco_completo: string
          cidade: string
          estado: string
          doc_identificacao_url?: string | null
          comprovante_endereco_url?: string | null
          selfie_url?: string | null
          assinatura_url?: string | null
          status?: 'pendente' | 'ativo' | 'inadimplente' | 'bloqueado' | 'cancelado' | 'rejeitado'
          membro_desde?: string | null
          data_ultimo_pagamento?: string | null
          data_proximo_pagamento?: string | null
          meses_pendentes?: number
          valor_divida_total?: number
          created_at?: string
          updated_at?: string
          // Campos adicionais para importação
          bairro?: string | null
          profissao?: string | null
          nome_mae?: string | null
          nome_pai?: string | null
          contato_emergencia_telefone?: string | null
          alergias?: string | null
          origem?: string | null
          importado?: boolean
          data_importacao?: string | null
          // Campos adicionais para cadastro completo
          escolaridade?: string | null
          numero?: string | null
          complemento?: string | null
          cep?: string | null
          contato_emergencia_nome?: string | null
          contato_emergencia_parentesco?: string | null
          descricao_necessidades?: string | null
          medicacao_detalhes?: string | null
          tipo_documento?: string | null
          tipo_comprovante?: string | null
          senha_hash?: string | null
          e_menor?: boolean
          cpf_responsavel?: string | null
          nome_responsavel?: string | null
          documento_responsavel_url?: string | null
          termo_menoridade_url?: string | null
          data_cadastro?: string | null
          data_aprovacao?: string | null
          aprovado_por?: string | null
          motivo_rejeicao?: string | null
          data_rejeicao?: string | null
          rejeitado_por?: string | null
          bloqueado_em?: string | null
          codigo_referencia?: string | null
          // Novos campos - Tarefas 12 e 13
          estado_civil?: string | null
          numero_rg?: string | null
          rede_social?: string | null
          doc_frente_url?: string | null
          doc_verso_url?: string | null
          // Soft-delete
          deleted_at?: string | null
          // Ranking do sócio
          ranking?: 'bronze' | 'prata' | 'ouro'
          // Campos de saúde
          necessidades_especiais?: boolean
          usa_medicacao?: boolean
          // Primeiro acesso do sócio
          primeiro_acesso_feito?: boolean | null
        }
        Update: {
          id?: string
          torcida_id?: string
          tipo_mensalidade_id?: string | null
          auth_user_id?: string | null
          cpf?: string
          nome_completo?: string
          apelido?: string | null
          email?: string
          data_nascimento?: string
          genero?: string | null
          whatsapp?: string
          endereco_completo?: string
          cidade?: string
          estado?: string
          doc_identificacao_url?: string | null
          comprovante_endereco_url?: string | null
          selfie_url?: string | null
          assinatura_url?: string | null
          status?: 'pendente' | 'ativo' | 'inadimplente' | 'bloqueado' | 'cancelado' | 'rejeitado'
          membro_desde?: string | null
          data_ultimo_pagamento?: string | null
          data_proximo_pagamento?: string | null
          meses_pendentes?: number
          valor_divida_total?: number
          created_at?: string
          updated_at?: string
          // Campos adicionais para importação
          bairro?: string | null
          profissao?: string | null
          nome_mae?: string | null
          nome_pai?: string | null
          contato_emergencia_telefone?: string | null
          alergias?: string | null
          origem?: string | null
          importado?: boolean
          data_importacao?: string | null
          // Campos adicionais para cadastro completo
          escolaridade?: string | null
          numero?: string | null
          complemento?: string | null
          cep?: string | null
          contato_emergencia_nome?: string | null
          contato_emergencia_parentesco?: string | null
          descricao_necessidades?: string | null
          medicacao_detalhes?: string | null
          tipo_documento?: string | null
          tipo_comprovante?: string | null
          senha_hash?: string | null
          e_menor?: boolean
          cpf_responsavel?: string | null
          nome_responsavel?: string | null
          documento_responsavel_url?: string | null
          termo_menoridade_url?: string | null
          data_cadastro?: string | null
          data_aprovacao?: string | null
          aprovado_por?: string | null
          motivo_rejeicao?: string | null
          data_rejeicao?: string | null
          rejeitado_por?: string | null
          bloqueado_em?: string | null
          codigo_referencia?: string | null
          // Novos campos - Tarefas 12 e 13
          estado_civil?: string | null
          numero_rg?: string | null
          rede_social?: string | null
          doc_frente_url?: string | null
          doc_verso_url?: string | null
          // Soft-delete
          deleted_at?: string | null
          // Ranking do sócio
          ranking?: 'bronze' | 'prata' | 'ouro'
          // Campos de saúde
          necessidades_especiais?: boolean
          usa_medicacao?: boolean
          // Primeiro acesso do sócio
          primeiro_acesso_feito?: boolean | null
        }
        Relationships: []
      }
      dependentes: {
        Row: {
          id: string
          socio_titular_id: string
          torcida_id: string
          cpf: string
          nome_completo: string
          data_nascimento: string
          e_menor: boolean
          cpf_responsavel: string | null
          termo_menoridade_url: string | null
          doc_identificacao_url: string | null
          selfie_url: string | null
          status: 'ativo' | 'inativo' | 'cancelado'
          auth_user_id: string | null
          email: string | null
          token_ativacao: string | null
          token_expiracao: string | null
          deleted_at: string | null
          created_at: string
        }
        Insert: {
          id?: string
          socio_titular_id: string
          torcida_id: string
          cpf: string
          nome_completo: string
          data_nascimento: string
          e_menor?: boolean
          cpf_responsavel?: string | null
          termo_menoridade_url?: string | null
          doc_identificacao_url?: string | null
          selfie_url?: string | null
          status?: 'ativo' | 'inativo' | 'cancelado'
          auth_user_id?: string | null
          email?: string | null
          token_ativacao?: string | null
          token_expiracao?: string | null
          deleted_at?: string | null
          created_at?: string
        }
        Update: {
          id?: string
          socio_titular_id?: string
          torcida_id?: string
          cpf?: string
          nome_completo?: string
          data_nascimento?: string
          e_menor?: boolean
          cpf_responsavel?: string | null
          termo_menoridade_url?: string | null
          doc_identificacao_url?: string | null
          selfie_url?: string | null
          status?: 'ativo' | 'inativo' | 'cancelado'
          auth_user_id?: string | null
          email?: string | null
          token_ativacao?: string | null
          token_expiracao?: string | null
          deleted_at?: string | null
          created_at?: string
        }
        Relationships: []
      }
      pagamentos: {
        Row: {
          id: string
          socio_id: string
          torcida_id: string
          tipo_mensalidade_id: string | null
          referencia_mes: string
          valor_original: number
          valor_pago: number | null
          valor_perdoado: number
          data_vencimento: string
          data_pagamento: string | null
          data_confirmacao: string | null
          comprovante_url: string | null
          status: 'pendente' | 'comprovante_enviado' | 'confirmado' | 'recusado' | 'perdoado'
          lembrete_7_dias_enviado: boolean
          lembrete_3_dias_enviado: boolean
          lembrete_dia_enviado: boolean
          confirmado_por: string | null
          motivo_recusa: string | null
          observacao: string | null
          deleted_at: string | null
          created_at: string
          updated_at: string
        }
        Insert: {
          id?: string
          socio_id: string
          torcida_id: string
          tipo_mensalidade_id?: string | null
          referencia_mes: string
          valor_original: number
          valor_pago?: number | null
          valor_perdoado?: number
          data_vencimento: string
          data_pagamento?: string | null
          data_confirmacao?: string | null
          comprovante_url?: string | null
          status?: 'pendente' | 'comprovante_enviado' | 'confirmado' | 'recusado' | 'perdoado'
          lembrete_7_dias_enviado?: boolean
          lembrete_3_dias_enviado?: boolean
          lembrete_dia_enviado?: boolean
          confirmado_por?: string | null
          motivo_recusa?: string | null
          observacao?: string | null
          deleted_at?: string | null
          created_at?: string
          updated_at?: string
        }
        Update: {
          id?: string
          socio_id?: string
          torcida_id?: string
          tipo_mensalidade_id?: string | null
          referencia_mes?: string
          valor_original?: number
          valor_pago?: number | null
          valor_perdoado?: number
          data_vencimento?: string
          data_pagamento?: string | null
          data_confirmacao?: string | null
          comprovante_url?: string | null
          status?: 'pendente' | 'comprovante_enviado' | 'confirmado' | 'recusado' | 'perdoado'
          lembrete_7_dias_enviado?: boolean
          lembrete_3_dias_enviado?: boolean
          lembrete_dia_enviado?: boolean
          confirmado_por?: string | null
          motivo_recusa?: string | null
          observacao?: string | null
          deleted_at?: string | null
          created_at?: string
          updated_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "pagamentos_socio_id_fkey"
            columns: ["socio_id"]
            isOneToOne: false
            referencedRelation: "socios"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "pagamentos_torcida_id_fkey"
            columns: ["torcida_id"]
            isOneToOne: false
            referencedRelation: "torcidas"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "pagamentos_tipo_mensalidade_id_fkey"
            columns: ["tipo_mensalidade_id"]
            isOneToOne: false
            referencedRelation: "tipos_mensalidade"
            referencedColumns: ["id"]
          }
        ]
      }
      eventos: {
        Row: {
          id: string
          torcida_id: string
          nome_evento: string
          time_casa: string | null
          time_visitante: string | null
          local: string
          data_hora: string
          qtd_ingressos_total: number
          qtd_ingressos_vendidos: number
          qtd_ingressos_disponiveis: number | null
          valor_socio: number | null
          valor_dependente: number | null
          valor_adicional: number | null
          data_fim_vendas: string
          pagar_ate: string
          status: 'ativo' | 'encerrado' | 'cancelado'
          created_at: string
          updated_at: string
          ranking_minimo: 'bronze' | 'prata' | 'ouro' | null
          permite_dependentes: boolean
          permite_adicionais: boolean
        }
        Insert: {
          id?: string
          torcida_id: string
          nome_evento: string
          time_casa?: string | null
          time_visitante?: string | null
          local: string
          data_hora: string
          qtd_ingressos_total: number
          qtd_ingressos_vendidos?: number
          qtd_ingressos_disponiveis?: number | null
          valor_socio?: number | null
          valor_dependente?: number | null
          valor_adicional?: number | null
          data_fim_vendas: string
          pagar_ate: string
          status?: 'ativo' | 'encerrado' | 'cancelado'
          created_at?: string
          updated_at?: string
          ranking_minimo?: 'bronze' | 'prata' | 'ouro' | null
          permite_dependentes?: boolean
          permite_adicionais?: boolean
        }
        Update: {
          id?: string
          torcida_id?: string
          nome_evento?: string
          time_casa?: string | null
          time_visitante?: string | null
          local?: string
          data_hora?: string
          qtd_ingressos_total?: number
          qtd_ingressos_vendidos?: number
          qtd_ingressos_disponiveis?: number | null
          valor_socio?: number | null
          valor_dependente?: number | null
          valor_adicional?: number | null
          data_fim_vendas?: string
          pagar_ate?: string
          status?: 'ativo' | 'encerrado' | 'cancelado'
          created_at?: string
          updated_at?: string
          ranking_minimo?: 'bronze' | 'prata' | 'ouro' | null
          permite_dependentes?: boolean
          permite_adicionais?: boolean
        }
        Relationships: []
      }
      compras_ingressos: {
        Row: {
          id: string
          evento_id: string
          socio_id: string
          dependente_id: string | null
          tipo_ingresso: 'socio' | 'dependente' | 'adicional'
          valor: number
          comprovante_url: string | null
          status: 'pendente' | 'comprovante_enviado' | 'aprovado' | 'recusado' | 'usado'
          codigo_validacao: string | null
          qr_code_url: string | null
          usado_em: string | null
          aprovado_por: string | null
          nome_adicional: string | null
          cpf_adicional: string | null
          created_at: string
        }
        Insert: {
          id?: string
          evento_id: string
          socio_id: string
          dependente_id?: string | null
          tipo_ingresso: 'socio' | 'dependente' | 'adicional'
          valor: number
          comprovante_url?: string | null
          status?: 'pendente' | 'comprovante_enviado' | 'aprovado' | 'recusado' | 'usado'
          codigo_validacao?: string | null
          qr_code_url?: string | null
          usado_em?: string | null
          aprovado_por?: string | null
          nome_adicional?: string | null
          cpf_adicional?: string | null
          created_at?: string
        }
        Update: {
          id?: string
          evento_id?: string
          socio_id?: string
          dependente_id?: string | null
          tipo_ingresso?: 'socio' | 'dependente' | 'adicional'
          valor?: number
          comprovante_url?: string | null
          status?: 'pendente' | 'comprovante_enviado' | 'aprovado' | 'recusado' | 'usado'
          codigo_validacao?: string | null
          qr_code_url?: string | null
          usado_em?: string | null
          aprovado_por?: string | null
          nome_adicional?: string | null
          cpf_adicional?: string | null
          created_at?: string
        }
        Relationships: []
      }
      beneficios: {
        Row: {
          id: string
          torcida_id: string
          titulo: string
          descricao: string
          icone: string | null
          ordem: number
          ativo: boolean
          created_at: string
        }
        Insert: {
          id?: string
          torcida_id: string
          titulo: string
          descricao: string
          icone?: string | null
          ordem?: number
          ativo?: boolean
          created_at?: string
        }
        Update: {
          id?: string
          torcida_id?: string
          titulo?: string
          descricao?: string
          icone?: string | null
          ordem?: number
          ativo?: boolean
          created_at?: string
        }
        Relationships: []
      }
      links: {
        Row: {
          id: string
          torcida_id: string
          titulo: string
          url: string
          icone: string | null
          ordem: number
          ativo: boolean
          created_at: string
        }
        Insert: {
          id?: string
          torcida_id: string
          titulo: string
          url: string
          icone?: string | null
          ordem?: number
          ativo?: boolean
          created_at?: string
        }
        Update: {
          id?: string
          torcida_id?: string
          titulo?: string
          url?: string
          icone?: string | null
          ordem?: number
          ativo?: boolean
          created_at?: string
        }
        Relationships: []
      }
      notificacoes: {
        Row: {
          id: string
          socio_id: string
          torcida_id: string | null
          tipo: 'lembrete_pagamento' | 'pagamento_confirmado' | 'ingresso_aprovado' | 'bloqueio' | 'geral'
          titulo: string
          mensagem: string
          canal: 'whatsapp' | 'email' | 'sistema'
          enviado: boolean
          enviado_em: string | null
          erro: string | null
          created_at: string
        }
        Insert: {
          id?: string
          socio_id: string
          torcida_id?: string | null
          tipo: 'lembrete_pagamento' | 'pagamento_confirmado' | 'ingresso_aprovado' | 'bloqueio' | 'geral'
          titulo: string
          mensagem: string
          canal: 'whatsapp' | 'email' | 'sistema'
          enviado?: boolean
          enviado_em?: string | null
          erro?: string | null
          created_at?: string
        }
        Update: {
          id?: string
          socio_id?: string
          torcida_id?: string | null
          tipo?: 'lembrete_pagamento' | 'pagamento_confirmado' | 'ingresso_aprovado' | 'bloqueio' | 'geral'
          titulo?: string
          mensagem?: string
          canal?: 'whatsapp' | 'email' | 'sistema'
          enviado?: boolean
          enviado_em?: string | null
          erro?: string | null
          created_at?: string
        }
        Relationships: []
      }
      auditoria: {
        Row: {
          id: string
          usuario_id: string | null
          usuario_tipo: 'gestor' | 'socio' | 'sistema' | 'publico' | null
          torcida_id: string | null
          acao: string
          entidade: string | null
          entidade_id: string | null
          dados_anteriores: Json | null
          dados_novos: Json | null
          ip_address: string | null
          user_agent: string | null
          created_at: string
        }
        Insert: {
          id?: string
          usuario_id?: string | null
          usuario_tipo?: 'gestor' | 'socio' | 'sistema' | 'publico' | null
          torcida_id?: string | null
          acao: string
          entidade?: string | null
          entidade_id?: string | null
          dados_anteriores?: Json | null
          dados_novos?: Json | null
          ip_address?: string | null
          user_agent?: string | null
          created_at?: string
        }
        Update: {
          id?: string
          usuario_id?: string | null
          usuario_tipo?: 'gestor' | 'socio' | 'sistema' | 'publico' | null
          torcida_id?: string | null
          acao?: string
          entidade?: string | null
          entidade_id?: string | null
          dados_anteriores?: Json | null
          dados_novos?: Json | null
          ip_address?: string | null
          user_agent?: string | null
          created_at?: string
        }
        Relationships: []
      }
      cpf_bloqueados: {
        Row: {
          id: string
          cpf: string
          motivo: string | null
          ativo: boolean
          criado_por: string | null
          created_at: string
        }
        Insert: {
          id?: string
          cpf: string
          motivo?: string | null
          ativo?: boolean
          criado_por?: string | null
          created_at?: string
        }
        Update: {
          id?: string
          cpf?: string
          motivo?: string | null
          ativo?: boolean
          criado_por?: string | null
          created_at?: string
        }
        Relationships: []
      }
      funcoes_socio: {
        Row: {
          id: string
          torcida_id: string
          titulo: string
          descricao: string | null
          icone: string | null
          ordem: number
          ativo: boolean
          created_at: string
        }
        Insert: {
          id?: string
          torcida_id: string
          titulo: string
          descricao?: string | null
          icone?: string | null
          ordem?: number
          ativo?: boolean
          created_at?: string
        }
        Update: {
          id?: string
          torcida_id?: string
          titulo?: string
          descricao?: string | null
          icone?: string | null
          ordem?: number
          ativo?: boolean
          created_at?: string
        }
        Relationships: []
      }
      patrocinadores: {
        Row: {
          id: string
          torcida_id: string
          texto_curto: string
          imagem_url: string | null
          link: string | null
          ativo: boolean
          created_at: string
        }
        Insert: {
          id?: string
          torcida_id: string
          texto_curto: string
          imagem_url?: string | null
          link?: string | null
          ativo?: boolean
          created_at?: string
        }
        Update: {
          id?: string
          torcida_id?: string
          texto_curto?: string
          imagem_url?: string | null
          link?: string | null
          ativo?: boolean
          created_at?: string
        }
        Relationships: []
      }
      sugestoes: {
        Row: {
          id: string
          torcida_id: string
          gestor_id: string
          tipo: 'melhoria' | 'bug' | 'duvida' | 'outro'
          titulo: string
          descricao: string
          status: 'pendente' | 'em_analise' | 'implementado' | 'recusado'
          resposta: string | null
          created_at: string
        }
        Insert: {
          id?: string
          torcida_id: string
          gestor_id: string
          tipo: 'melhoria' | 'bug' | 'duvida' | 'outro'
          titulo: string
          descricao: string
          status?: 'pendente' | 'em_analise' | 'implementado' | 'recusado'
          resposta?: string | null
          created_at?: string
        }
        Update: {
          id?: string
          torcida_id?: string
          gestor_id?: string
          tipo?: 'melhoria' | 'bug' | 'duvida' | 'outro'
          titulo?: string
          descricao?: string
          status?: 'pendente' | 'em_analise' | 'implementado' | 'recusado'
          resposta?: string | null
          created_at?: string
        }
        Relationships: []
      }
      acessos_log: {
        Row: {
          id: string
          socio_id: string
          torcida_id: string
          acessado_em: string
        }
        Insert: {
          id?: string
          socio_id: string
          torcida_id: string
          acessado_em?: string
        }
        Update: {
          id?: string
          socio_id?: string
          torcida_id?: string
          acessado_em?: string
        }
        Relationships: []
      }
    }
    Views: {
      [_ in never]: never
    }
    Functions: {
      calcular_divida_socio: {
        Args: { socio_uuid: string }
        Returns: number
      }
      contar_meses_pendentes: {
        Args: { socio_uuid: string }
        Returns: number
      }
    }
    Enums: {
      [_ in never]: never
    }
  }
}
