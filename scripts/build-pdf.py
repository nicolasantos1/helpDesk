"""Rebuild consolidated academic construction report from actual evidence."""
from pathlib import Path
import json,html
from reportlab.platypus import SimpleDocTemplate,Paragraph,Spacer,PageBreak,Table,TableStyle,Image,KeepTogether
from reportlab.lib.styles import ParagraphStyle
from reportlab.lib.enums import TA_CENTER,TA_JUSTIFY
from reportlab.lib.units import cm
from reportlab.lib import colors
from reportlab.lib.pagesizes import A4
from reportlab.graphics.shapes import Drawing,Rect,String,Line,Polygon
from reportlab.pdfbase import pdfmetrics
from reportlab.pdfbase.ttfonts import TTFont
from reportlab.platypus.tableofcontents import TableOfContents
ROOT=Path(__file__).resolve().parents[1]
font='/usr/share/fonts/liberation/'
if Path(font+'LiberationSerif-Regular.ttf').exists():
 for suffix,file in [('','Regular'),('-Bold','Bold')]:pdfmetrics.registerFont(TTFont('Academic'+suffix,font+f'LiberationSerif-{file}.ttf'))
else:
 font='/usr/share/fonts/truetype/dejavu/'
 for suffix,file in [('','DejaVuSerif.ttf'),('-Bold','DejaVuSerif-Bold.ttf')]:pdfmetrics.registerFont(TTFont('Academic'+suffix,font+file))
body=ParagraphStyle('Body',fontName='Academic',fontSize=12,leading=18,alignment=TA_JUSTIFY,firstLineIndent=1.25*cm,spaceAfter=10)
heading=ParagraphStyle('Heading',parent=body,fontName='Academic-Bold',firstLineIndent=0,spaceBefore=14,spaceAfter=18,keepWithNext=True)
small=ParagraphStyle('Small',parent=body,fontSize=10,leading=12,firstLineIndent=0,alignment=0,spaceAfter=8)
center=ParagraphStyle('Center',parent=body,alignment=TA_CENTER,firstLineIndent=0)
mini=ParagraphStyle('Mini',parent=small,fontSize=9,leading=12)
caption=ParagraphStyle('FigureCaption',parent=small)
tablecaption=ParagraphStyle('TableCaption',parent=small)
class NamedTOC(TableOfContents):
 def __init__(self,kind):
  super().__init__();self.kind=kind
 def notify(self,kind,stuff):
  if kind==self.kind:super().notify('TOCEntry',stuff)
figuretoc=NamedTOC('FigureEntry');tabletoc=NamedTOC('TableEntry')
for listing in [figuretoc,tabletoc]:listing.levelStyles=[ParagraphStyle('ListItem',fontName='Academic',fontSize=11,leading=22)]
table_titles=iter(['Perfis e escopos','Regras de integridade','Requisitos não funcionais','Entidades persistidas','Transições de estado','Métricas reais de teste'])
table_count=0
story=[]
def p(text,style=body):return Paragraph(html.escape(str(text)).replace('\n','<br/>'),style)
def para(text):story.append(p(text))
def h(text):story.append(p(text,heading))
def page():story.append(PageBreak())
def table(headers,rows,widths=None):
 global table_count
 table_count+=1
 story.append(p(f'Tabela {table_count} - {next(table_titles)}',tablecaption))
 data=[[p(x,mini) for x in headers]]+[[p(x,mini) for x in row] for row in rows]
 widths=[w*430/450 for w in widths] if widths else None
 t=Table(data,colWidths=widths,repeatRows=1,hAlign='LEFT');t.setStyle(TableStyle([('VALIGN',(0,0),(-1,-1),'TOP'),('BACKGROUND',(0,0),(-1,0),colors.HexColor('#e8ece9')),('LINEBELOW',(0,0),(-1,0),.7,colors.black),('LINEBELOW',(0,-1),(-1,-1),.7,colors.black),('TOPPADDING',(0,0),(-1,-1),7),('BOTTOMPADDING',(0,0),(-1,-1),7)]));story.append(t);story.append(Spacer(1,12))
def diagram(nodes,edges,title):
 story.append(p(title,caption));d=Drawing(450,125)
 for x,y,label in nodes:
  d.add(Rect(x,y,130,40,rx=4,fillColor=colors.HexColor('#f1f3f1'),strokeColor=colors.black))
  for i,line in enumerate(label.split('\n')):d.add(String(x+65,y+25-i*13,line,textAnchor='middle',fontName='Academic',fontSize=10))
 for x1,y1,x2,y2,label in edges:
  d.add(Line(x1,y1,x2,y2));d.add(Polygon([x2,y2,x2-5,y2+3,x2-5,y2-3],fillColor=colors.black));d.add(String((x1+x2)/2,(y1+y2)/2+7,label,textAnchor='middle',fontName='Academic',fontSize=8))
 story.append(d);story.append(p('Fonte: elaboração com base no código implementado e na documentação do grupo (2026).',small))
class Doc(SimpleDocTemplate):
 def afterFlowable(self,f):
  if isinstance(f,Paragraph) and f.style.name=='FigureCaption':self.notify('FigureEntry',(0,f.getPlainText(),self.page-1))
  if isinstance(f,Paragraph) and f.style.name=='TableCaption':self.notify('TableEntry',(0,f.getPlainText(),self.page-1))
  if isinstance(f,Paragraph) and f.style.name=='Heading' and not f.getPlainText().startswith(('UC','TP')):self.notify('TOCEntry',(0,f.getPlainText(),self.page-1))
def footer(c,d):
 if d.page>=5:c.setFont('Academic',10);c.drawRightString(A4[0]-2*cm,A4[1]-2*cm,str(d.page-1))
Path(ROOT/'output/pdf').mkdir(parents=True,exist_ok=True)
doc=Doc(str(ROOT/'output/pdf/HelpDesk_Documentacao_Construcao.pdf'),pagesize=A4,leftMargin=3*cm,rightMargin=2*cm,topMargin=3*cm,bottomMargin=2*cm,title='HelpDesk - Documentação de construção',author='Grupo Best Project')
members=['ANA CLARA CÂNDIDO PEREIRA','ANA LAURA ALI MAGRAO','LUANA MARTINS ARIMITSU','MARCELLE DE SOUZA FONTOURA SILVA','NICOLAS SANTOS DO NASCIMENTO']
for text in ['UNIVERSIDADE PRESBITERIANA MACKENZIE','Análise e Desenvolvimento de Sistemas','Prática Profissional em ADS']:
 story.append(p(text,center))
story.append(Spacer(1,35))
for name in members:story.append(p(name,center))
story.append(Spacer(1,65));story.append(p('HELPDESK',ParagraphStyle('Title',parent=center,fontName='Academic-Bold',fontSize=16,leading=22)))
story.append(p('Sistema Web de Gerenciamento de Chamados de TI',center));story.append(Spacer(1,25));story.append(p('Documentação consolidada de construção\nVersão para revisão do grupo',center));story.append(Spacer(1,80));story.append(p('SÃO PAULO\n2026',center));page()
for name in members:story.append(p(name,center))
story.append(Spacer(1,65));story.append(p('HELPDESK\nSistema Web de Gerenciamento de Chamados de TI',center));story.append(Spacer(1,50));story.append(Paragraph('Relatório de construção apresentado à disciplina Prática Profissional em Análise e Desenvolvimento de Sistemas da Universidade Presbiteriana Mackenzie. Consolida concepção, requisitos, implementação e resultados reais de validação. Orientador: pendente de informação do grupo.',ParagraphStyle('Nature',parent=small,leftIndent=7*cm,leading=14)));story.append(Spacer(1,100));story.append(p('SÃO PAULO\n2026',center));page()
story.append(p('SUMÁRIO',center));toc=TableOfContents();toc.levelStyles=[ParagraphStyle('toc',fontName='Academic',fontSize=11,leading=20)];story.append(toc);page()
story.append(p('LISTA DE FIGURAS',center));story.append(figuretoc);story.append(Spacer(1,32));story.append(p('LISTA DE TABELAS',center));story.append(tabletoc);page()
h('1 INTRODUÇÃO E OBJETIVOS')
para('O HelpDesk centraliza solicitações de suporte de TI, permitindo o acompanhamento pelo solicitante, o atendimento por técnicos e a administração de contas e relatórios. O grupo Best Project definiu o escopo nos documentos Projeto, Documentação do projeto - segunda versão e Diagrama de implantação - iteração 1 (Grupo Best Project, 2026).')
para('O objetivo desta construção é transformar os artefatos acadêmicos em uma aplicação persistente e verificável. A implementação utiliza um único repositório com Next.js, TypeScript, Tailwind CSS, Prisma e PostgreSQL. A validação local utiliza PostgreSQL 17 em Docker, Vitest e Chromium via Playwright.')
para('Esta versão não declara concluída a entrega acadêmica. A publicação e os testes online foram concluídos. Comprovação de disponibilidade por 14 dias, vídeo e responsabilidades administrativas ainda devem ser confirmados na revisão final. Os resultados apresentados derivam dos arquivos JSON produzidos pelas ferramentas; nenhum resultado bloqueado foi contado como aprovado.')
para('Os integrantes e polos foram preservados das fontes: Ana Clara Cândido Pereira (Patrocínio), Ana Laura Ali Magrao (Perdizes II), Luana Martins Arimitsu (Higienopolis), Marcelle de Souza Fontoura Silva (Rio de Janeiro) e Nicolas Santos do Nascimento (Higienopolis).')
para('Repositório: https://github.com/nicolasantos1/helpDesk. Quadro de acompanhamento: https://github.com/users/nicolasantos1/projects/2. As alterações permanecem na branch tunicate, sem envio direto à main.')
page();h('2 REQUISITOS E REGRAS DO DOMÍNIO')
table(['Perfil','Escopo'],[['Usuário','Abre e consulta somente os próprios chamados.'],['Técnico','Consulta a fila; assume disponíveis; altera e encerra somente os próprios atendimentos.'],['Administrador','Consulta todos os chamados; mantém contas e consulta relatórios. Não herda funções de técnico.']],[95,355])
para('Os objetivos OF01–OF10 são rastreados nos dez casos de uso da seção seguinte. Permanecem fora de escopo anexos, reabertura, notificações automáticas, metas de SLA e integrações externas, conforme a segunda versão.')
table(['Código','Regra implementada'],[['RN01','Número único, Aberto, prioridade Média e histórico inicial.'],['RN02','Atribuição somente se Aberto e sem técnico; no máximo um responsável.'],['RN03','Modificações exclusivas do técnico responsável; leitura depende do perfil.'],['RN04','Solução altera para Solucionado; encerramento exige confirmação separada.'],['RN05','Fechado preserva dados e histórico; não admite novas alterações.'],['RN06','Comparação e incremento de versão impedem perda silenciosa de atualização.']],[55,395])
page();h('2.1 REQUISITOS NÃO FUNCIONAIS')
table(['Código','Critério e situação'],[['ONF01','Rótulos, validação, preservação dos campos e mensagens; revisão integral de usabilidade pendente.'],['ONF02','Telas e operações exigem sessão válida. Testes sem sessão e sessão expirada aprovados.'],['ONF03','Autorização no servidor por perfil e vínculo. Testes de acesso indevido aprovados.'],['ONF04','Persistência, transações e concorrência. Reconexão e rollback por integridade aprovados; reinício em produção pendente.'],['ONF05','360, 768 e 1366 pixels, foco e teclado. Lista aprovada; todas as telas ainda requerem auditoria.'],['ONF06','Hash com sal, sessão protegida e HTTPS. Login e cookie local aprovados; HTTPS e cookie Secure publicados aprovados.']],[60,390])
para('Os critérios preservam a Tabela 4 da segunda versão. Uma aprovação parcial de teste não promove automaticamente todo o requisito não funcional à condição de concluído.')
page();h('3 CASOS DE USO E RASTREABILIDADE')
ucs=[('UC01','Login','Todos os perfis; e-mail/senha, conta ativa, sessão segura e logout. Credenciais inválidas têm mensagem genérica.','T01'),('UC02','Abrir chamado','Usuário informa título/categoria/descrição; chamado e histórico inicial são gravados atomicamente.','T02/T03'),('UC03','Consultar chamado','Lista, filtros e detalhes; solicitante restrito aos próprios registros. Não revelar chamado indisponível.','T02/T04/T05'),('UC04','Assumir chamado','Técnico, Aberto e sem responsável; disputa por versão deixa apenas uma atribuição válida.','T05/T06'),('UC05','Atualizar status','Responsável pausa ou retoma entre Em atendimento e Aguardando; status igual não gera evento.','T06'),('UC06','Registrar solução','Responsável em atendimento ou aguardando; texto obrigatório, solução/status/histórico na mesma transação.','T06'),('UC07','Encerrar chamado','Responsável confirma; exige Solucionado e solução; salva data e evento, bloqueia novas alterações.','T06'),('UC08','Gerenciar usuários','Administrador cadastra/edita/desativa; e-mail único; impede alterações próprias de perfil/desativação e técnico ocupado.','T07'),('UC09','Definir prioridade','Responsável define Baixa/Média/Alta; proibido em Solucionado ou Fechado.','T06'),('UC10','Consultar relatórios','Administrador informa período de abertura; inclui dias inicial/final e totaliza status/prioridade/categoria.','T08')]
for code,title,desc,screen in ucs:
 story.append(KeepTogether([p(f'{code} - {title} ({screen})',heading),p(desc)]))
page();h('4 ARQUITETURA E PERSISTÊNCIA')
para('A camada de apresentação usa páginas App Router e formulários React. Route Handlers recebem operações JSON e validam origem. Os serviços revalidam conta ativa e perfil; Zod valida entradas. Prisma executa transações PostgreSQL. Essa separação corresponde às responsabilidades de controladores, serviços e persistência previstas na segunda versão.')
diagram([(0,60,'Navegador\nInterface React'),(160,60,'Next.js / serviços\nVercel: publicado'),(320,60,'PostgreSQL\nNeon: PostgreSQL 17')],[(130,80,160,80,'HTTPS'),(290,80,320,80,'TLS')],'Figura 1 - Implantação da aplicação')
para('Ambientes validados: Node.js 24 e PostgreSQL local, além de Vercel e Neon em us-east-1. A aplicação está publicada em https://helpdeskiweti.vercel.app. O deploy dpl_EQAkZ4Y85Hot1TSDLt36RvuwPm5b foi confirmado READY em 15 nov. 2026; os testes online constam da seção 7.')
table(['Entidade','Responsabilidade e integridade'],[['User','UUID; e-mail único; hash, perfil, situação e versão. Desativação sem excluir autoria.'],['Session','Hash do token, conta e vencimento; nunca persiste token em texto puro.'],['Ticket','Número sequencial; solicitante/categoria obrigatórios; técnico opcional no início, status, prioridade e versão.'],['History','Evento, autor, instante, descrição e estados. Trigger diferida exige histórico ao final do commit.'],['Solution','Uma por chamado; texto e data obrigatórios em Solucionado/Fechado.'],['Category','Catálogo inicial de Hardware, Software, Rede e Acessos.']],[80,370])
page();h('4.1 ESTADOS E TRANSIÇÕES')
table(['Origem','Operação','Destino'],[['Aberto','Assumir (UC04)','Em atendimento'],['Em atendimento','Pausar (UC05)','Aguardando'],['Aguardando','Retomar (UC05)','Em atendimento'],['Em atendimento ou Aguardando','Registrar solução (UC06)','Solucionado'],['Solucionado','Confirmar encerramento (UC07)','Fechado']],[135,180,135])
para('Apenas o técnico responsável executa as transições após a atribuição. Chamado fechado é terminal. A solução não pode ser substituída após Solucionado. A prioridade só pode mudar enquanto Em atendimento ou Aguardando. Selecionar o status ou prioridade atuais não acrescenta evento artificial ao histórico.')
para('Sequência de atribuição: interface envia id e versão; serviço revalida conta técnica, bloqueia conta, lê chamado, verifica estado; update condicional altera responsável, status e versão; evento é criado; commit confirma a unidade. Em conflito, a segunda transação não produz alteração parcial.')
para('Sequência de solução: validar texto e responsável; comparar versão; gravar status Solucionado, solução e histórico; commit. Encerramento é uma nova requisição com confirmação e versão atuais, mantendo a solução já salva caso a nova operação falhe.')
page();h('5 TRANSAÇÕES, SEGURANÇA E DECISÕES')
para('Abertura grava chamado e primeiro evento em operação aninhada. Atualizações comparam id e versão, incrementam a versão e gravam histórico e eventual solução em uma única transação. Em conflito retorna HTTP 409 e a interface atualiza os dados. A atribuição e a mudança administrativa compartilham bloqueio da conta técnica para evitar desativação simultânea à atribuição.')
para('Relatórios utilizam snapshot Repeatable Read para assegurar totalizações consistentes. As datas são interpretadas como dias civis no fuso America/Sao_Paulo (UTC-03 no período contemporâneo); a consulta usa início inclusivo e início do dia seguinte ao fim como limite exclusivo. Não se pretende suportar as regras históricas de horário de verão anteriores a 2019.')
para('Senhas utilizam bcrypt com custo 12. A sessão tem token aleatório de 256 bits e expiração absoluta de oito horas. O cookie é HttpOnly, SameSite=Lax e Secure em produção. POST exige origem exata e JSON; entradas e autorização são verificadas no servidor. Erros técnicos não retornam detalhes internos ao cliente.')
para('Decisões não especificadas nos PDFs: título 3–160 caracteres, descrição 10–10.000, solução não vazia até 10.000; senha inicial 12–72; catálogo fixo de categorias e listagem limitada a 200 resultados filtrados. Relatórios abrangem todos os registros. A edição de conta revoga sessões anteriores.')
para('Limitações operacionais: não há recuperação de senha nem limitação distribuída de tentativas de login. Esses controles precisam ser definidos antes de uso com dados reais. O banco de demonstração contém exclusivamente registros fictícios. HTTPS, cookie Secure/HttpOnly/SameSite=Lax e bloqueio CSRF foram verificados na aplicação pública, além dos testes locais.')
page();h('6 INTERFACES E PROTÓTIPOS IMPLEMENTADOS')
para('As oito telas previstas foram mapeadas às rotas: T01 /login; T02 e T05 /chamados conforme perfil; T03 /chamados/novo; T04 e T06 /chamados/[id]; T07 /usuarios; T08 /relatorios. As ações exibidas respeitam perfil e vínculo, com nova autorização no servidor.')
story.append(p('Figura 2 - Listagem real em 1366 pixels',caption));img=Image(str(ROOT/'docs/evidence/chamados-1366.png'));iw,ih=img.imageWidth,img.imageHeight;img.drawWidth=430;img.drawHeight=430*ih/iw;story.append(img);story.append(p('Fonte: captura real do Playwright, 15 nov. 2026. Dados fictícios.',small))
para('Formulários mostram carregamento, validação e retorno da operação. Listas vazias exibem orientação. Foco visível, layout adaptável e ausência de rolagem horizontal foram verificados na listagem em três larguras. Isso não substitui auditoria completa de acessibilidade das oito telas.')
page();h('6.1 EVIDÊNCIA RESPONSIVA')
story.append(p('Figura 3 - Listagem real em 360 pixels',caption));img=Image(str(ROOT/'docs/evidence/chamados-360.png'));iw,ih=img.imageWidth,img.imageHeight;img.drawHeight=540;img.drawWidth=540*iw/ih;story.append(img);story.append(p('Fonte: captura real do Playwright, 15 nov. 2026. A marcação dourada demonstra foco por teclado.',small))
page();h('6.2 ATENDIMENTO NA APLICAÇÃO PUBLICADA')
story.append(p('Figura 4 - Chamado encerrado no ambiente Vercel/Neon',caption));img=Image(str(ROOT/'docs/evidence/production-ticket.png'));iw,ih=img.imageWidth,img.imageHeight;img.drawWidth=430;img.drawHeight=430*ih/iw;story.append(img);story.append(p('Fonte: captura real do teste Playwright publicado, 15 nov. 2026. Chamado fictício com solução e histórico preservados.',small))
page();h('6.3 RELATÓRIO NA APLICAÇÃO PUBLICADA')
story.append(p('Figura 5 - Relatório consultado pelo administrador em produção',caption));img=Image(str(ROOT/'docs/evidence/production-report.png'));iw,ih=img.imageWidth,img.imageHeight;img.drawWidth=430;img.drawHeight=430*ih/iw;story.append(img);story.append(p('Fonte: captura real do teste Playwright publicado, 15 nov. 2026. Totais de chamados fictícios no período no instante da captura.',small))
para('A abertura e a consulta, o atendimento técnico e a gestão administrativa atravessaram as fronteiras de navegador, Route Handler, serviço e banco Neon. As capturas foram obtidas da aplicação HTTPS pública, não de protótipos.')
page();h('7 PLANO DE TESTES, RESULTADOS E MÉTRICAS')
plan=json.loads((ROOT/'docs/test-plan.json').read_text());m=plan['metrics']
para('O plano rastreia UC01–UC10 e ONF01–ONF06. Testes unitários exercitam regras puras; integração usa PostgreSQL real; E2E utiliza Chromium. O Apêndice A registra pré-condições, passos, esperado, obtido, situação e evidência de cada teste. A CI foi preparada, mas não foi executada remotamente nesta etapa.')
table(['Métrica','Resultado e cálculo'],[['Aprovação',f"{m['passed']}/{m['executed']} × 100 = {m['approval_percent']}%"],['Falha',f"{m['failed']}/{m['executed']} × 100 = {m['failure_percent']}%"],['Execução',f"{m['executed']}/{m['planned']} × 100 = {m['execution_percent']}%"],['Cobertura de UCs','10/10 × 100 = 100% com pelo menos um teste aprovado por UC.']],[140,310])
para('A última execução local aprovou 17 testes Vitest e sete Playwright. Os mesmos 17 testes Vitest também foram repetidos e aprovados no PostgreSQL Neon remoto por TLS; o artefato separado é docs/neon-test-results.json. A repetição não aumenta a contagem dos casos únicos. Dois cenários Playwright publicados também foram aprovados: HTTPS/sessão/CSRF e fluxo completo dos três perfis. O total de cenários únicos executados é 26. Três verificações adicionais permanecem bloqueadas ou não executadas. Cobertura por caso de uso não é cobertura de código, tampouco comprova todos os fluxos alternativos. Reconexão persistente foi testada; reinício completo em produção ainda está pendente.')
para('A disputa entre dois técnicos produziu uma única atribuição válida. O banco rejeitou criação sem histórico e reverteu a gravação. Foram verificados estados, prioridade, restrições administrativas e totais. Na aplicação publicada, um usuário abriu chamado; um técnico assumiu, alterou prioridade/status, solucionou e encerrou; o administrador cadastrou, editou e desativou uma conta fictícia e consultou relatórios; o usuário releu a solução persistida no Neon. Falhas intermediárias de redirecionamento e seletores foram corrigidas; as métricas refletem apenas a última execução registrada.')
para('Também foram concluídos npm run typecheck, npm run lint e npm run build. Após correção de dependências transitivas, npm audit informou zero vulnerabilidades conhecidas na execução. Essa constatação é pontual e não equivale a uma avaliação completa de segurança.')
page();h('8 PUBLICAÇÃO, DEMONSTRAÇÃO E ACOMPANHAMENTO')
para('O procedimento reproduzível e os identificadores de infraestrutura estão em docs/DEPLOYMENT.md. As URLs Neon pooled e direta por TLS foram armazenadas como segredos de Production após autorização explícita. As migrations e o seed foram aplicados antes da publicação. O domínio canônico público foi testado sem autenticação Vercel; URLs internas mantêm proteção da plataforma. Segredos de banco não devem aparecer em Git, PDF ou gravação.')
para('Contas de demonstração: usuario@helpdesk.test, tecnico@helpdesk.test, tecnico2@helpdesk.test e admin@helpdesk.test. As credenciais de cloud são geradas separadamente e devem ser compartilhadas de forma privada, com possibilidade de substituição. O PDF não inclui senha real nem identificador de sessão.')
para('O projeto Neon helpdesk-best-project (rough-bread-02478903), PostgreSQL 17 em us-east-1, foi criado com branch demo isolada. Migrations e seed foram aplicados via TLS. Após login deliberado do usuário, a CLI criou o projeto Vercel helpdesk-best-project em iweti-team e concluiu a publicação. URL real: https://helpdeskiweti.vercel.app. Dois testes de navegador online passaram em 21,1 segundos. O build remoto foi aprovado em 23 segundos. A manutenção por 14 dias será contada a partir da entrega, cuja data ainda não foi informada. Definir responsável, revisar limites do plano e verificar disponibilidade diariamente.')
para('O responsável pelo Fórum e a regra operacional de acompanhamento por 36 horas após cada questionamento permanecem pendentes. O solicitante informou não dispor dessa definição. Nenhuma atribuição pessoal foi inventada.')
para('Vídeo: gravação e link pendentes. O roteiro de oito minutos reserva 40 segundos para apresentação, 40 para login, um minuto para abertura/consulta, 50 segundos para atribuição, 70 para status/prioridade, 55 para solução/fechamento, 65 para administração, 55 para relatórios e 45 para testes/conclusão. O roteiro completo está em docs/VIDEO.md.')
page();h('9 CONCLUSÃO')
para('A construção converteu os requisitos em arquivos executáveis com autenticação, autorização, chamados, administração e relatórios. A validação comprovou comportamentos no ambiente local com banco real e navegador. O histórico transacional e o controle de concorrência são implementados no backend, não simulados nas telas.')
para('Para encerrar a entrega, o grupo deve registrar disponibilidade durante o prazo exigido, gravar o vídeo, definir o acompanhamento no Fórum e revisar esta versão com o modelo institucional e a orientação da disciplina. A documentação preserva a distinção entre comportamento implementado, teste aprovado e requisito ainda pendente.')
h('REFERÊNCIAS')
refs=[
'GRUPO BEST PROJECT. Projeto HelpDesk: concepção inicial. Universidade Presbiteriana Mackenzie, 2026. Arquivo Projeto (3).pdf fornecido pelo grupo.',
'GRUPO BEST PROJECT. HelpDesk: documentação do projeto, segunda versão. Universidade Presbiteriana Mackenzie, 2026. Arquivo HelpDesk_Documentacao (1).pdf fornecido pelo grupo.',
'GRUPO BEST PROJECT. Diagrama de implantação: iteração 1. Universidade Presbiteriana Mackenzie, 2026. Arquivo fornecido pelo grupo.',
'VERCEL. Next.js: installation. Disponível em: https://nextjs.org/docs/app/getting-started/installation. Acesso em: 15 nov. 2026. Guias de autenticação, cookies e Route Handlers também consultados no pacote Next.js 16.4.6 instalado.',
'PRISMA. Prisma schema API: versão 6. Disponível em: https://www.prisma.io/docs/orm/v6/reference/prisma-schema-reference. Acesso em: 15 nov. 2026.',
'UNIVERSIDADE DE SÃO PAULO. Guia para elaboração de trabalhos de conclusão de curso: ABNT NBR 14724:2024. Biblioteca da FOB-USP. Disponível em: https://sddarquivos.webhostusp.sti.usp.br/arquivos/Guia_TCC_convencional_FOB-USP.html. Acesso em: 15 nov. 2026.',
'UNIVERSIDADE PRESBITERIANA MACKENZIE. A1 e A2: Prática Profissional em ADS. AVA Mackenzie, 2026. Referências mantidas da documentação do grupo; conteúdo restrito ao AVA não revalidado nesta construção.'
]
for ref in refs:story.append(p(ref,small))
page();h('APÊNDICE A - REGISTROS DOS TESTES')
for x in plan['cases']:
 block=[p(f"{x['id']} - {x['title']}",heading)]
 for label,key in [('Requisito','related'),('Pré-condições','preconditions'),('Passos','steps'),('Esperado','expected'),('Obtido','obtained'),('Situação','status'),('Evidência','evidence')]:
  value=', '.join(x[key]) if isinstance(x[key],list) else x[key];block.append(p(f'{label}: {value}',small))
 story.append(KeepTogether(block));story.append(Spacer(1,14))
doc.multiBuild(story,onFirstPage=footer,onLaterPages=footer)
print(doc.filename)
