# Plano e relatório de testes

Gerado a partir de execuções reais. Cobertura de casos de uso indica presença de teste aprovado, não cobertura exaustiva de caminhos nem cobertura de código.

26/26 executados aprovados; 29 planejados. Aprovação 100.0%; falha 0.0%; execução 89.66%; UCs cobertos 10/10 (100%).

Validação adicional no Neon: os mesmos 17 testes Vitest foram repetidos contra a branch demo e aprovados, conforme docs/neon-test-results.json. Essa repetição não aumenta o total de casos únicos.

Falhas intermediárias: ajuste de redirecionamento sem sessão, seletores ambíguos e uma expectativa textual do teste foram corrigidos. Métricas refletem a última execução. Não representam ausência de defeitos.

## TP01 — UC02 valida campos obrigatórios

Rastreabilidade: UC02
- Pré-condições: Sem sessão necessária; função pura.
- Passos: Submeter título, descrição e categoria inválidos.
- Esperado: Validação rejeita os dados.
- Obtido: Asserções concluídas sem falha.
- Situação: **aprovado**
- Evidência: docs/test-results.json; domain.test.ts

## TP02 — UC04 administrador não assume

Rastreabilidade: UC04
- Pré-condições: Administrador e chamado aberto.
- Passos: Solicitar atribuição com perfil administrador.
- Esperado: Atribuição recusada.
- Obtido: Asserções concluídas sem falha.
- Situação: **aprovado**
- Evidência: docs/test-results.json; domain.test.ts

## TP03 — UC05 rejeita transição direta para fechado

Rastreabilidade: UC05
- Pré-condições: Técnico responsável; em atendimento.
- Passos: Solicitar mudança direta para Fechado.
- Esperado: Transição recusada.
- Obtido: Asserções concluídas sem falha.
- Situação: **aprovado**
- Evidência: docs/test-results.json; domain.test.ts

## TP04 — UC07 exige solução

Rastreabilidade: UC07
- Pré-condições: Chamado Solucionado sem solução.
- Passos: Solicitar encerramento confirmado.
- Esperado: Encerramento recusado.
- Obtido: Asserções concluídas sem falha.
- Situação: **aprovado**
- Evidência: docs/test-results.json; domain.test.ts

## TP05 — UC10 inclui integralmente o dia final em São Paulo

Rastreabilidade: UC10
- Pré-condições: Datas civis válidas.
- Passos: Converter período em limites UTC.
- Esperado: Início UTC-03 e fim exclusivo no dia seguinte.
- Obtido: Asserções concluídas sem falha.
- Situação: **aprovado**
- Evidência: docs/test-results.json; domain.test.ts

## TP06 — UC10 rejeita datas invertidas ou inexistentes

Rastreabilidade: UC10
- Pré-condições: Função de período disponível.
- Passos: Enviar intervalo invertido e 30 de fevereiro.
- Esperado: Ambas entradas rejeitadas.
- Obtido: Asserções concluídas sem falha.
- Situação: **aprovado**
- Evidência: docs/test-results.json; domain.test.ts

## TP07 — UC02/ONF04 abertura persiste histórico inicial e padrões

Rastreabilidade: ONF04, UC02
- Pré-condições: Usuário ativo e categoria existente.
- Passos: Abrir e consultar um chamado.
- Esperado: Aberto, Média e exatamente um evento inicial.
- Obtido: Asserções concluídas sem falha.
- Situação: **aprovado**
- Evidência: docs/test-results.json; integration.test.ts

## TP08 — UC02 falha não cria chamado parcial

Rastreabilidade: UC02
- Pré-condições: Usuário ativo; UUID de categoria inexistente.
- Passos: Tentar abrir e comparar contagem antes/depois.
- Esperado: Erro; nenhum chamado criado.
- Obtido: Asserções concluídas sem falha.
- Situação: **aprovado**
- Evidência: docs/test-results.json; integration.test.ts

## TP09 — UC03/ONF03 impede leitura de outro solicitante e filtra listagem

Rastreabilidade: ONF03, UC03
- Pré-condições: Dois solicitantes ativos.
- Passos: Abrir com um e ler/listar com o outro.
- Esperado: Leitura recusada e lista sem registro alheio.
- Obtido: Asserções concluídas sem falha.
- Situação: **aprovado**
- Evidência: docs/test-results.json; integration.test.ts

## TP10 — UC04 atribuição concorrente aceita apenas um técnico e um evento

Rastreabilidade: UC04
- Pré-condições: Dois técnicos ativos; chamado versão zero.
- Passos: Disparar duas atribuições simultâneas.
- Esperado: Um sucesso, uma rejeição, um responsável, dois eventos totais.
- Obtido: Asserções concluídas sem falha.
- Situação: **aprovado**
- Evidência: docs/test-results.json; integration.test.ts

## TP11 — UC04 rejeita administrador e conta inativa

Rastreabilidade: UC04
- Pré-condições: Chamado aberto, administrador e técnico inativo.
- Passos: Tentar atribuição com cada perfil.
- Esperado: Operações rejeitadas.
- Obtido: Asserções concluídas sem falha.
- Situação: **aprovado**
- Evidência: docs/test-results.json; integration.test.ts

## TP12 — UC05/06/07/09 fluxo completo, proprietário, versão e imutabilidade

Rastreabilidade: UC05, UC06, UC07, UC09
- Pré-condições: Chamado aberto e dois técnicos.
- Passos: Assumir; testar terceiro, versão obsoleta, status, prioridade, solução e encerramento.
- Esperado: Somente mudanças válidas; versão seis, sete eventos, solução e data final preservadas.
- Obtido: Asserções concluídas sem falha.
- Situação: **aprovado**
- Evidência: docs/test-results.json; integration.test.ts

## TP13 — UC08 restrições próprias, técnico ocupado e e-mail duplicado

Rastreabilidade: UC08
- Pré-condições: Administrador; técnico com chamado não fechado.
- Passos: Desativar/mudar perfil do técnico; desativar próprio admin; repetir e-mail.
- Esperado: Todas rejeitadas; usuário comum não administra.
- Obtido: Asserções concluídas sem falha.
- Situação: **aprovado**
- Evidência: docs/test-results.json; integration.test.ts

## TP14 — UC08 cadastro, edição e desativação preservam histórico

Rastreabilidade: UC08
- Pré-condições: Administrador ativo.
- Passos: Cadastrar conta fictícia, editar nome e desativar.
- Esperado: Conta mantida no banco e inativa.
- Obtido: Asserções concluídas sem falha.
- Situação: **aprovado**
- Evidência: docs/test-results.json; integration.test.ts

## TP15 — UC10 totais consistentes e intervalo vazio

Rastreabilidade: UC10
- Pré-condições: Administrador; chamados no banco.
- Passos: Consultar período amplo, vazio, invertido e acesso técnico.
- Esperado: Grupos somam total; vazio zero; inválido e técnico recusados.
- Obtido: Asserções concluídas sem falha.
- Situação: **aprovado**
- Evidência: docs/test-results.json; integration.test.ts

## TP16 — ONF04 persistência após reconexão

Rastreabilidade: ONF04
- Pré-condições: Registro persistido em PostgreSQL.
- Passos: Desconectar cliente e consultar com nova conexão.
- Esperado: Mesmo título persistido; não equivale a reiniciar host.
- Obtido: Asserções concluídas sem falha.
- Situação: **aprovado**
- Evidência: docs/test-results.json; integration.test.ts

## TP17 — ONF04 banco rejeita chamado sem histórico e desfaz a gravação

Rastreabilidade: ONF04
- Pré-condições: Conta e categoria existentes.
- Passos: Inserir diretamente sem histórico e contar registros.
- Esperado: Trigger rejeita commit; contagem inalterada.
- Obtido: Asserções concluídas sem falha.
- Situação: **aprovado**
- Evidência: docs/test-results.json; integration.test.ts

## TP18 — UC01/ONF02 login, inválido, acesso protegido e logout

Rastreabilidade: ONF02, UC01
- Pré-condições: Seed aplicado; navegador sem sessão.
- Passos: Abrir rota protegida; login inválido e válido; sair.
- Esperado: Redirecionamento, mensagem genérica, sessão válida e logout.
- Obtido: Asserções concluídas sem falha.
- Situação: **aprovado**
- Evidência: docs/e2e-results.json; tests/e2e/flows.spec.ts

## TP19 — UC02–UC09 fluxo pela interface nos três perfis

Rastreabilidade: UC02, UC03, UC04, UC05, UC06, UC07, UC08, UC09
- Pré-condições: Seed com três perfis.
- Passos: Abrir; técnico assume, prioriza, pausa, soluciona e fecha; admin abre usuários/relatórios.
- Esperado: Fluxo concluído e telas dos perfis acessíveis.
- Obtido: Asserções concluídas sem falha.
- Situação: **aprovado**
- Evidência: docs/e2e-results.json; tests/e2e/flows.spec.ts

## TP20 — ONF05 responsividade 360px e teclado

Rastreabilidade: ONF05
- Pré-condições: Seed; Chromium.
- Passos: Entrar na largura indicada, verificar scroll, focar marca e usar Tab.
- Esperado: Sem overflow horizontal da lista; foco chega ao link Chamados; screenshot real.
- Obtido: Asserções concluídas sem falha.
- Situação: **aprovado**
- Evidência: docs/e2e-results.json; tests/e2e/flows.spec.ts

## TP21 — ONF05 responsividade 768px e teclado

Rastreabilidade: ONF05
- Pré-condições: Seed; Chromium.
- Passos: Entrar na largura indicada, verificar scroll, focar marca e usar Tab.
- Esperado: Sem overflow horizontal da lista; foco chega ao link Chamados; screenshot real.
- Obtido: Asserções concluídas sem falha.
- Situação: **aprovado**
- Evidência: docs/e2e-results.json; tests/e2e/flows.spec.ts

## TP22 — ONF05 responsividade 1366px e teclado

Rastreabilidade: ONF05
- Pré-condições: Seed; Chromium.
- Passos: Entrar na largura indicada, verificar scroll, focar marca e usar Tab.
- Esperado: Sem overflow horizontal da lista; foco chega ao link Chamados; screenshot real.
- Obtido: Asserções concluídas sem falha.
- Situação: **aprovado**
- Evidência: docs/e2e-results.json; tests/e2e/flows.spec.ts

## TP23 — ONF06 cookie seguro e CSRF

Rastreabilidade: ONF06
- Pré-condições: Login válido local.
- Passos: Inspecionar cookie e enviar POST com origem estrangeira.
- Esperado: HttpOnly, SameSite Lax e HTTP 403; Secure/HTTPS cloud não avaliados.
- Obtido: Asserções concluídas sem falha.
- Situação: **aprovado**
- Evidência: docs/e2e-results.json; tests/e2e/flows.spec.ts

## TP24 — UC01 conta inativa, ONF02 sessão expirada e ONF03 endpoints protegidos

Rastreabilidade: ONF02, ONF03, UC01
- Pré-condições: Conta inativa de teste e usuário seed.
- Passos: Tentar login inativo; expirar sessão; chamar endpoint sem cookie.
- Esperado: Credenciais genéricas, retorno ao login e HTTP 401.
- Obtido: Asserções concluídas sem falha.
- Situação: **aprovado**
- Evidência: docs/e2e-results.json; tests/e2e/flows.spec.ts

## TP25 — ONF06 HTTPS público, Secure e autenticação obrigatória

Rastreabilidade: ONF06
- Pré-condições: Produção publicada por HTTPS; contas seed fictícias.
- Passos: Acessar login público; autenticar; inspecionar cookie; testar origem estrangeira e logout.
- Esperado: HTTP 200, cookie Secure/HttpOnly/SameSite=Lax; CSRF 403; rota protegida redireciona.
- Obtido: Asserções concluídas sem falha.
- Situação: **aprovado**
- Evidência: docs/deployment-e2e-results.json; tests/deployment/production.spec.ts

## TP26 — UC01–UC10 fluxo publicado com banco Neon

Rastreabilidade: UC01, UC02, UC03, UC04, UC05, UC06, UC07, UC08, UC09, UC10
- Pré-condições: Vercel READY e Neon demo acessível.
- Passos: Usuário abre; técnico assume, prioriza, pausa, soluciona e encerra; admin cria, edita e desativa conta e consulta relatório; usuário relê solução.
- Esperado: Operações gravadas no Neon e refletidas na interface; dados persistem entre logins.
- Obtido: Asserções concluídas sem falha.
- Situação: **aprovado**
- Evidência: docs/deployment-e2e-results.json; tests/deployment/production.spec.ts

## TP27 — Disponibilidade durante 14 dias

Rastreabilidade: ONF04
- Pré-condições: Aplicação publicada ou ambiente de auditoria disponível.
- Passos: Executar verificação no ambiente indicado e registrar evidência.
- Esperado: Critério do requisito atendido.
- Obtido: Publicado em 15/11/2026; 14 dias ainda não transcorridos; data de entrega e responsável pendentes.
- Situação: **bloqueado**
- Evidência: Nenhuma evidência de execução.

## TP28 — Reinício completo do processo em produção

Rastreabilidade: ONF04
- Pré-condições: Aplicação publicada ou ambiente de auditoria disponível.
- Passos: Executar verificação no ambiente indicado e registrar evidência.
- Esperado: Critério do requisito atendido.
- Obtido: Reconexão local e releitura entre sessões publicadas aprovadas; reinício controlado ainda não executado.
- Situação: **não executado**
- Evidência: Nenhuma evidência de execução.

## TP29 — Responsividade de todas as oito telas e revisão completa de teclado

Rastreabilidade: ONF01, ONF05
- Pré-condições: Aplicação publicada ou ambiente de auditoria disponível.
- Passos: Executar verificação no ambiente indicado e registrar evidência.
- Esperado: Critério do requisito atendido.
- Obtido: Teste automatizado de larguras cobre a lista; auditoria completa ainda não executada.
- Situação: **não executado**
- Evidência: Nenhuma evidência de execução.

