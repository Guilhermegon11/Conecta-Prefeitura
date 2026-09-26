import {spawn} from 'node:child_process';
import assert from 'node:assert/strict';
const environment={...process.env};for(const key of ['TURSO_DATABASE_URL','TURSO_AUTH_TOKEN','ADMIN_USERNAME','ADMIN_PASSWORD','SESSION_SECRET','TEST_MODE'])delete environment[key];
const child=spawn(process.execPath,['node_modules/next/dist/bin/next','start','--hostname','127.0.0.1','--port','3101'],{env:environment,stdio:['ignore','pipe','pipe']});
let logs='';child.stdout.on('data',chunk=>logs+=chunk);child.stderr.on('data',chunk=>logs+=chunk);
const base='http://127.0.0.1:3101';
try{
 let ready=false;
 for(let i=0;i<60;i++){try{const r=await fetch(base);if(r.ok){ready=true;break;}}catch{}await new Promise(resolve=>setTimeout(resolve,200));}
 assert.equal(ready,true,logs);
 for(const route of ['/','/painel','/resultados','/fonts/poppins-0.ttf','/favicon.svg'])assert.equal((await fetch(base+route)).status,200,route);
 const survey=await (await fetch(base+'/api/survey')).json();assert.equal(survey.municipalities.length,853);assert.equal(survey.candidates.length,1727);assert.equal(survey.settings.status,'draft');assert.equal(survey.testMode,true);assert.equal(survey.databaseReady,false);
 assert.equal((await (await fetch(base+'/api/results')).json()).published,false);
 const admin=await fetch(base+'/api/admin');assert.equal(admin.status,401);const config=await admin.json();assert.equal(config.needsLogin,true);assert.equal(config.previewAvailable,true);assert.equal(config.databaseReady,false);assert.equal(config.testMode,true);assert.equal(config.responses,undefined);
 const post=(route,body,headers={})=>fetch(base+route,{method:'POST',headers:{origin:base,'content-type':'application/json',...headers},body:JSON.stringify(body)});
 const invalidOrigin=await post('/api/auth',{username:'admin',password:'1234'},{origin:'https://other.invalid'});assert.equal(invalidOrigin.status,403);
 const incorrect=await post('/api/auth',{username:'admin',password:'incorrect'});assert.equal(incorrect.status,401);assert.equal(incorrect.headers.get('set-cookie'),null);
 const preview=await post('/api/auth',{username:'admin',password:'1234'});assert.equal(preview.status,200);assert.deepEqual(await preview.json(),{ok:true,preview:true});assert.equal(preview.headers.get('set-cookie'),null,'Preview must not create an administrator cookie');
 assert.equal((await fetch(base+'/api/admin')).status,401,'A preview login must not authenticate database access');
 const staleCookie=await post('/api/auth',{username:'admin',password:'1234'},{cookie:'minas_admin_session=stale-session'});assert.equal(staleCookie.status,200);assert.equal((await staleCookie.json()).preview,true);assert.match(staleCookie.headers.get('set-cookie')||'',/minas_admin_session=;/);assert.match(staleCookie.headers.get('set-cookie')||'',/Max-Age=0/i);
 for(const body of [{action:'invitations',count:1},{action:'settings',settings:{title:'Unauthorized edit'}}]){const blocked=await post('/api/admin',body);assert.equal(blocked.status,401,await blocked.text());}
 assert.equal((await fetch(base+'/api/admin/export')).status,401);
 for(const route of ['/api/test-session','/api/respond']){const unavailable=await post(route,{});assert.equal(unavailable.status,503,await unavailable.text());}
 console.log('Production HTTP smoke checks passed: pages, local fonts, candidates, test mode, read-only preview, rejected credentials, cleared stale cookies and blocked database operations.');
}catch(error){console.error(error);process.exitCode=1;}finally{child.kill('SIGTERM');}
