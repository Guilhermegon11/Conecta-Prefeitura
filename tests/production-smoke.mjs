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
 const admin=await fetch(base+'/api/admin');assert.equal(admin.status,503);const config=await admin.json();assert.equal(config.needsConfiguration,true);assert.equal(config.testMode,true);
 for(const route of ['/api/auth','/api/test-session']){const r=await fetch(base+route,{method:'POST',headers:{origin:base,'content-type':'application/json'},body:JSON.stringify({username:'admin',password:'1234'})});assert.equal(r.status,503,await r.text());}
 const closed=await fetch(base+'/api/respond',{method:'POST',headers:{origin:base,'content-type':'application/json'},body:'{}'});assert.equal(closed.status,503,await closed.text());
 console.log('Production HTTP smoke checks passed: pages, local fonts, candidates, test mode and honest database configuration boundaries.');
}catch(error){console.error(error);process.exitCode=1;}finally{child.kill('SIGTERM');}
