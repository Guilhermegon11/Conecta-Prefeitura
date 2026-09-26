// Exercises real route handlers, session cryptography, database adapter and SQL schema.
// Only the remote libSQL transport and Next request-cookie context are substituted.
const {DatabaseSync}=require('node:sqlite');
const fs=require('node:fs'),path=require('node:path'),ts=require('typescript');
const assert=require('node:assert/strict');
const root=path.resolve(__dirname,'..'),sqlite=new DatabaseSync(':memory:');
// Start with the previous response schema to exercise a real in-place migration.
sqlite.exec(`CREATE TABLE responses (id TEXT PRIMARY KEY,invite_hash TEXT NOT NULL,municipality TEXT NOT NULL,choices TEXT NOT NULL,created_at TEXT NOT NULL,consent_version TEXT NOT NULL);
INSERT INTO responses VALUES ('legacy-fixture','legacy-fixture','3106200','{}','2026-01-01','1.0');`);
process.env.TURSO_DATABASE_URL='libsql://test.invalid';process.env.TURSO_AUTH_TOKEN='test-token';
process.env.ADMIN_PASSWORD='test-only-password-very-long';process.env.SESSION_SECRET='test-only-secret-with-more-than-32-characters';
const originalPassword=process.env.ADMIN_PASSWORD;
const jar=new Map(),cookieOptions=new Map();let checked=0;
function execute(statement){const sql=typeof statement==='string'?statement:statement.sql,args=typeof statement==='string'?[]:statement.args||[];const stmt=sqlite.prepare(sql);if(stmt.columns().length)return{rows:stmt.all(...args),rowsAffected:0};const r=stmt.run(...args);return{rows:[],rowsAffected:Number(r.changes)};}
const transport={async execute(s){return execute(s);},async batch(statements){sqlite.exec('BEGIN');try{const r=statements.map(execute);sqlite.exec('COMMIT');return r;}catch(e){sqlite.exec('ROLLBACK');throw e;}}};
const cache={};
function load(name){
 if(name.startsWith('node:'))return require(name);
 if(name==='@libsql/client/web')return{createClient:()=>transport};
 if(name==='next/headers')return{cookies:async()=>({get:key=>jar.has(key)?{value:jar.get(key)}:undefined,set(key,value,options){jar.set(key,value);cookieOptions.set(key,options);}})};
 let file=name.startsWith('@/')?path.join(root,name.slice(2)):name;
 if(file.endsWith('.json'))return JSON.parse(fs.readFileSync(file,'utf8'));
 if(!file.endsWith('.ts'))file+='.ts';if(cache[file])return cache[file].exports;
 const module={exports:{}};cache[file]=module;
 const code=ts.transpileModule(fs.readFileSync(file,'utf8'),{compilerOptions:{module:ts.ModuleKind.CommonJS,target:ts.ScriptTarget.ES2022,esModuleInterop:true}}).outputText;
 new Function('require','module','exports',code)(n=>load(n.startsWith('.')?path.resolve(path.dirname(file),n):n),module,module.exports);
 return module.exports;
}
const admin=load('@/app/api/admin/route'),respond=load('@/app/api/respond/route'),results=load('@/app/api/results/route'),authRoute=load('@/app/api/auth/route'),auth=load('@/lib/auth');
const survey=load('@/lib/survey'),candidates=load('@/data/candidates.json'),ballot=load('@/lib/ballot'),featured=load('@/data/featured-candidates.json'),locality=load('@/lib/locality');
const request=(body,origin='https://test.example')=>new Request('https://test.example/api',{method:'POST',headers:{'content-type':'application/json',origin},body:JSON.stringify(body)});
async function post(handler,body,status,origin){const r=await handler(request(body,origin));assert.equal(r.status,status,await r.clone().text());checked++;return r.json();}
(async()=>{
 assert.equal((await admin.GET()).status,401);checked++;
 await post(admin.POST,{action:'invitations',count:1},401);
 await post(authRoute.POST,{password:originalPassword},403,'https://other.invalid');
 await post(authRoute.POST,{password:'wrong'},401);
 for(let i=1;i<8;i++)await post(authRoute.POST,{password:'wrong'},401);
 await post(authRoute.POST,{password:originalPassword},429);
 sqlite.exec('UPDATE auth_attempts SET window_start=0');
 await post(authRoute.POST,{password:originalPassword},200);
 assert.equal(sqlite.prepare('SELECT votes_in_varzea_da_palma FROM responses WHERE id=?').get('legacy-fixture').votes_in_varzea_da_palma,null);checked++;
 sqlite.prepare('DELETE FROM responses WHERE id=?').run('legacy-fixture');
 for(const [office,ids] of Object.entries(featured)){const ordered=candidates.filter(c=>c.office===office).sort(ballot.compareCandidates);assert.deepEqual(ordered.slice(0,ids.length).map(c=>c.id),ids);assert.equal(ordered.length,candidates.filter(c=>c.office===office).length);checked++;}
 assert.equal(locality.matchesLocalityFilter(false,'no'),true);assert.equal(locality.matchesLocalityFilter(false,'yes'),false);assert.equal(locality.matchesLocalityFilter(null,'legacy'),true);checked++;

 assert.equal(cookieOptions.get(auth.SESSION_COOKIE).httpOnly,true);assert.equal(cookieOptions.get(auth.SESSION_COOKIE).sameSite,'strict');checked++;
 await post(authRoute.POST,null,400);
 const session=jar.get(auth.SESSION_COOKIE);assert.equal(auth.validSession(session),true);assert.equal(auth.validSession(session+'.tampered'),false);checked++;
 const originalNow=Date.now;Date.now=()=>originalNow()+9*60*60*1000;assert.equal(auth.validSession(session),false);Date.now=originalNow;checked++;
 process.env.ADMIN_PASSWORD='different-long-password-123';assert.equal(auth.validSession(session),false);process.env.ADMIN_PASSWORD=originalPassword;checked++;
 jar.set(auth.SESSION_COOKIE,'forged');assert.equal((await admin.GET()).status,401);jar.set(auth.SESSION_COOKIE,session);checked++;
 await post(admin.POST,{action:'settings',settings:{status:'open'}},400);
 await post(respond.POST,{},409);
 const config={...survey.defaults,status:'open',controller:'TEST ONLY',contact:'test@example.invalid',registration:'TEST-ONLY',methodology:'Disposable validation scenario; not an actual electoral survey.',fieldStart:'2020-01-01',fieldEnd:'2099-01-01',publishAfter:'2020-01-01'};
 await post(admin.POST,{action:'settings',settings:config},200);
 await post(admin.POST,{action:'invitations',count:1501},400);
 const {tokens}=await post(admin.POST,{action:'invitations',count:3},200);
 assert.equal(new Set(tokens).size,3);assert.equal(sqlite.prepare('SELECT COUNT(*) AS n FROM invitations').get().n,3);assert.equal(sqlite.prepare('SELECT COUNT(*) AS n FROM invitations WHERE hash=?').get(tokens[0]).n,0);checked++;
 const choices=Object.fromEntries(survey.steps.map(s=>[s.key,'undecided']));
 const body={token:tokens[0],votesInVarzeaDaPalma:true,choices,consent:true,consentVersion:config.consentVersion};
 await post(respond.POST,{...body,consent:false},400);
 await post(respond.POST,{...body,votesInVarzeaDaPalma:undefined},400);
 await post(respond.POST,{...body,votesInVarzeaDaPalma:'no'},400);
 await post(respond.POST,{...body,choices:{...choices,federal:'candidate:'+candidates.find(c=>c.office==='presidente').id}},400);
 const senator='candidate:'+candidates.find(c=>c.office==='senador').id;
 await post(respond.POST,{...body,choices:{...choices,senador1:senator,senador2:senator}},400);
 await post(respond.POST,{...body,token:'0'.repeat(40)},403);
 await post(respond.POST,body,200);
 await post(respond.POST,body,409);
 await post(respond.POST,{...body,token:tokens[1],votesInVarzeaDaPalma:false},200);
 assert.equal(sqlite.prepare('SELECT COUNT(*) AS n FROM responses').get().n,2);checked++;
 const stored=sqlite.prepare('SELECT municipality,votes_in_varzea_da_palma FROM responses ORDER BY votes_in_varzea_da_palma').all();assert.equal(stored[0].municipality,'');assert.equal(stored[0].votes_in_varzea_da_palma,0);assert.equal(stored[1].municipality,'3170800');assert.equal(stored[1].votes_in_varzea_da_palma,1);checked++;
 const adminPayload=await (await admin.GET()).json();assert.deepEqual(adminPayload.responses.map(r=>r.votesInVarzeaDaPalma).sort(),[false,true]);checked++;
 assert.equal((await (await results.GET()).json()).published,false);checked++;
 await post(admin.POST,{action:'settings',settings:{...config,published:true}},400);
 await post(admin.POST,{action:'settings',settings:{...config,status:'closed',published:true}},200);
 const published=await (await results.GET()).json();assert.equal(published.published,true);assert.equal(published.total,2);assert.equal(published.responses,undefined);checked++;
 await post(respond.POST,{...body,token:tokens[1]},409);
 const logout=await authRoute.DELETE(new Request('https://test.example/api/auth',{method:'DELETE',headers:{origin:'https://test.example'}}));assert.equal(logout.status,200);assert.equal((await admin.GET()).status,401);checked++;
 console.log(`${checked} checks passed: authentication, rate limiting, session integrity, schema migration, locality answers, candidate order, single-use invites and result publication.`);
 sqlite.close();
})().catch(e=>{console.error(e);process.exitCode=1;});
