"""Generate traceable results only from the latest real test-run artifacts."""
import json,re
from pathlib import Path
v=json.loads(Path('docs/test-results.json').read_text()); e=json.loads(Path('docs/e2e-results.json').read_text())
rows=[]
metadata=[
 ('HTTPS público','Produção publicada por HTTPS; contas seed fictícias.','Acessar login público; autenticar; inspecionar cookie; testar origem estrangeira e logout.','HTTP 200, cookie Secure/HttpOnly/SameSite=Lax; CSRF 403; rota protegida redireciona.'),
 ('fluxo publicado','Vercel READY e Neon demo acessível.','Usuário abre; técnico assume, prioriza, pausa, soluciona e encerra; admin cria, edita e desativa conta e consulta relatório; usuário relê solução.','Operações gravadas no Neon e refletidas na interface; dados persistem entre logins.'),
 ('campos obrigatórios','Sem sessão necessária; função pura.','Submeter título, descrição e categoria inválidos.','Validação rejeita os dados.'),
 ('administrador não assume','Administrador e chamado aberto.','Solicitar atribuição com perfil administrador.','Atribuição recusada.'),
 ('transição direta','Técnico responsável; em atendimento.','Solicitar mudança direta para Fechado.','Transição recusada.'),
 ('exige solução','Chamado Solucionado sem solução.','Solicitar encerramento confirmado.','Encerramento recusado.'),
 ('integralmente','Datas civis válidas.','Converter período em limites UTC.','Início UTC-03 e fim exclusivo no dia seguinte.'),
 ('datas invertidas','Função de período disponível.','Enviar intervalo invertido e 30 de fevereiro.','Ambas entradas rejeitadas.'),
 ('padrões','Usuário ativo e categoria existente.','Abrir e consultar um chamado.','Aberto, Média e exatamente um evento inicial.'),
 ('parcial','Usuário ativo; UUID de categoria inexistente.','Tentar abrir e comparar contagem antes/depois.','Erro; nenhum chamado criado.'),
 ('outro solicitante','Dois solicitantes ativos.','Abrir com um e ler/listar com o outro.','Leitura recusada e lista sem registro alheio.'),
 ('concorrente','Dois técnicos ativos; chamado versão zero.','Disparar duas atribuições simultâneas.','Um sucesso, uma rejeição, um responsável, dois eventos totais.'),
 ('rejeita administrador e conta inativa','Chamado aberto, administrador e técnico inativo.','Tentar atribuição com cada perfil.','Operações rejeitadas.'),
 ('fluxo completo, proprietário','Chamado aberto e dois técnicos.','Assumir; testar terceiro, versão obsoleta, status, prioridade, solução e encerramento.','Somente mudanças válidas; versão seis, sete eventos, solução e data final preservadas.'),
 ('restrições próprias','Administrador; técnico com chamado não fechado.','Desativar/mudar perfil do técnico; desativar próprio admin; repetir e-mail.','Todas rejeitadas; usuário comum não administra.'),
 ('cadastro, edição','Administrador ativo.','Cadastrar conta fictícia, editar nome e desativar.','Conta mantida no banco e inativa.'),
 ('totais consistentes','Administrador; chamados no banco.','Consultar período amplo, vazio, invertido e acesso técnico.','Grupos somam total; vazio zero; inválido e técnico recusados.'),
 ('reconexão','Registro persistido em PostgreSQL.','Desconectar cliente e consultar com nova conexão.','Mesmo título persistido; não equivale a reiniciar host.'),
 ('sem histórico','Conta e categoria existentes.','Inserir diretamente sem histórico e contar registros.','Trigger rejeita commit; contagem inalterada.'),
 ('login, inválido','Seed aplicado; navegador sem sessão.','Abrir rota protegida; login inválido e válido; sair.','Redirecionamento, mensagem genérica, sessão válida e logout.'),
 ('fluxo pela interface','Seed com três perfis.','Abrir; técnico assume, prioriza, pausa, soluciona e fecha; admin abre usuários/relatórios.','Fluxo concluído e telas dos perfis acessíveis.'),
 ('responsividade','Seed; Chromium.','Entrar na largura indicada, verificar scroll, focar marca e usar Tab.','Sem overflow horizontal da lista; foco chega ao link Chamados; screenshot real.'),
 ('cookie seguro','Login válido local.','Inspecionar cookie e enviar POST com origem estrangeira.','HttpOnly, SameSite Lax e HTTP 403; Secure/HTTPS cloud não avaliados.'),
 ('sessão expirada','Conta inativa de teste e usuário seed.','Tentar login inativo; expirar sessão; chamar endpoint sem cookie.','Credenciais genéricas, retorno ao login e HTTP 401.')
]
def add(title,status,source):
 item=next((x for x in metadata if x[0] in title),None)
 if item is None: raise ValueError('Missing test metadata: '+title)
 codes=set(re.findall(r'(?:UC|ONF)\d{2}',title))
 if 'UC01–UC10' in title: codes.update(f'UC{i:02}' for i in range(1,11))
 if 'UC02–UC09' in title: codes.update(f'UC{i:02}' for i in range(2,10))
 if 'fluxo completo, proprietário' in title: codes.update(['UC05','UC06','UC07','UC09'])
 rows.append(dict(id=f'TP{len(rows)+1:02}',title=title,related=sorted(codes),preconditions=item[1],steps=item[2],expected=item[3],obtained='Asserções concluídas sem falha.' if status=='passed' else 'Consultar artefato de execução.',status={'passed':'aprovado','failed':'reprovado'}.get(status,'não executado'),evidence=source))
for f in v['testResults']:
 for t in f['assertionResults']: add(t['title'],t['status'],'docs/test-results.json; '+Path(f['name']).name)
def specs(s):
 for x in s.get('specs',[]):yield x
 for child in s.get('suites',[]):yield from specs(child)
for suite in e['suites']:
 for t in specs(suite):add(t['title'],'passed' if t['ok'] else 'failed','docs/e2e-results.json; tests/e2e/flows.spec.ts')
deployment=Path('docs/deployment-e2e-results.json')
if deployment.exists():
 for suite in json.loads(deployment.read_text())['suites']:
  for t in specs(suite):add(t['title'],'passed' if t['ok'] else 'failed','docs/deployment-e2e-results.json; tests/deployment/production.spec.ts')
for title,codes,reason in [('Disponibilidade durante 14 dias',['ONF04'],'Publicado em 15/11/2026; 14 dias ainda não transcorridos; data de entrega e responsável pendentes.'),('Reinício completo do processo em produção',['ONF04'],'Reconexão local e releitura entre sessões publicadas aprovadas; reinício controlado ainda não executado.'),('Responsividade de todas as oito telas e revisão completa de teclado',['ONF01','ONF05'],'Teste automatizado de larguras cobre a lista; auditoria completa ainda não executada.')]:
 rows.append(dict(id=f'TP{len(rows)+1:02}',title=title,related=codes,preconditions='Aplicação publicada ou ambiente de auditoria disponível.',steps='Executar verificação no ambiente indicado e registrar evidência.',expected='Critério do requisito atendido.',obtained=reason,status='bloqueado' if 'pendente' in reason.lower() or 'configurada' in reason else 'não executado',evidence='Nenhuma evidência de execução.'))
passed=sum(x['status']=='aprovado' for x in rows);failed=sum(x['status']=='reprovado' for x in rows);executed=passed+failed
uc=sorted({c for x in rows if x['status']=='aprovado' for c in x['related'] if c.startswith('UC')})
metrics=dict(planned=len(rows),executed=executed,passed=passed,failed=failed,approval_percent=round(100*passed/executed,2),failure_percent=round(100*failed/executed,2),execution_percent=round(100*executed/len(rows),2),use_cases=uc,use_case_coverage_percent=len(uc)*10)
Path('docs/test-plan.json').write_text(json.dumps(dict(metrics=metrics,cases=rows),ensure_ascii=False,indent=2)+'\n')
lines=['# Plano e relatório de testes','', 'Gerado a partir de execuções reais. Cobertura de casos de uso indica presença de teste aprovado, não cobertura exaustiva de caminhos nem cobertura de código.','',f"{passed}/{executed} executados aprovados; {len(rows)} planejados. Aprovação {metrics['approval_percent']}%; falha {metrics['failure_percent']}%; execução {metrics['execution_percent']}%; UCs cobertos {len(uc)}/10 ({metrics['use_case_coverage_percent']}%).",'', 'Validação adicional no Neon: os mesmos 17 testes Vitest foram repetidos contra a branch demo e aprovados, conforme docs/neon-test-results.json. Essa repetição não aumenta o total de casos únicos.', '', 'Falhas intermediárias: ajuste de redirecionamento sem sessão, seletores ambíguos e uma expectativa textual do teste foram corrigidos. Métricas refletem a última execução. Não representam ausência de defeitos.','']
for x in rows:
 lines += [f"## {x['id']} — {x['title']}",'',f"Rastreabilidade: {', '.join(x['related'])}",f"- Pré-condições: {x['preconditions']}",f"- Passos: {x['steps']}",f"- Esperado: {x['expected']}",f"- Obtido: {x['obtained']}",f"- Situação: **{x['status']}**",f"- Evidência: {x['evidence']}",'']
Path('docs/TESTS.md').write_text('\n'.join(lines)+'\n');print(json.dumps(metrics,ensure_ascii=False))
