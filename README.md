# HelpDesk · Best Project — Mackenzie ADS

Aplicação publicada: https://helpdeskiweti.vercel.app

Aplicação full-stack com UC01–UC10, três perfis, histórico transacional, concorrência otimista, relatórios e testes reais. Implementação na branch `tunicate`; nenhum push para `main`.

## Executar localmente

Requisitos: Node.js 24, npm e Docker. PostgreSQL também pode ser fornecido externamente.

```sh
npm ci
cp .env.example .env
# Edite SEED_PASSWORD: 12 a 72 caracteres, exclusiva para demonstração.
docker compose up -d
npm run db:generate
npm run db:migrate
npm run db:seed
npm run dev
```

Abra http://localhost:3000. O PostgreSQL local usa porta 54329; o compose persiste dados em volume. Se houver outro container usando essa porta, reutilize a conexão ou pare o container antes de iniciar o compose. Nesta sessão foi criado o container `helpdesk-tunicate-db` nessa porta.

Contas seed: `usuario@helpdesk.test`, `tecnico@helpdesk.test`, `tecnico2@helpdesk.test`, `admin@helpdesk.test`. A senha é o valor de SEED_PASSWORD usado na **primeira** criação. Seed é idempotente e não troca senhas existentes. Não use essas contas/banco com dados reais.

## Validação

```sh
npm run typecheck
npm run lint
npm test
npx playwright install chromium
npm run test:e2e
npm run build
npm run docs:metrics
```

Use banco isolado de testes. A integração cria e limpa registros próprios; E2E mantém chamados fictícios como evidência e expira sessões do usuário de demonstração. Não execute essa suíte contra produção.

## Rotas e documentação

- `/login`: T01; `/chamados`: T02/T05; `/chamados/novo`: T03; `/chamados/[id]`: T04/T06.
- `/usuarios`: T07; `/relatorios`: T08.
- [Arquitetura e decisões](docs/ARCHITECTURE.md)
- [Testes, resultados e limitações](docs/TESTS.md)
- [Publicação e operação por 14 dias](docs/DEPLOYMENT.md)
- [Roteiro de oito minutos](docs/VIDEO.md)
- [Registro das etapas](docs/PROGRESS.md)

O documento acadêmico gerado é uma versão de construção: a URL pública e os testes online estão registrados. Gravação/link do vídeo, comprovação dos 14 dias e responsável pelo Fórum permanecem pendentes. Credenciais demonstrativas foram entregues em arquivo privado separado.

Referências técnicas consultadas: [Next.js instalação](https://nextjs.org/docs/app/getting-started/installation), guias locais de autenticação/cookies/Route Handlers do Next.js instalado, [Prisma schema v6](https://www.prisma.io/docs/orm/v6/reference/prisma-schema-reference) e skills Neon/PostgreSQL fornecidas no ambiente.

Banco Neon criado: projeto `helpdesk-best-project`, branch `demo`. Configuração privada em `.env.cloud`; a configuração local continua em `.env`. Publicação concluída na Vercel via CLI autenticada, equipe `iweti-team`; veja docs/DEPLOYMENT.md.

Gerar o PDF: em um ambiente Python com `reportlab` instalado, execute `python3 scripts/build-pdf.py` depois dos testes e de `npm run docs:metrics`. Saída: `output/pdf/HelpDesk_Documentacao_Construcao.pdf`. O gerador usa Liberation Serif ou DejaVu Serif instaladas no sistema.

Verificação online: `python3 scripts/verify-production.py` lê somente a senha demonstrativa de `.env.cloud` e executa dois cenários Playwright no domínio público. Evidências em `docs/deployment-e2e-results.json` e `docs/evidence/production-*.png`. Não execute contra ambientes com dados reais.
