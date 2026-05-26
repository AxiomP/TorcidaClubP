import type { Metadata } from 'next'
import Link from 'next/link'
import { Button } from '@/components/ui/button'
import { Card } from '@/components/ui/card'
import { ArrowLeft } from 'lucide-react'

export const metadata: Metadata = {
  title: 'Termos de Uso | TorcidaClub',
  description: 'Termos de Uso da plataforma TorcidaClub',
}

export default function TermosDeUsoPage() {
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

        {/* Conteudo */}
        <Card className="p-8">
          {/* INSIRA O CONTEUDO DOS TERMOS DE USO AQUI, dentro do <article> abaixo.
              Siga o padrao da pagina de Privacidade (src/app/privacidade/page.tsx).
              Cada secao usa <section className="mb-6"> com <h2> e <p>. */}
          <article className="prose prose-neutral dark:prose-invert max-w-none">
            <h1 className="text-3xl font-bold mb-2">
              Termos de Uso – TorcidaClub®
            </h1>

            <p className="text-muted-foreground mb-8">
              Ao utilizar a plataforma TorcidaClub®, você concorda com os termos e condições descritos abaixo. Leia atentamente antes de prosseguir.
            </p>

            <section className="mb-6">
              <h2 className="text-xl font-semibold mb-3">1. Aceitação dos Termos</h2>
              <p className="text-muted-foreground">
                Ao acessar ou utilizar a plataforma TorcidaClub®, o usuário declara que leu, compreendeu e concorda integralmente com estes Termos de Uso. Caso não concorde com alguma disposição, não deverá utilizar a plataforma.
              </p>
            </section>

            <section className="mb-6">
              <h2 className="text-xl font-semibold mb-3">2. Descrição do Serviço</h2>
              <p className="text-muted-foreground">
                O TorcidaClub® é uma plataforma SaaS destinada à gestão de torcidas organizadas, oferecendo funcionalidades como cadastro de sócios-torcedores, controle de pagamentos, distribuição de ingressos, notificações e relatórios.
              </p>
            </section>

            <section className="mb-6">
              <h2 className="text-xl font-semibold mb-3">3. Cadastro e Conta do Usuário</h2>
              <p className="text-muted-foreground">
                Para utilizar a plataforma, o usuário deverá realizar cadastro fornecendo informações verdadeiras, completas e atualizadas. O usuário é responsável pela confidencialidade de suas credenciais de acesso e por todas as atividades realizadas em sua conta.
              </p>
            </section>

            <section className="mb-6">
              <h2 className="text-xl font-semibold mb-3">4. Obrigações do Usuário</h2>
              <p className="text-muted-foreground">
                O usuário compromete-se a utilizar a plataforma de forma ética e em conformidade com a legislação vigente. É vedado o uso da plataforma para fins ilícitos, difusão de conteúdo ofensivo, discriminatório ou que viole direitos de terceiros.
              </p>
            </section>

            <section className="mb-6">
              <h2 className="text-xl font-semibold mb-3">5. Responsabilidades dos Gestores</h2>
              <p className="text-muted-foreground">
                Os gestores das torcidas organizadas são responsáveis pela administração dos dados de seus sócios dentro da plataforma, devendo respeitar a legislação de proteção de dados e utilizar as informações apenas para as finalidades previstas.
              </p>
            </section>

            <section className="mb-6">
              <h2 className="text-xl font-semibold mb-3">6. Pagamentos e Transações</h2>
              <p className="text-muted-foreground">
                O TorcidaClub® facilita o registro e acompanhamento de pagamentos entre sócios-torcedores e torcidas organizadas, mas não participa nem se responsabiliza pelas transações financeiras realizadas entre as partes.
              </p>
            </section>

            <section className="mb-6">
              <h2 className="text-xl font-semibold mb-3">7. Propriedade Intelectual</h2>
              <p className="text-muted-foreground">
                Todo o conteúdo da plataforma, incluindo marca, logotipo, layout, textos e código-fonte, é de propriedade exclusiva do TorcidaClub® e está protegido pela legislação de propriedade intelectual. É vedada a reprodução, distribuição ou modificação sem autorização prévia.
              </p>
            </section>

            <section className="mb-6">
              <h2 className="text-xl font-semibold mb-3">8. Limitação de Responsabilidade</h2>
              <p className="text-muted-foreground">
                O TorcidaClub® não se responsabiliza por danos diretos ou indiretos decorrentes do uso da plataforma, incluindo indisponibilidade temporária, perda de dados por força maior ou ações de terceiros.
              </p>
            </section>

            <section className="mb-6">
              <h2 className="text-xl font-semibold mb-3">9. Modificações nos Termos</h2>
              <p className="text-muted-foreground">
                O TorcidaClub® reserva-se o direito de alterar estes Termos de Uso a qualquer momento. As alterações serão comunicadas através da plataforma e entrarão em vigor na data de sua publicação.
              </p>
            </section>

            <section className="mb-6">
              <h2 className="text-xl font-semibold mb-3">10. Contato</h2>
              <p className="text-muted-foreground">
                Para dúvidas ou solicitações relacionadas a estes Termos de Uso, entre em contato através do canal oficial disponível na plataforma.
              </p>
            </section>

            <div className="mt-8 pt-6 border-t">
              <p className="text-sm text-muted-foreground">
                O uso contínuo da plataforma implica na aceitação destes Termos de Uso.
              </p>
              <p className="text-sm text-muted-foreground mt-2">
                <strong>Termos vigentes a partir de fevereiro de 2026.</strong>
              </p>
            </div>
          </article>
        </Card>
      </div>
    </main>
  )
}
