export const runtime='nodejs';
export const dynamic='force-dynamic';
export const maxDuration=30;
import {json,settings,db} from '@/lib/server';
export async function GET(){try{const s=await settings();if(!s.published||s.status!=='closed'||!s.publishAfter||Date.parse(s.publishAfter+'T00:00:00-03:00')>Date.now())return json({published:false,settings:s});const r=await db().prepare('SELECT choices FROM responses WHERE is_test=0').all<{choices:string}>();const counts:Record<string,Record<string,number>>={};for(const row of r.results){for(const [key,value] of Object.entries(JSON.parse(row.choices))){const office=key.startsWith('senador')?'senador':key;counts[office]??={};counts[office][String(value)]=(counts[office][String(value)]||0)+1;}}return json({published:true,settings:s,total:r.results.length,counts});}catch{console.error('Falha ao carregar resultados.');return json({error:'Resultados indisponíveis. Tente novamente.'},503);}}
