'use client'

import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from '@/components/ui/dialog'

interface PoliticaPrivacidadeModalProps {
  children: React.ReactNode
}

export function PoliticaPrivacidadeModal({ children }: PoliticaPrivacidadeModalProps) {
  return (
    <Dialog>
      <DialogTrigger asChild>{children}</DialogTrigger>
      <DialogContent className="max-w-2xl max-h-[85vh]">
        <DialogHeader>
          <DialogTitle className="text-xl">
            Política de Privacidade – TorcidaClub®
          </DialogTitle>
        </DialogHeader>

        <div className="h-[60vh] overflow-y-auto pr-4">
          <div className="space-y-6 text-sm">
            <p className="text-muted-foreground">
              A privacidade dos usuários é uma prioridade para o TorcidaClub®. Esta Política de Privacidade estabelece como os dados pessoais são coletados, utilizados, armazenados e protegidos no âmbito da plataforma, em conformidade com a Lei Geral de Proteção de Dados (Lei nº 13.709/2018 – LGPD).
            </p>

            <section>
              <h3 className="font-semibold mb-2">1. Dados coletados</h3>
              <p className="text-muted-foreground">
                São coletados apenas os dados estritamente necessários ao funcionamento da plataforma, incluindo: nome completo, data de nascimento, e-mail e número de WhatsApp, utilizados para identificação, comunicação institucional, relacionamento com a torcida organizada e notificações relevantes.
              </p>
            </section>

            <section>
              <h3 className="font-semibold mb-2">2. Base legal para o tratamento</h3>
              <p className="text-muted-foreground">
                O tratamento dos dados ocorre com base no consentimento do usuário, na execução do contrato firmado com o sócio-torcedor e no legítimo interesse do TorcidaClub® e das torcidas organizadas, especialmente para fins administrativos, operacionais, de segurança e prevenção a fraudes.
              </p>
            </section>

            <section>
              <h3 className="font-semibold mb-2">3. Uso das informações</h3>
              <p className="text-muted-foreground">
                Os dados são utilizados exclusivamente para finalidades relacionadas à gestão da associação do sócio-torcedor, comunicação institucional, organização interna das torcidas e melhoria da experiência na plataforma. O TorcidaClub® não comercializa dados pessoais.
              </p>
            </section>

            <section>
              <h3 className="font-semibold mb-2">4. Armazenamento e segurança</h3>
              <p className="text-muted-foreground">
                Os dados são armazenados em servidores na internet que adotam medidas técnicas e organizacionais de segurança para proteção contra acessos não autorizados, vazamentos e incidentes cibernéticos. O acesso à conta do usuário é protegido por credenciais individuais (e-mail e senha).
              </p>
            </section>

            <section>
              <h3 className="font-semibold mb-2">5. Acesso por gestores de torcidas</h3>
              <p className="text-muted-foreground">
                Os gestores das torcidas organizadas possuem acesso apenas aos dados dos seus respectivos sócios-torcedores e são responsáveis pelo uso adequado dessas informações, comprometendo-se a cumprir a legislação vigente e as diretrizes culturais e éticas do TorcidaClub®. O TorcidaClub® não se responsabiliza por usos indevidos realizados fora do escopo da plataforma.
              </p>
            </section>

            <section>
              <h3 className="font-semibold mb-2">6. Exportação de dados</h3>
              <p className="text-muted-foreground">
                A plataforma disponibiliza funcionalidades que permitem aos gestores exportar dados em formatos como PDF ou planilhas. O TorcidaClub® não controla, armazena ou se responsabiliza por cópias externas realizadas pelos gestores.
              </p>
            </section>

            <section>
              <h3 className="font-semibold mb-2">7. Exclusão e retenção de dados</h3>
              <p className="text-muted-foreground">
                O usuário pode solicitar, a qualquer momento, a exclusão de seus dados pessoais e o desligamento da torcida organizada, observadas eventuais obrigações financeiras pendentes. Após a exclusão, os dados poderão ser mantidos pelo período necessário para cumprimento de obrigações legais, contratuais ou para resguardo de direitos em caso de investigações ou solicitações de autoridades competentes.
              </p>
            </section>

            <section>
              <h3 className="font-semibold mb-2">8. Responsabilidade por transações</h3>
              <p className="text-muted-foreground">
                O TorcidaClub® não participa nem se responsabiliza por transações realizadas entre sócios-torcedores e torcidas organizadas, como pagamento de mensalidades, ingressos ou aquisição de produtos.
              </p>
            </section>

            <section>
              <h3 className="font-semibold mb-2">9. Contato</h3>
              <p className="text-muted-foreground">
                Para dúvidas, solicitações ou exercício dos direitos previstos na LGPD, o usuário poderá entrar em contato por meio do canal oficial informado na plataforma.
              </p>
            </section>

            <div className="pt-4 border-t mt-6">
              <p className="text-xs text-muted-foreground">
                O uso contínuo da plataforma implica na aceitação desta Política de Privacidade.
              </p>
              <p className="text-xs text-muted-foreground mt-1">
                <strong>Política vigente a partir de 8 de março de 2025.</strong>
              </p>
            </div>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  )
}
