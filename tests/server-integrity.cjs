// Exercises real route handlers, session cryptography, database adapter and SQL schema.
// Only the remote libSQL transport and Next request-cookie context are substituted.
const {DatabaseSync}=require('node:sqlite');
const fs=require('node:fs'),path=require('node:path'),ts=require('typescript');
const assert=require('node:assert/strict');
const root=path.resolve(__dirname,'..'),sqlite=new DatabaseSync(':memory:');
// Start with the previous response schema to exercise a real in-place migration.
sqlite.exec(`CREATE TABLE invitations (hash TEXT PRIMARY KEY,created_at TEXT NOT NULL);
INSERT INTO invitations VALUES ('legacy-fixture','2026-01-01');
CREATE TABLE responses (id TEXT PRIMARY KEY,invite_hash TEXT NOT NULL,municipality TEXT NOT NULL,choices TEXT NOT NULL,created_at TEXT NOT NULL,consent_version TEXT NOT NULL);
INSERT INTO responses VALUES ('legacy-fixture','legacy-fixture','3106200','{}','2026-01-01','1.0');`);
process.env.TURSO_DATABASE_URL='libsql://test.invalid';process.env.TURSO_AUTH_TOKEN='test-token';
process.env.TEST_MODE='false';process.env.ADMIN_USERNAME='admin';
process.env.ADMIN_PASSWORD='test-only-password-very-long';process.env.SESSION_SECRET='test-only-secret-with-more-than-32-characters';
const originalPassword=process.env.ADMIN_PASSWORD,originalSecret=process.env.SESSION_SECRET;
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
 await post(authRoute.POST,{username:'admin',password:originalPassword},403,'https://other.invalid');
 await post(authRoute.POST,{username:'someone-else',password:originalPassword},401);
 for(let i=1;i<8;i++)await post(authRoute.POST,{username:'admin',password:'wrong'},401);
 await post(authRoute.POST,{username:'admin',password:originalPassword},429);
 sqlite.exec('UPDATE auth_attempts SET window_start=0');
 await post(authRoute.POST,{username:'admin',password:originalPassword},200);
 const legacy=sqlite.prepare('SELECT votes_in_varzea_da_palma,is_test FROM responses WHERE id=?').get('legacy-fixture');assert.equal(legacy.votes_in_varzea_da_palma,null);assert.equal(legacy.is_test,0);checked++;
 assert.equal(sqlite.prepare('SELECT is_test FROM invitations WHERE hash=?').get('legacy-fixture').is_test,0);checked++;
 sqlite.prepare('DELETE FROM responses WHERE id=?').run('legacy-fixture');sqlite.prepare('DELETE FROM invitations WHERE hash=?').run('legacy-fixture');
 for(const [office,ids] of Object.entries(featured)){const ordered=candidates.filter(c=>c.office===office).sort(ballot.compareCandidates);assert.deepEqual(ordered.slice(0,ids.length).map(c=>c.id),ids);assert.equal(ordered.length,candidates.filter(c=>c.office===office).length);checked++;}
 assert.equal(locality.matchesLocalityFilter(false,'no'),true);assert.equal(locality.matchesLocalityFilter(false,'yes'),false);assert.equal(locality.matchesLocalityFilter(null,'legacy'),true);checked++;

 assert.equal(cookieOptions.get(auth.SESSION_COOKIE).httpOnly,true);assert.equal(cookieOptions.get(auth.SESSION_COOKIE).sameSite,'strict');checked++;
 await post(authRoute.POST,null,400);
 await post(authRoute.POST,{password:originalPassword},400);
 const session=jar.get(auth.SESSION_COOKIE);assert.equal(await auth.validSession(session),true);assert.equal(await auth.validSession(session+'.tampered'),false);checked++;
 const originalNow=Date.now;Date.now=()=>originalNow()+9*60*60*1000;assert.equal(await auth.validSession(session),false);Date.now=originalNow;checked++;
 process.env.ADMIN_PASSWORD='different-long-password-123';assert.equal(await auth.validSession(session),false);process.env.ADMIN_PASSWORD=originalPassword;checked++;
 jar.set(auth.SESSION_COOKIE,'forged');assert.equal((await admin.GET()).status,401);jar.set(auth.SESSION_COOKIE,session);checked++;
 await post(admin.POST,{action:'settings',settings:{status:'open'}},400);
 await post(respond.POST,{},400);
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
 assert.equal(adminPayload.testMode,false);assert.equal(adminPayload.responses.every(r=>r.isTest===false),true);assert.deepEqual(adminPayload.invitationCounts,{test:0,real:3});checked++;
 assert.equal((await (await results.GET()).json()).published,false);checked++;
 await post(admin.POST,{action:'settings',settings:{...config,published:true}},400);
 await post(admin.POST,{action:'settings',settings:{...config,status:'closed',published:true}},200);
 const published=await (await results.GET()).json();assert.equal(published.published,true);assert.equal(published.total,2);assert.equal(published.responses,undefined);checked++;
 await post(respond.POST,{...body,token:tokens[1]},409);
 // Test collections remain distinct from the published real collection.
 const testSession=load('@/app/api/test-session/route');
 await post(testSession.POST,{},409);
 delete process.env.TEST_MODE;delete process.env.ADMIN_PASSWORD;delete process.env.SESSION_SECRET;
 assert.equal(auth.authConfigured(),true);assert.equal(await auth.validSession(session),false);checked++;
 await post(authRoute.POST,{username:'admin',password:'1234'},200);
 const testCookie=jar.get(auth.SESSION_COOKIE);
 const secretRow=sqlite.prepare('SELECT value FROM app_secrets WHERE name=?').get('test_session_secret');assert.ok(secretRow.value.length>=32);assert.equal(await auth.validSession(testCookie),true);checked++;
 delete cache[path.join(root,'lib/auth.ts')];
 const independentAuth=load('@/lib/auth');assert.equal(await independentAuth.validSession(testCookie),true);assert.equal(sqlite.prepare('SELECT COUNT(*) AS n FROM app_secrets WHERE name=?').get('test_session_secret').n,1);checked++;
 await post(testSession.POST,{},403,'https://other.invalid');
 const testInvite=await post(testSession.POST,{},200);assert.equal(testInvite.mode,'test');assert.ok(testInvite.token.length>=30);checked++;
 // Even a valid real invitation in an open collection cannot become a live response behind the test banner.
 const savedSettings=sqlite.prepare('SELECT data FROM settings WHERE id=1').get().data;
 sqlite.prepare('UPDATE settings SET data=? WHERE id=1').run(JSON.stringify({...config,status:'open',published:false}));
 await post(respond.POST,{...body,token:tokens[2],isTest:true},409);
 sqlite.prepare('UPDATE settings SET data=? WHERE id=1').run(savedSettings);
 const testBody={...body,token:testInvite.token,votesInVarzeaDaPalma:false,choices:{...choices,presidente:'candidate:'+candidates.find(c=>c.office==='presidente').id}};
 await post(respond.POST,{...testBody,consent:false},400);
 const savedTest=await post(respond.POST,testBody,200);assert.equal(savedTest.mode,'test');checked++;
 await post(respond.POST,testBody,409);
 assert.equal(sqlite.prepare('SELECT COUNT(*) AS n FROM responses WHERE is_test=1').get().n,1);assert.equal(sqlite.prepare('SELECT COUNT(*) AS n FROM responses WHERE is_test=0').get().n,2);checked++;
 const testPanel=await (await admin.GET()).json();assert.equal(testPanel.testMode,true);assert.equal(testPanel.responses.length,3);assert.equal(testPanel.responses.filter(r=>r.isTest).length,1);assert.deepEqual(testPanel.invitationCounts,{test:1,real:3});checked++;
 const testModeResults=await (await results.GET()).json();if(testModeResults.published)assert.equal(testModeResults.total,2);checked++;
 process.env.TEST_MODE='false';process.env.ADMIN_PASSWORD=originalPassword;process.env.SESSION_SECRET=originalSecret;
 await post(testSession.POST,{},409);
 await post(respond.POST,testBody,409);
 const liveResults=await (await results.GET()).json();assert.equal(liveResults.published,true);assert.equal(liveResults.total,2);assert.equal(liveResults.counts.presidente.undecided,2);assert.equal(liveResults.counts.presidente[testBody.choices.presidente],undefined);assert.equal(liveResults.counts.senador.undecided,4);checked++;
 assert.equal(await auth.validSession(testCookie),false);checked++;
 await post(authRoute.POST,{username:'admin',password:originalPassword},200);
 const logout=await authRoute.DELETE(new Request('https://test.example/api/auth',{method:'DELETE',headers:{origin:'https://test.example'}}));assert.equal(logout.status,200);assert.equal((await admin.GET()).status,401);checked++;
 console.log(`${checked} checks passed: authentication, rate limiting, session integrity, schema migration, locality answers, candidate order, single-use invites, saved test responses, persistent test sessions and isolated result publication.`);
 sqlite.close();
})().catch(e=>{console.error(e);process.exitCode=1;});
