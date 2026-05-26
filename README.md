

```markdown
# 🏆 TorcidaClub®

> Plataforma SaaS multi-tenant para gestão completa de Torcidas Organizadas: sócios, mensalidades, ingressos, eventos e muito mais.

![TypeScript](https://img.shields.io/badge/TypeScript-5.0-blue)
![Next.js](https://img.shields.io/badge/Next.js-14-black)
![Supabase](https://img.shields.io/badge/Supabase-PostgreSQL-green)
![Tailwind](https://img.shields.io/badge/Tailwind-CSS-38B2AC)
![License](https://img.shields.io/badge/License-Private-red)



## 🎯 Sobre o Projeto

**TorcidaClub** nasceu para resolver a dor de torcidas organizadas que ainda usam planilhas, cadernos e grupos de WhatsApp para gerenciar associados. A plataforma centraliza:

- Cadastro e aprovação de sócios (com documentos, foto e assinatura digital)
- Controle de mensalidades e inadimplência
- Sistema de ingressos para eventos/jogos
- Dashboard analítico para gestores
- Notificações por e-mail e WhatsApp

Atualmente em **fase beta** com ~2 fases concluídas (autenticação e cadastro de sócios) – o sistema já roda localmente e está sendo preparado para deploy.

---

## 🧠 Stack Tecnológica

| Camada | Tecnologias |
|--------|-------------|
| **Frontend** | Next.js 14 (App Router), TypeScript, Tailwind CSS, shadcn/ui |
| **Backend** | Supabase (PostgreSQL, Auth, Storage, RLS) |
| **Validação** | React Hook Form, Zod |
| **Pagamentos** | Asaas API (PIX – em integração) |
| **Notificações** | SMTP próprio (servidor de e-mail) + WhatsApp API (futuro) |
| **Infraestrutura** | VPS dedicado (deploy e hospedagem) |

---

## 🚀 Como Executar Localmente

```bash
# Clone o repositório
git clone https://github.com/seu-usuario/torcidaclub.git
cd torcidaclub

# Instale as dependências
npm install

# Configure as variáveis de ambiente
cp .env.example .env.local
# Edite .env.local com suas credenciais (Supabase, Google OAuth, SMTP, etc.)

# Execute as migrações do banco de dados (Supabase SQL)
# Consulte o arquivo SETUP.md para o schema completo

# Inicie o servidor de desenvolvimento
npm run dev
```

Acesse `http://localhost:3000`

### Pré‑requisitos

- Node.js 18+ 
- Conta no [Supabase](https://supabase.com) (gratuita)
- Conta no [Google Cloud](https://console.cloud.google.com) (para OAuth)
- Servidor SMTP (para envio de e-mails)

Para um guia detalhado, consulte [`SETUP.md`](./SETUP.md).

---

## 🧪 Scripts Disponíveis

| Comando | Descrição |
|---------|-----------|
| `npm run dev` | Servidor de desenvolvimento |
| `npm run build` | Build de produção |
| `npm run lint` | Verifica padrões de código |
| `npm run type-check` | Valida tipos TypeScript |
| `npm run validate` | Lint + type-check (antes de commit) |
| `npm run seed:mock` | Popula banco com dados de teste |

---

## 📁 Estrutura do Projeto (resumida)

```
src/
├── app/                 # Next.js App Router
│   ├── (auth)/          # Login, cadastro
│   ├── (gestor)/        # Dashboard do administrador
│   ├── (socio)/         # Área do associado
│   └── api/             # Endpoints (cadastro, pagamentos, webhooks)
├── components/          # UI reutilizável (shadcn/ui + custom)
├── lib/                 # Clientes Supabase, validações, serviços
├── types/               # Tipagens geradas do banco
└── contexts/            # AuthContext (gestão de estado do usuário)
```

---

## 🗺️ Roadmap

- [x] Autenticação com Google OAuth (gestores)
- [x] Cadastro multi‑etapa de sócios (validação, documentos, assinatura)
- [x] Painel de aprovação de novos sócios
- [x] Módulo de mensalidades (geração automática, PIX)
- [ ] Sistema de ingressos com QR Code
- [ ] Dashboard analítico (gráficos, exportação)
- [x] Notificações por e-mail (SMTP) e WhatsApp

---

## 🔒 Segurança e Privacidade

Este repositório não contém **nenhuma credencial real, chave de API ou dado de cliente**. Todas as variáveis sensíveis são gerenciadas via arquivo `.env.local` (ignorado pelo Git). Consulte o arquivo [`.env.example`](./.env.example) para ver as variáveis necessárias.

---

## 📫 Contato

- **LinkedIn**: [Seu Nome](https://linkedin.com/in/seu-usuario)
- **GitHub**: [@seu-usuario](https://github.com/seu-usuario)
- **E‑mail**: seu.email@exemplo.com

---

## 📄 Licença

Este repositório é privado e não pode ser copiado ou distribuído sem autorização.

---

**Feito com TypeScript, Next.js, Supabase e infraestrutura própria (VPS + SMTP).**
