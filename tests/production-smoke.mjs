import {spawn} from 'node:child_process';
import assert from 'node:assert/strict';
const environment={...process.env};for(const key of ['TURSO_DATABASE_URL','TURSO_AUTH_TOKEN','ADMIN_PASSWORD','SESSION_SECRET'])delete environment[key];
const child=spawn(process.execPath,['node_modules/next/dist/bin/next','start','--hostname','127.0.0.1','--port','3101'],{env:environment,stdio:['ignore','pipe','pipe']});
let logs='';child.stdout.on('data',chunk=>logs+=chunk);child.stderr.on('data',chunk=>logs+=chunk);
const base='http://127.0.0.1:3101';
try{
 let ready=false;
 for(let i=0;i<60;i++){try{const r=await fetch(base);if(r.ok){ready=true;break;}}catch{}await new Promise(resolve=>setTimeout(resolve,200));}
 assert.equal(ready,true,logs);
 for(const route of ['/','/painel','/resultados','/fonts/poppins-0.ttf','/favicon.svg'])assert.equal((await fetch(base+route)).status,200,route);
 const survey=await (await fetch(base+'/api/survey')).json();assert.equal(survey.municipalities.length,853);assert.equal(survey.candidates.length,1727);assert.equal(survey.settings.status,'draft');
 assert.equal((await (await fetch(base+'/api/results')).json()).published,false);
 assert.equal((await fetch(base+'/api/admin')).status,503);
 const closed=await fetch(base+'/api/respond',{method:'POST',headers:{origin:base,'content-type':'application/json'},body:'{}'});assert.equal(closed.status,409,await closed.text());
 console.log('Production HTTP smoke checks passed: pages, local fonts, candidates, closed collection and configuration boundary.');
}catch(error){console.error(error);process.exitCode=1;}finally{child.kill('SIGTERM');}
