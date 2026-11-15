# Publicação Vercel + Neon

Aplicação: https://helpdeskiweti.vercel.app

## Infraestrutura

- Vercel: projeto `helpdesk-best-project` (`prj_PMhsu96uTKaPPEcav66NmYPz5o6N`), equipe `iweti-team`.
- Produção: deploy `dpl_EQAkZ4Y85Hot1TSDLt36RvuwPm5b`, Node 24, Next.js, região `iad1`. Estado READY confirmado em 15/11/2026. Build remoto concluído em 23 segundos.
- Neon: projeto `helpdesk-best-project` (`rough-bread-02478903`), região `aws-us-east-1`, PostgreSQL 17.
- Banco demonstrativo: branch `demo` (`br-bold-base-bb6rim6v`). A principal permanece sem alterações de schema.
- Migrations e seed aplicados via TLS; 17 testes Vitest aprovados nessa branch antes de publicação.
- `DATABASE_URL` e `DIRECT_URL` configuradas como segredos somente em Production, após autorização explícita do usuário. `APP_URL` aponta para o domínio público acima. A senha seed não foi enviada ao ambiente Vercel.

O domínio com sufixo da equipe e os endereços individuais de deployment mantêm a proteção Vercel. O endereço público canônico acima responde diretamente, sem autenticação Vercel; o login do próprio HelpDesk protege os dados.

O deploy foi feito a partir dos arquivos locais da branch `tunicate`, com alterações ainda não commitadas; não houve push nem merge para `main`. Não foi configurada integração Git automática. `.vercelignore` exclui arquivos `.env*` (exceto o exemplo), `.vercel`, docs, evidências e testes do upload. `.env.cloud` permanece privado e ignorado pelo Git.

## Reproduzir a publicação

1. Confirmar projeto/equipe com `vercel project inspect --non-interactive --scope iweti-team`.
2. Usar banco de desenvolvimento isolado para migrations novas; não executar a suíte destrutiva de integração no banco publicado.
3. Aplicar migrations revisadas usando conexão direta; aplicação usa URL pooled por TLS. Nunca colocar secrets em argumentos, commits ou artefatos.
4. Configurar URLs como segredos de Production. Preview deve ter outro banco e sua própria APP_URL.
5. Executar typecheck, lint e testes locais; publicar com `vercel deploy --prod --scope iweti-team`. Usar `--no-wait` apenas para iniciar, depois inspecionar até READY ou ERROR.
6. Repetir `python3 scripts/verify-production.py` somente para esta demonstração: usa senha do seed de `.env.cloud`, cria chamado fictício e conta que é desativada; não recebe credenciais do banco.
7. Consultar logs limitados do deploy exato e registrar evidências. Não publicar cookies, tokens ou traces com credenciais.

## Acesso demonstrativo

Contas: `usuario@helpdesk.test`, `tecnico@helpdesk.test`, `tecnico2@helpdesk.test`, `admin@helpdesk.test`. A senha foi entregue em arquivo privado fora do repositório; pode ser substituída. Seed idempotente não altera senha existente.

## Manutenção e pendências

Primeira publicação: 15/11/2026. Recursos sem exclusão agendada. A comprovação de 14 dias requer transcorrer o período e registrar verificações; a data de entrega acadêmica e o responsável ainda precisam ser definidos pelo grupo. A disponibilidade não é garantida por esta execução única.

Verificar diariamente: login HTTPS, acesso ao banco, limites/consumo do plano, logs sem segredos e dados fictícios preservados. Confirmar no painel Neon a política de suspensão: a conta recusou configuração explícita, portanto o padrão permitido foi mantido. Não houve upgrade contratado.

Histórico de impedimentos resolvidos: conector Vercel retornou 403; CLI funcionou após login como Owner. A revisão automática exigiu autorização específica para transferência das URLs Neon, concedida antes da configuração. O primeiro domínio com sufixo de equipe era protegido; a origem da aplicação foi fixada no domínio canônico público sem remover a proteção das demais URLs.

## Verificação efetivamente executada

Dois cenários Playwright aprovados (21,1 s), com evidência em `docs/deployment-e2e-results.json`: HTTPS e cookie Secure/HttpOnly/SameSite, rota protegida, logout, CSRF; fluxo publicado UC01–UC10, com gravação Neon e releitura entre perfis. Screenshots reais `production-ticket.png` e `production-report.png`. A consulta limitada dos erros retornou 0 registros na janela registrada em `docs/deployment-verification.json`. Essa leitura pontual não constitui monitoramento contínuo. Drains não foram inspecionados.

Troca de domínio em 15/11/2026: a pedido do usuário, o domínio público passou a ser https://helpdeskiweti.vercel.app. APP_URL atualizado e novo deploy dpl_EQAkZ4Y85Hot1TSDLt36RvuwPm5b READY. O endereço antigo redireciona por HTTP 308, preservando o caminho. O banco e as contas permanecem os mesmos.
