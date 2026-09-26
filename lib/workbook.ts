import ExcelJS from 'exceljs';
import {choiceLabel, steps, type Candidate} from '@/lib/survey';
import {localityFilters, localityLabel, localityQuestion} from '@/lib/locality';
import {offices, summarize, validElectorTotal, type SurveyResponse} from '@/lib/statistics';
import source from '@/data/source.json';

export type WorkbookOptions = {
 responses: SurveyResponse[];
 candidates: Candidate[];
 cohort: 'test' | 'real';
 locality: string;
 targetElectors: number;
 generatedAt?: Date;
 title?: string;
};
function styledSheet(book: ExcelJS.Workbook, name: string, columns: Partial<ExcelJS.Column>[]) {
 const sheet = book.addWorksheet(name, {views: [{state: 'frozen', ySplit: 1, showGridLines: false}]});
 sheet.columns = columns;
 sheet.getRow(1).height = 36;
 sheet.getRow(1).font = {name: 'Calibri', size: 11, bold: true, color: {argb: 'FFFFFFFF'}};
 sheet.getRow(1).fill = {type: 'pattern', pattern: 'solid', fgColor: {argb: 'FF173C73'}};
 sheet.getRow(1).alignment = {vertical: 'middle', wrapText: true};
 sheet.pageSetup = {paperSize: 9, orientation: 'landscape', fitToPage: true, fitToWidth: 1, fitToHeight: 0};
 return sheet;
}
function finishSheet(sheet: ExcelJS.Worksheet) {
 sheet.autoFilter = {from: {row: 1, column: 1}, to: {row: Math.max(1, sheet.rowCount), column: sheet.columnCount}};
 sheet.eachRow((row, index) => {
  if (index === 1) return;
  row.height = 32;
  row.font = {name: 'Calibri', size: 11, color: {argb: 'FF182D48'}};
  row.alignment = {vertical: 'middle', wrapText: true};
  if (index % 2 === 0) row.fill = {type: 'pattern', pattern: 'solid', fgColor: {argb: 'FFF0F5FA'}};
 });
 sheet.pageSetup.printTitlesRow = '1:1';
}

export function createWorkbook(options: WorkbookOptions) {
 if (!validElectorTotal(options.targetElectors)) throw new RangeError('Informe um total inteiro de 1 a 100.000.000 eleitores.');
 const {responses, candidates, cohort, locality, targetElectors} = options;
 const now = options.generatedAt || new Date();
 const book = new ExcelJS.Workbook();
 book.creator = 'Minas Opina';
 book.created = now;
 book.modified = now;
 book.title = options.title || 'Minas Opina';
 book.subject = 'Respostas recebidas e simulação aritmética de votos';
 const mode = cohort === 'test' ? 'Teste' : 'Real';
 const raw = styledSheet(book, 'Respostas', [
  {header: 'ID da resposta', key: 'id', width: 40},
  {header: 'Recebida em (UTC)', key: 'date', width: 25, style: {numFmt: 'dd/mm/yyyy hh:mm:ss'}},
  {header: 'Modo', key: 'mode', width: 12},
  {header: localityQuestion, key: 'locality', width: 28},
  ...steps.map(step => ({header: step.label, key: step.key, width: 40}))
 ]);
 for (const response of responses) {
  const date = new Date(response.created_at);
  raw.addRow({
   id: response.id, date: Number.isFinite(date.getTime()) ? date : response.created_at,
   mode: response.isTest ? 'Teste' : 'Real', locality: localityLabel(response.votesInVarzeaDaPalma),
   ...Object.fromEntries(steps.map(step => [step.key, choiceLabel(response.choices[step.key], candidates)]))
  });
 }
 const summary = styledSheet(book, 'Resumo', [
  {header: 'Cargo', key: 'office', width: 30}, {header: 'Resposta', key: 'choice', width: 45},
  {header: 'Votos / escolhas recebidas', key: 'count', width: 23, style: {numFmt: '#,##0'}},
  {header: 'Média de apoio (% das escolhas)', key: 'share', width: 25, style: {numFmt: '0.00%'}},
  {header: 'Base de escolhas', key: 'base', width: 19, style: {numFmt: '#,##0'}},
  {header: 'Participantes', key: 'total', width: 18, style: {numFmt: '#,##0'}}
 ]);
 const projection = styledSheet(book, 'Projeção', [
  {header: 'Cargo', key: 'office', width: 30}, {header: 'Resposta', key: 'choice', width: 45},
  {header: 'Eleitores hipotéticos', key: 'electors', width: 23, style: {numFmt: '#,##0'}},
  {header: 'Votos / escolhas recebidas', key: 'count', width: 23, style: {numFmt: '#,##0'}},
  {header: 'Média de apoio (% das escolhas)', key: 'share', width: 25, style: {numFmt: '0.00%'}},
  {header: 'Escolhas estimadas', key: 'projected', width: 23, style: {numFmt: '#,##0'}},
  {header: 'Escolhas no cenário', key: 'pool', width: 24, style: {numFmt: '#,##0'}}
 ]);
 for (const office of offices) {
  const stats = summarize(responses, office.key, targetElectors);
  for (const row of stats.rows) {
   const shared = {office: office.label, choice: choiceLabel(row.value, candidates), count: row.count, share: row.share};
   summary.addRow({...shared, base: stats.denominator, total: stats.total});
   projection.addRow({...shared, electors: targetElectors, projected: row.projected, pool: stats.projectedChoices});
  }
 }
 const about = styledSheet(book, 'Sobre', [{header: 'Informação', key: 'label', width: 31}, {header: 'Descrição', key: 'description', width: 110}]);
 about.addRows([
  ['Projeto', options.title || 'Minas Opina'], ['Exportação (UTC)', now.toISOString()], ['Modo das respostas', mode],
  ['Filtro de localidade', localityFilters.find(item => item.id === locality)?.name || locality],
  ['Participantes no arquivo', responses.length], ['Eleitores do cenário', targetElectors],
  ['O que significa média', 'Percentual de cada opção entre todas as escolhas recebidas para o cargo. Não é uma média de números de candidatos.'],
  ['Base de cálculo', 'Uma escolha por participante em cada cargo; duas no Senado. Branco, nulo, indecisos, não respostas e votos de legenda ficam na base.'],
  ['Fórmula da simulação', 'Escolhas estimadas = arredondar(escolhas recebidas ÷ participantes × eleitores hipotéticos). O Senado possui duas escolhas por eleitor.'],
  ['Arredondamento', 'Cada opção é arredondada separadamente. A soma das estimativas pode diferir um pouco do total de escolhas do cenário.'],
  ['Sem respostas', 'As abas Resumo e Projeção permanecem sem linhas de resultados quando não há respostas no filtro. Nenhum voto é inventado.'],
  ['Limite de interpretação', 'Simulação aritmética das respostas recebidas. Não é previsão eleitoral nem resultado de uma amostra representativa. Não calcula margem de erro ou confiança estatística.'],
  ['Separação de dados', 'Respostas de teste e reais são exportadas separadamente. Resultados de teste não devem ser divulgados como pesquisa eleitoral.'],
  ['Privacidade', 'Este arquivo contém opiniões políticas. Guarde-o com acesso restrito. Convites, tokens, telefone, senha e hash de convite não são exportados.'],
  ['Fonte dos nomes', source.source], ['Dados de candidaturas', source.dataset], ['Data da importação dos nomes', source.retrievedAt],
  ['Origem das respostas', 'Participantes que responderam ao formulário do próprio projeto. O TSE não coletou nem validou estas respostas.']
 ]);
 for (const sheet of book.worksheets) finishSheet(sheet);
 about.eachRow((row, index) => {if (index > 1) row.height = 46;});
 // All user-provided labels are plain string cells. Never accept formula objects.
 return book;
}
