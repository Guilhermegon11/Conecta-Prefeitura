// Scenario tests for arithmetic, real XLSX serialization and the authenticated export route.
const assert = require('node:assert/strict');
const fs = require('node:fs');
const path = require('node:path');
const ts = require('typescript');
const ExcelJS = require('exceljs');
const {DatabaseSync} = require('node:sqlite');
const root = path.resolve(__dirname, '..');
const sqlite = new DatabaseSync(':memory:');
sqlite.exec('CREATE TABLE responses (id TEXT, created_at TEXT, votes_in_varzea_da_palma INTEGER, is_test INTEGER, choices TEXT)');
let signedIn = false, databaseReads = 0;
const server = {
 admin: async () => signedIn,
 settings: async () => ({title: '=HYPERLINK("https://invalid.example")'}),
 json: (data, status = 200) => Response.json(data, {status}),
 db: () => ({prepare: sql => ({bind: (...args) => ({all: async () => {
  databaseReads++;
  return {results: sqlite.prepare(sql).all(...args)};
 }})})})
};
const cache = {};
function load(name) {
 if (name === '@/lib/server') return server;
 if (!name.startsWith('@/') && !path.isAbsolute(name)) return require(name);
 let file = name.startsWith('@/') ? path.join(root, name.slice(2)) : name;
 if (file.endsWith('.json')) return JSON.parse(fs.readFileSync(file, 'utf8'));
 if (!file.endsWith('.ts')) file += '.ts';
 if (cache[file]) return cache[file].exports;
 const module = {exports: {}};
 cache[file] = module;
 const code = ts.transpileModule(fs.readFileSync(file, 'utf8'), {compilerOptions: {
  module: ts.ModuleKind.CommonJS, target: ts.ScriptTarget.ES2022, esModuleInterop: true
 }}).outputText;
 new Function('require', 'module', 'exports', code)(name => load(name.startsWith('.') ? path.resolve(path.dirname(file), name) : name), module, module.exports);
 return module.exports;
}
const {summarize, validElectorTotal} = load('@/lib/statistics');
const {createWorkbook} = load('@/lib/workbook');
const {GET} = load('@/app/api/admin/export/route');
const candidates = [{id: 'a', name: '=2+2', number: '10', party: 'TESTE', office: 'presidente', uf: 'BR', status: 'TESTE'}];
const responses = [
 {id: 'test-yes', created_at: '2026-09-26T15:30:00Z', votesInVarzeaDaPalma: true, isTest: true, choices: {federal: 'blank', estadual: 'null', senador1: 'candidate:a', senador2: 'candidate:b', governador: 'undecided', presidente: 'candidate:a'}},
 {id: 'test-no', created_at: '2026-09-26T16:00:00Z', votesInVarzeaDaPalma: false, isTest: true, choices: {federal: 'party:TESTE', estadual: 'null', senador1: 'blank', senador2: 'candidate:a', governador: 'skip', presidente: 'undecided'}}
];
let checked = 0;
function check(fn) {fn(); checked++;}
(async () => {
 const president = summarize(responses, 'presidente', 1500);
 check(() => assert.deepEqual(president.rows.map(row => [row.count, row.share, row.projected]), [[1, .5, 750], [1, .5, 750]]));
 const senate = summarize(responses, 'senador', 1500);
 check(() => assert.deepEqual([senate.total, senate.denominator, senate.projectedChoices], [2, 4, 3000]));
 check(() => assert.deepEqual(senate.rows.find(row => row.value === 'candidate:a'), {value: 'candidate:a', count: 2, share: .5, projected: 1500}));
 check(() => assert.equal(senate.rows.reduce((total, row) => total + row.projected, 0), 3000));
 check(() => assert.deepEqual(summarize([], 'senador', 1500).rows, []));
 check(() => assert.equal(summarize([], 'federal', 1500).projectedChoices, null));
 check(() => assert.equal(summarize(responses, 'presidente', 0).rows[0].projected, null));
 check(() => assert.ok([0, -1, 1.5, Infinity, NaN, 100_000_001].every(value => !validElectorTotal(value))));
 check(() => assert.ok([1, 1500, 100_000_000].every(validElectorTotal)));
 const missing = summarize([{...responses[0], choices: {}}], 'senador', 1500);
 check(() => assert.deepEqual(missing.rows[0], {value: 'missing', count: 2, share: 1, projected: 3000}));
 const workbook = createWorkbook({responses, candidates, cohort: 'test', locality: 'all', targetElectors: 1500, generatedAt: new Date('2026-09-26T17:00:00Z')});
 const bytes = await workbook.xlsx.writeBuffer();
 check(() => assert.equal(bytes.subarray(0, 2).toString(), 'PK'));
 const readback = new ExcelJS.Workbook();
 await readback.xlsx.load(bytes);
 check(() => assert.deepEqual(readback.worksheets.map(sheet => sheet.name), ['Respostas', 'Resumo', 'Projeção', 'Sobre']));
 check(() => assert.equal(readback.getWorksheet('Respostas').rowCount, 3));
 check(() => assert.equal(readback.getWorksheet('Respostas').getCell('J2').value, '=2+2 · 10 · TESTE'));
 check(() => assert.ok(readback.getWorksheet('Respostas').getCell('B2').value instanceof Date));
 check(() => assert.equal(readback.getWorksheet('Resumo').getCell('D2').type, ExcelJS.ValueType.Number));
 check(() => assert.equal(readback.getWorksheet('Resumo').getCell('D2').numFmt, '0.00%'));
 check(() => {for (const sheet of readback.worksheets) sheet.eachRow(row => row.eachCell(cell => assert.notEqual(cell.type, ExcelJS.ValueType.Formula)));});
 const emptyBook = createWorkbook({responses: [], candidates, cohort: 'real', locality: 'all', targetElectors: 1500});
 check(() => assert.deepEqual(emptyBook.worksheets.slice(0, 3).map(sheet => sheet.rowCount), [1, 1, 1]));
 const insert = sqlite.prepare('INSERT INTO responses VALUES (?,?,?,?,?)');
 for (const response of responses) insert.run(response.id, response.created_at, response.votesInVarzeaDaPalma ? 1 : 0, 1, JSON.stringify(response.choices));
 insert.run('real-only', '2026-09-26T16:15:00Z', null, 0, JSON.stringify(responses[0].choices));
 const request = query => new Request('https://test.example/api/admin/export' + query);
 check(() => assert.equal(databaseReads, 0));
 assert.equal((await GET(request(''))).status, 401); checked++;
 check(() => assert.equal(databaseReads, 0));
 signedIn = true;
 for (const query of ['?electors=1.5', '?electors=-1', '?electors=100000001', '?cohort=all', '?locality=bogus']) {
  assert.equal((await GET(request(query))).status, 400); checked++;
 }
 const result = await GET(request('?cohort=test&locality=no&electors=1500'));
 check(() => assert.equal(result.status, 200));
 check(() => assert.equal(result.headers.get('Cache-Control'), 'private, no-store'));
 check(() => assert.match(result.headers.get('Content-Type'), /spreadsheetml/));
 const exported = new ExcelJS.Workbook();
 await exported.xlsx.load(Buffer.from(await result.arrayBuffer()));
 check(() => assert.equal(exported.getWorksheet('Respostas').getCell('A2').value, 'test-no'));
 check(() => assert.equal(exported.getWorksheet('Respostas').rowCount, 2));
 const realResult = await GET(request('?cohort=real&locality=legacy&electors=8000'));
 const realBook = new ExcelJS.Workbook();
 await realBook.xlsx.load(Buffer.from(await realResult.arrayBuffer()));
 check(() => assert.equal(realBook.getWorksheet('Respostas').getCell('A2').value, 'real-only'));
 check(() => assert.equal(realBook.getWorksheet('Respostas').rowCount, 2));
 console.log(`${checked} verificações de estatísticas e exportação XLSX passaram.`);
 sqlite.close();
})().catch(error => {console.error(error); process.exitCode = 1;});
