import type { Metadata } from 'next'
import Link from 'next/link'
import { Button } from '@/components/ui/button'
import { Card } from '@/components/ui/card'
import { ArrowLeft } from 'lucide-react'

export const metadata: Metadata = {
  title: 'Política de Privacidade | TorcidaClub',
  description: 'Política de Privacidade da plataforma TorcidaClub - Conformidade com a LGPD',
}

export default function PoliticaPrivacidadePage() {
  return (
    <main className="min-h-screen bg-background py-8 px-4">
      <div className="max-w-4xl mx-auto">
        {/* Header */}
        <div className="mb-8">
          <Link href="/">
            <Button variant="ghost" className="gap-2 mb-4">
              <ArrowLeft className="h-4 w-4" />
              Voltar
            </Button>
          </Link>
        </div>

        {/* Conteúdo */}
        <Card className="p-8">
          <article className="prose prose-neutral dark:prose-invert max-w-none">
            <h1 className="text-3xl font-bold mb-2">
              Política de Privacidade – TorcidaClub®
            </h1>

            <p className="text-muted-foreground mb-8">
              A privacidade dos usuários é uma prioridade para o TorcidaClub®. Esta Política de Privacidade estabelece como os dados pessoais são coletados, utilizados, armazenados e protegidos no âmbito da plataforma, em conformidade com a Lei Geral de Proteção de Dados (Lei nº 13.709/2018 – LGPD).
            </p>

            <section className="mb-6">
              <h2 className="text-xl font-semibold mb-3">1. Dados coletados</h2>
              <p className="text-muted-foreground">
                São coletados apenas os dados estritamente necessários ao funcionamento da plataforma, incluindo: nome completo, data de nascimento, e-mail e número de WhatsApp, utilizados para identificação, comunicação institucional, relacionamento com a torcida organizada e notificações relevantes.
              </p>
            </section>

            <section className="mb-6">
              <h2 className="text-xl font-semibold mb-3">2. Base legal para o tratamento</h2>
              <p className="text-muted-foreground">
                O tratamento dos dados ocorre com base no consentimento do usuário, na execução do contrato firmado com o sócio-torcedor e no legítimo interesse do TorcidaClub® e das torcidas organizadas, especialmente para fins administrativos, operacionais, de segurança e prevenção a fraudes.
              </p>
            </section>

            <section className="mb-6">
              <h2 className="text-xl font-semibold mb-3">3. Uso das informações</h2>
              <p className="text-muted-foreground">
                Os dados são utilizados exclusivamente para finalidades relacionadas à gestão da associação do sócio-torcedor, comunicação institucional, organização interna das torcidas e melhoria da experiência na plataforma. O TorcidaClub® não comercializa dados pessoais.
              </p>
            </section>

            <section className="mb-6">
              <h2 className="text-xl font-semibold mb-3">4. Armazenamento e segurança</h2>
              <p className="text-muted-foreground">
                Os dados são armazenados em servidores na internet que adotam medidas técnicas e organizacionais de segurança para proteção contra acessos não autorizados, vazamentos e incidentes cibernéticos. O acesso à conta do usuário é protegido por credenciais individuais (e-mail e senha).
              </p>
            </section>

            <section className="mb-6">
              <h2 className="text-xl font-semibold mb-3">5. Acesso por gestores de torcidas</h2>
              <p className="text-muted-foreground">
                Os gestores das torcidas organizadas possuem acesso apenas aos dados dos seus respectivos sócios-torcedores e são responsáveis pelo uso adequado dessas informações, comprometendo-se a cumprir a legislação vigente e as diretrizes culturais e éticas do TorcidaClub®. O TorcidaClub® não se responsabiliza por usos indevidos realizados fora do escopo da plataforma.
              </p>
            </section>

            <section className="mb-6">
              <h2 className="text-xl font-semibold mb-3">6. Exportação de dados</h2>
              <p className="text-muted-foreground">
                A plataforma disponibiliza funcionalidades que permitem aos gestores exportar dados em formatos como PDF ou planilhas. O TorcidaClub® não controla, armazena ou se responsabiliza por cópias externas realizadas pelos gestores.
              </p>
            </section>

            <section className="mb-6">
              <h2 className="text-xl font-semibold mb-3">7. Exclusão e retenção de dados</h2>
              <p className="text-muted-foreground">
                O usuário pode solicitar, a qualquer momento, a exclusão de seus dados pessoais e o desligamento da torcida organizada, observadas eventuais obrigações financeiras pendentes. Após a exclusão, os dados poderão ser mantidos pelo período necessário para cumprimento de obrigações legais, contratuais ou para resguardo de direitos em caso de investigações ou solicitações de autoridades competentes.
              </p>
            </section>

            <section className="mb-6">
              <h2 className="text-xl font-semibold mb-3">8. Responsabilidade por transações</h2>
              <p className="text-muted-foreground">
                O TorcidaClub® não participa nem se responsabiliza por transações realizadas entre sócios-torcedores e torcidas organizadas, como pagamento de mensalidades, ingressos ou aquisição de produtos.
              </p>
            </section>

            <section className="mb-6">
              <h2 className="text-xl font-semibold mb-3">9. Contato</h2>
              <p className="text-muted-foreground">
                Para dúvidas, solicitações ou exercício dos direitos previstos na LGPD, o usuário poderá entrar em contato por meio do canal oficial informado na plataforma.
              </p>
            </section>

            <div className="mt-8 pt-6 border-t">
              <p className="text-sm text-muted-foreground">
                O uso contínuo da plataforma implica na aceitação desta Política de Privacidade.
              </p>
              <p className="text-sm text-muted-foreground mt-2">
                <strong>Política vigente a partir de 8 de março de 2025.</strong>
              </p>
            </div>
          </article>
        </Card>
      </div>
    </main>
  )
}
