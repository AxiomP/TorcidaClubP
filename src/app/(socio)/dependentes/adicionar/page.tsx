'use client'

import { useState } from 'react'
import { useRouter } from 'next/navigation'
import Link from 'next/link'
import { useForm } from 'react-hook-form'
import { zodResolver } from '@hookform/resolvers/zod'
import { z } from 'zod'
import { useAuth } from '@/hooks/use-auth'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Checkbox } from '@/components/ui/checkbox'
import { ArrowLeft, UserPlus, Loader2 } from 'lucide-react'
import { toast } from 'react-hot-toast'
import { validarCPF } from '@/lib/validations/cpf-validator'

// Schema de validação
const dependenteSchema = z.object({
  cpf: z
    .string()
    .min(11, 'CPF inválido')
    .max(14, 'CPF inválido')
    .refine((val) => validarCPF(val.replace(/\D/g, '')), 'CPF inválido'),
  nome_completo: z.string().min(3, 'Nome deve ter pelo menos 3 caracteres'),
  email: z.string().email('Email inválido'),
  data_nascimento: z.string().min(1, 'Data de nascimento é obrigatória'),
  e_menor: z.boolean(),
  cpf_responsavel: z.string().optional(),
})

type DependenteFormData = z.infer<typeof dependenteSchema>

export default function AdicionarDependentePage() {
  const router = useRouter()
  const { socioData, torcidaId } = useAuth()
  const [loading, setLoading] = useState(false)

  const {
    register,
    handleSubmit,
    watch,
    setValue,
    formState: { errors },
  } = useForm<DependenteFormData>({
    resolver: zodResolver(dependenteSchema),
    defaultValues: {
      e_menor: false,
    },
  })

  const eMenor = watch('e_menor')

  // Formatar CPF enquanto digita
  function formatarCPF(value: string) {
    const numeros = value.replace(/\D/g, '')
    if (numeros.length <= 3) return numeros
    if (numeros.length <= 6) return `${numeros.slice(0, 3)}.${numeros.slice(3)}`
    if (numeros.length <= 9)
      return `${numeros.slice(0, 3)}.${numeros.slice(3, 6)}.${numeros.slice(6)}`
    return `${numeros.slice(0, 3)}.${numeros.slice(3, 6)}.${numeros.slice(6, 9)}-${numeros.slice(9, 11)}`
  }

  // Calcular idade a partir da data de nascimento
  function calcularIdade(dataNascimento: string): number {
    const hoje = new Date()
    const nascimento = new Date(dataNascimento)
    let idade = hoje.getFullYear() - nascimento.getFullYear()
    const mes = hoje.getMonth() - nascimento.getMonth()
    if (mes < 0 || (mes === 0 && hoje.getDate() < nascimento.getDate())) {
      idade--
    }
    return idade
  }

  // Verificar se é menor de idade ao mudar a data
  function handleDataNascimentoChange(e: React.ChangeEvent<HTMLInputElement>) {
    const data = e.target.value
    if (data) {
      const idade = calcularIdade(data)
      setValue('e_menor', idade < 18)
    }
  }

  async function onSubmit(data: DependenteFormData) {
    if (!socioData?.id || !torcidaId) {
      toast.error('Erro de autenticação. Faça login novamente.')
      return
    }

    setLoading(true)

    try {
      const response = await fetch('/api/dependentes', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          ...data,
          cpf: data.cpf.replace(/\D/g, ''),
          socio_titular_id: socioData.id,
          torcida_id: torcidaId,
        }),
      })

      const result = await response.json()

      if (!response.ok) {
        throw new Error(result.error || 'Erro ao adicionar dependente')
      }

      toast.success('Dependente adicionado com sucesso!')
      router.push('/dependentes')
    } catch (error) {
      console.error('Erro ao adicionar dependente:', error)
      toast.error(
        error instanceof Error ? error.message : 'Erro ao adicionar dependente'
      )
    } finally {
      setLoading(false)
    }
  }

  return (
    <div className="max-w-2xl mx-auto space-y-6">
      {/* Header */}
      <div className="flex items-center gap-4">
        <Link href="/dependentes">
          <Button variant="ghost" size="icon">
            <ArrowLeft className="h-5 w-5" />
          </Button>
        </Link>
        <div>
          <h1 className="text-2xl font-bold flex items-center gap-2">
            <UserPlus className="h-6 w-6 text-purple-500" />
            Adicionar Dependente
          </h1>
          <p className="text-sm text-muted-foreground">
            Preencha os dados do novo dependente
          </p>
        </div>
      </div>

      {/* Formulário */}
      <Card>
        <CardHeader>
          <CardTitle>Dados do Dependente</CardTitle>
        </CardHeader>
        <CardContent>
          <form onSubmit={handleSubmit(onSubmit)} className="space-y-6">
            {/* CPF */}
            <div className="space-y-2">
              <Label htmlFor="cpf">CPF *</Label>
              <Input
                id="cpf"
                placeholder="000.000.000-00"
                {...register('cpf')}
                onChange={(e) => {
                  e.target.value = formatarCPF(e.target.value)
                  register('cpf').onChange(e)
                }}
                maxLength={14}
              />
              {errors.cpf && (
                <p className="text-sm text-red-500">{errors.cpf.message}</p>
              )}
            </div>

            {/* Nome Completo */}
            <div className="space-y-2">
              <Label htmlFor="nome_completo">Nome Completo *</Label>
              <Input
                id="nome_completo"
                placeholder="Nome completo do dependente"
                {...register('nome_completo')}
              />
              {errors.nome_completo && (
                <p className="text-sm text-red-500">
                  {errors.nome_completo.message}
                </p>
              )}
            </div>

            {/* Email */}
            <div className="space-y-2">
              <Label htmlFor="email">Email *</Label>
              <Input
                id="email"
                type="email"
                placeholder="email@exemplo.com"
                {...register('email')}
              />
              <p className="text-xs text-muted-foreground">
                O dependente receberá um email para criar sua senha de acesso.
              </p>
              {errors.email && (
                <p className="text-sm text-red-500">{errors.email.message}</p>
              )}
            </div>

            {/* Data de Nascimento */}
            <div className="space-y-2">
              <Label htmlFor="data_nascimento">Data de Nascimento *</Label>
              <Input
                id="data_nascimento"
                type="date"
                {...register('data_nascimento')}
                onChange={(e) => {
                  register('data_nascimento').onChange(e)
                  handleDataNascimentoChange(e)
                }}
              />
              {errors.data_nascimento && (
                <p className="text-sm text-red-500">
                  {errors.data_nascimento.message}
                </p>
              )}
            </div>

            {/* Menor de idade */}
            <div className="flex items-center space-x-2">
              <Checkbox
                id="e_menor"
                checked={eMenor}
                onCheckedChange={(checked) =>
                  setValue('e_menor', checked as boolean)
                }
              />
              <Label htmlFor="e_menor" className="text-sm font-normal">
                Menor de 18 anos
              </Label>
            </div>

            {/* CPF do Responsável (se menor) */}
            {eMenor && (
              <div className="space-y-2 p-4 bg-muted rounded-lg">
                <Label htmlFor="cpf_responsavel">
                  CPF do Responsável Legal *
                </Label>
                <Input
                  id="cpf_responsavel"
                  placeholder="000.000.000-00"
                  {...register('cpf_responsavel')}
                  onChange={(e) => {
                    e.target.value = formatarCPF(e.target.value)
                    register('cpf_responsavel').onChange(e)
                  }}
                  maxLength={14}
                />
                <p className="text-xs text-muted-foreground">
                  Por ser menor de idade, é necessário informar o CPF do
                  responsável legal.
                </p>
              </div>
            )}

            {/* Botões */}
            <div className="flex gap-4">
              <Link href="/dependentes" className="flex-1">
                <Button type="button" variant="outline" className="w-full">
                  Cancelar
                </Button>
              </Link>
              <Button type="submit" className="flex-1" disabled={loading}>
                {loading ? (
                  <>
                    <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                    Adicionando...
                  </>
                ) : (
                  <>
                    <UserPlus className="h-4 w-4 mr-2" />
                    Adicionar Dependente
                  </>
                )}
              </Button>
            </div>
          </form>
        </CardContent>
      </Card>
    </div>
  )
}
