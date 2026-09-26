export const runtime='nodejs';
export const dynamic='force-dynamic';
export const maxDuration=30;
import {json,settings} from '@/lib/server';
import candidates from '@/data/candidates.json';
import municipalities from '@/data/municipalities.json';
import source from '@/data/source.json';
import {testMode} from '@/lib/mode';
import {databaseConfigured} from '@/lib/database';
export async function GET(){try{return json({settings:await settings(),testMode:testMode(),databaseReady:databaseConfigured(),candidates,municipalities,source});}catch{console.error('Falha ao carregar a pesquisa.');return json({error:'Não foi possível carregar a pesquisa. Tente novamente em instantes.'},503);}}
