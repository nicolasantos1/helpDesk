# Registro de execução

Data: 15/11/2026. Branch: tunicate. Sem commit/push para main.

## Fase 1 — base e banco

Criados package.json/lock, TypeScript estrito, Next.js App Router, Tailwind, Prisma schema, duas migrations, seed, compose, env de exemplo. Comandos: npm install, prisma generate, migrate dev, migrate deploy e db:seed. PostgreSQL 17 local: conexão, schema e seed verificados. Triggers de histórico obrigatório e solução validam o commit. Banco Neon criado posteriormente, conforme autorização do usuário (ver DEPLOYMENT).

## Fase 2 — autenticação

Criados auth.ts, page-auth.ts, login, API e shell por perfil. Login/logout, conta inativa, sessão expirada, cookies HttpOnly/SameSite e bloqueio sem sessão testados com Chromium. HTTPS/Secure público depende de publicação.

## Fase 3 — chamados

Criados domain.ts, service.ts, T02–T06, formulários e estilos. UC02–UC07/09 implementados; testes PostgreSQL validaram concorrência, proprietário, versões, estados, prioridade, solução e fechamento. E2E executou atendimento completo.

## Fase 4 — administração e relatórios

T07/T08, UC08/10 implementados. Testes validaram autocontrole administrativo, técnico ocupado, unicidade de e-mail, criação/edição/desativação e totalizações. Período inclusivo UTC-03 com teste de limites.

## Fase 5 — validação

Executados typecheck, eslint, Vitest, Playwright e build. Última execução: 17 testes Vitest e 7 Playwright aprovados. Auditoria npm após overrides: zero vulnerabilidades conhecidas na execução. Evidências reais de listagem em 360/768/1366 px inspecionadas visualmente. Consulte TESTS.md para os quatro itens não executados/bloqueados e limites da cobertura.

Correções durante execução: redirecionamento em cada página sem sessão, nome acessível de selects, seletores E2E e expectativa textual. Não houve simulação de resultado aprovado. CI preparada, mas não executada remotamente.

## Fase 6 — entrega

Criados guia de implantação, roteiro de vídeo, plano rastreável e gerador de PDF com capa, integrantes obtidos nos PDFs e pendências explícitas. Vídeo, responsável pelo Fórum, data de entrega e período real de 14 dias ainda pendentes. PDF é versão de construção, não entrega acadêmica final encerrada.

Validação cloud: migrations e seed aplicados no Neon, branch demo; repetição dos 17 testes Vitest aprovada em 48,85 segundos. Evidência separada `docs/neon-test-results.json`, sem duplicar casos nas métricas. Projeto Vercel não criado por HTTP 403; aguardando acesso. Credenciais de cloud nunca foram adicionadas ao Git.

Retomada: login Vercel reconhecido como Owner; projeto criado via CLI e vinculado à pasta. Configuração Next.js/Node 24 preparada. A revisão automática bloqueou o envio das URLs autenticadas do Neon para os segredos de produção; nenhuma credencial foi enviada. Falta autorização explícita para esse envio e o deploy subsequente.

Verificação na retomada: o build Turbopack foi bloqueado por EPERM ao criar subprocesso/porta, inclusive em tentativa escalada. Tentativa diagnóstica com Webpack também falhou; um probe de `spawnSync(node, ...)` retornou EPERM. O problema é do ambiente de execução desta retomada; nenhum ajuste no código da aplicação foi feito para contornar a restrição. O build aprovado da etapa anterior continua registrado, mas a configuração de implantação deve ser validada pelo build remoto após a autorização dos segredos.

## Publicação concluída em 15/11/2026

Após autorização explícita do usuário, DATABASE_URL e DIRECT_URL foram armazenadas como segredos de Production. Deploy final dpl_2DJ78YF5Ks88aK2K711DuzkNWeUi READY em https://helpdesk-best-project.vercel.app, com build remoto aprovado em 23 segundos. Node 24 e Next.js configurados. Dois testes de navegador públicos aprovados em 22,8 segundos: HTTPS/cookie Secure/autorização/CSRF e UC01–UC10 com atendimento completo, gestão de conta e relatórios. Evidências reais em docs/deployment-e2e-results.json e screenshots production-ticket/report. Arquivo privado com senha demonstrativa entregue fora do Git. Nenhum push para main.

O período real de 14 dias, gravação de vídeo, responsável pelo Fórum e auditoria integral de acessibilidade/reinício controlado permanecem pendentes. Falhas de autorização e bloqueio de segredos acima são histórico resolvido, não o estado atual.

Troca de domínio em 15/11/2026: a pedido do usuário, o domínio público passou a ser https://helpdeskiweti.vercel.app. APP_URL atualizado e novo deploy dpl_EQAkZ4Y85Hot1TSDLt36RvuwPm5b READY. O endereço antigo redireciona por HTTP 308, preservando o caminho. O banco e as contas permanecem os mesmos.
