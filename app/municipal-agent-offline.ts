"use client";

import type { MunicipalAgentActionType, MunicipalAgentPayload, MunicipalAgentTurnResult } from "./municipal-agent-types";

function normalize(value: string) { return value.normalize("NFD").replace(/[\u0300-\u036f]/g, "").toLowerCase().replace(/[^a-z0-9\s]/g, " ").replace(/\s+/g, " ").trim(); }
function emptyPayload(): MunicipalAgentPayload { return { title:"",description:"",department:"",priority:"",dueDate:"",dueAt:"",neighborhood:"",address:"",assignee:"",slaHours:0,kind:"",startsAt:"",endsAt:"",location:"",targetDepartments:[],ticketProtocol:"",status:"",owner:"",target:0,current:0,unit:"",placeType:"",tags:[],navTarget:"" }; }
function currentDepartment(context: unknown, departments: string[]) {
  const source = context && typeof context === "object" ? context as Record<string, unknown> : {};
  const currentUser = source.currentUser && typeof source.currentUser === "object" ? source.currentUser as Record<string, unknown> : {};
  const values = [currentUser.department, source.viewedDepartment].filter((value): value is string => typeof value === "string" && Boolean(value.trim()));
  for (const value of values) { const found = departments.find((department) => normalize(department) === normalize(value)); if (found) return found; }
  return values[0] || "";
}
function departmentByHint(text: string, departments: string[], fallback = "") {
  const n = normalize(text);
  const rules: Array<[string[], string[]]> = [
    [["familia","familiar","cras","creas","assistencia social","vulnerabilidade"],["desenvolvimento social","assistencia social"]],
    [["saude","ubs","medicamento","medico","hospital"],["saude"]],
    [["escola","educacao","professor","aluno","creche"],["educacao"]],
    [["obra","buraco","asfalto","poste","iluminacao","estrada","transporte"],["infraestrutura","transporte","obras"]],
    [["lixo","meio ambiente","arvore","coleta"],["meio ambiente","agricultura"]],
    [["evento","cerimonial","divulgacao","comunicacao"],["comunicacao","eventos"]],
    [["financeiro","licitacao","contrato","iptu","alvara"],["administracao","financas"]],
  ];
  for (const [words, hints] of rules) {
    if (!words.some((word) => n.includes(word))) continue;
    const found = departments.find((department) => hints.some((hint) => normalize(department).includes(hint)));
    if (found) return found;
  }
  return fallback;
}
function neighborhood(text: string) { const match=text.match(/(?:no|na|do|da|em)?\s*\bbairro\s+([A-Za-zÀ-ÿ0-9][A-Za-zÀ-ÿ0-9' .-]{0,70})/i); return match ? match[1].split(/\s+(?:na|no|em|para|por|porque|com|às|as|dia|rua|avenida|av\.|travessa|estrada)\b/i)[0].replace(/[,.!?;:]+$/g, "").trim().slice(0,180) : ""; }
function address(text: string) { const explicit=text.match(/(?:endereço|endereco|localização|localizacao)\s*(?:é|e|:)?\s*([^\n.!?]{5,180})/i); if(explicit)return explicit[1].trim().slice(0,320); const street=text.match(/\b((?:Rua|R\.|Avenida|Av\.|Travessa|Estrada|Rodovia)\s+[^\n.!?]{2,160})/i); return street?street[1].trim().slice(0,320):""; }
function parseDateTime(text: string, context: unknown) {
  const source=context&&typeof context==="object"?context as Record<string,unknown>:{}; const rawNow=typeof source.now==="string"?new Date(source.now):new Date(); const now=Number.isNaN(rawNow.getTime())?new Date():rawNow;
  let year=now.getFullYear(),month=now.getMonth()+1,day=now.getDate(); const d=text.match(/\b(\d{1,2})\/(\d{1,2})(?:\/(\d{2,4}))?\b/);
  if(d){day=Number(d[1]);month=Number(d[2]);if(d[3]){const y=Number(d[3]);year=y<100?2000+y:y;}else if(new Date(year,month-1,day,23,59,59).getTime()<now.getTime())year+=1;} else if(/\bamanh[ãa]\b/i.test(text)){const t=new Date(now);t.setDate(t.getDate()+1);year=t.getFullYear();month=t.getMonth()+1;day=t.getDate();} else if(!/\bhoje\b/i.test(text))return{date:"",time:"",startsAt:""};
  const t=text.match(/\b(\d{1,2})[:h](\d{2})\b/i)||text.match(/(?:às|as)\s*(\d{1,2})(?:[:h](\d{2}))?\s*(?:h|horas?)?\b/i); let hour="",minute=""; if(t){const h=Number(t[1]);if(h>=0&&h<=23){hour=String(h).padStart(2,"0");minute=String(Number(t[2]||0)).padStart(2,"0");}}
  const date=`${year}-${String(month).padStart(2,"0")}-${String(day).padStart(2,"0")}`; return{date,time:hour?`${hour}:${minute}`:"",startsAt:hour?`${date}T${hour}:${minute}`:""};
}
function intent(content: string): MunicipalAgentActionType {
  const text=normalize(content); const create=/\b(abra|abrir|abre|crie|criar|cria|registre|registrar|cadastre|cadastrar|adicione|adicionar|marque|marcar|agende|agendar|coloque|colocar|quero)\b/.test(text);
  if(/\b(reuniao|evento|compromisso|agenda)\b/.test(text)&&create)return"create_event";
  if(/\b(chamado|solicitacao|atendimento|visita familiar|visita domiciliar)\b/.test(text)&&create)return"create_ticket";
  if(/\b(tarefa|vistoria)\b/.test(text)&&create)return"create_task";
  if(/\b(projeto)\b/.test(text)&&create)return"create_project";
  if(/\b(meta)\b/.test(text)&&create)return"create_goal";
  if(/\b(mensagem|avise|avisar|mande|enviar|envie)\b/.test(text))return"send_internal_message";
  if(/\b(abra|abrir|va para|ir para|navegue|navegar)\b/.test(text)&&/\b(inicio|demandas|tarefas|agenda|gestao|configuracoes|chamados)\b/.test(text))return"navigate";
  return"none";
}
function segment(messages:Array<{role:"user"|"assistant";content:string}>){let start=-1,action:MunicipalAgentActionType="none";for(let i=messages.length-1;i>=0;i--){if(messages[i].role!=="user")continue;const candidate=intent(messages[i].content);if(candidate!=="none"){start=i;action=candidate;break;}}const relevant=start>=0?messages.slice(start):messages.slice(-6);return{action,userText:relevant.filter((m)=>m.role==="user").map((m)=>m.content).join("\n")};}

export function runOfflineMunicipalAgent(messages:Array<{role:"user"|"assistant";content:string}>, context:unknown, departments:string[]):MunicipalAgentTurnResult {
  const payload=emptyPayload(); const {action,userText}=segment(messages); const n=normalize(userText); const current=currentDepartment(context,departments);
  const base=(reply:string):MunicipalAgentTurnResult=>({reply:`${reply}\n\nModo offline: interpretei este pedido por regras locais. A ação será guardada no dispositivo e sincronizada quando a conexão voltar.`,actionType:action,readyToExecute:false,requiresConfirmation:false,missingFields:[],questions:[],actionSummary:"",payload,source:"regras"});
  if(action==="create_ticket"){
    payload.neighborhood=neighborhood(userText);payload.address=address(userText);payload.department=departmentByHint(userText,departments,current||"Gabinete do Prefeito");payload.priority=/\b(urgente|emergencia|perigo|risco)\b/.test(n)?"Alta":"Média";payload.slaHours=payload.priority==="Alta"?24:72;const family=/\bvisita (familiar|domiciliar)\b/.test(n);payload.title=family?`Visita familiar${payload.neighborhood?` — ${payload.neighborhood}`:""}`:"Chamado solicitado no modo offline";payload.description=userText.trim().slice(0,8000);const reason=/\b(motivo|porque|necessita|precisa|acompanhamento|acompanhar|situacao|denuncia|solicitacao da familia)\b/.test(n);const missing:string[]=[],questions:string[]=[];if(!payload.department){missing.push("setor");questions.push("Para qual secretaria/setor o chamado deve ser encaminhado?");}if(family&&!payload.neighborhood){missing.push("bairro");questions.push("Qual é o bairro da visita?");}if(family&&!payload.address){missing.push("endereço/referência");questions.push("Qual é o endereço ou um ponto de referência suficiente para a equipe localizar a família?");}if(family&&!reason){missing.push("motivo");questions.push("Qual é o motivo ou objetivo da visita familiar?");}if(missing.length)return{...base(`Entendi. Vou preparar o chamado. Preciso completar:\n${questions.map((q,i)=>`${i+1}. ${q}`).join("\n")}`),missingFields:missing,questions};return{...base("As informações estão completas. Vou registrar o chamado localmente agora."),actionType:"create_ticket",readyToExecute:true,actionSummary:`Criar chamado: ${payload.title}`,payload};
  }
  if(action==="create_event"){
    const parsed=parseDateTime(userText,context);payload.startsAt=parsed.startsAt;payload.department=departmentByHint(userText,departments,current)||current;payload.targetDepartments=payload.department?[payload.department]:[];const about=userText.match(/reuni[ãa]o\s+(?:sobre|para tratar de|com pauta sobre)\s+([^\n,.!?]+)/i);const withPerson=userText.match(/reuni[ãa]o\s+com\s+([^\n,.!?]+)/i);payload.title=about?`Reunião sobre ${about[1].trim()}`.slice(0,240):withPerson?`Reunião com ${withPerson[1].trim()}`.slice(0,240):"";payload.description=userText.trim().slice(0,8000);payload.kind="Reunião";const missing:string[]=[],questions:string[]=[];if(!payload.title){missing.push("título/assunto");questions.push("Qual é o assunto ou título da reunião?");}if(!parsed.date){missing.push("data");questions.push("Em qual data a reunião deve acontecer?");}if(!parsed.time){missing.push("horário");questions.push("Qual é o horário de início?");}if(!payload.targetDepartments.length){missing.push("setor");questions.push("Qual secretaria/setor deve participar ou receber esse compromisso?");}if(missing.length)return{...base(`Vou preparar a reunião. Preciso completar:\n${questions.map((q,i)=>`${i+1}. ${q}`).join("\n")}`),missingFields:missing,questions};return{...base("A reunião está completa. Vou registrá-la localmente agora."),actionType:"create_event",readyToExecute:true,actionSummary:`Criar evento: ${payload.title}`,payload};
  }
  if(action==="create_task"){
    payload.department=departmentByHint(userText,departments,current)||current;payload.description=userText.trim().slice(0,8000);payload.kind=/\bvistoria\b/.test(n)?"Vistoria":"Tarefa";payload.priority=/\b(urgente|prioridade alta)\b/.test(n)?"Urgente":"Normal";payload.slaHours=48;const m=userText.match(/(?:tarefa|vistoria)\s+(?:para\s+)?([^\n,.!?]+)/i);payload.title=m?m[1].trim().slice(0,240):"";const missing:string[]=[],questions:string[]=[];if(!payload.title){missing.push("título/objetivo");questions.push("O que exatamente deve ser feito nessa tarefa?");}if(!payload.department){missing.push("setor");questions.push("Qual setor ficará responsável?");}if(missing.length)return{...base(`Vou preparar a tarefa. Preciso completar:\n${questions.map((q,i)=>`${i+1}. ${q}`).join("\n")}`),missingFields:missing,questions};return{...base("A tarefa está pronta. Vou registrá-la localmente agora."),actionType:"create_task",readyToExecute:true,actionSummary:`Criar tarefa: ${payload.title}`,payload};
  }
  if(action==="navigate"){
    const map:Array<[RegExp,string]>=[[/\binicio\b/,"Início"],[/\bdemandas|chamados\b/,"Demandas"],[/\btarefas\b/,"Tarefas"],[/\bagenda\b/,"Agenda"],[/\bgestao\b/,"Gestão"],[/\bconfiguracoes\b/,"Configurações"]];const found=map.find(([re])=>re.test(n));if(found){payload.navTarget=found[1];return{...base(`Vou abrir ${found[1]}.`),actionType:"navigate",readyToExecute:true,actionSummary:`Abrir ${found[1]}`,payload};}
  }
  return {...base("Sem internet, consigo executar comandos operacionais essenciais como criar chamados, tarefas e reuniões usando regras locais. Para análises generativas, resumos livres e pedidos mais complexos, a Groq volta a assumir quando a conexão retornar."),actionType:"none"};
}
