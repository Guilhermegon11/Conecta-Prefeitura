export const runtime = 'nodejs';
export const dynamic = 'force-dynamic';
export const maxDuration = 30;

import {admin, db, json, settings} from '@/lib/server';
import {localityFilters} from '@/lib/locality';
import {validElectorTotal, type SurveyResponse} from '@/lib/statistics';
import {createWorkbook} from '@/lib/workbook';
import candidates from '@/data/candidates.json';

export async function GET(req: Request) {
 try {
  if (!await admin()) return json({error: 'Entre no painel para exportar as respostas.'}, 401);
  const query = new URL(req.url).searchParams;
  const cohort = query.get('cohort') || 'test';
  const locality = query.get('locality') || 'all';
  const electors = Number(query.get('electors') ?? '1500');
  if ((cohort !== 'test' && cohort !== 'real') || !localityFilters.some(item => item.id === locality)) return json({error: 'Filtro de exportação inválido.'}, 400);
  if (!validElectorTotal(electors)) return json({error: 'Informe um total inteiro de 1 a 100.000.000 eleitores.'}, 400);
  const condition = locality === 'yes' ? ' AND votes_in_varzea_da_palma=1' : locality === 'no' ? ' AND votes_in_varzea_da_palma=0' : locality === 'legacy' ? ' AND votes_in_varzea_da_palma IS NULL' : '';
  const [stored, config] = await Promise.all([
   db().prepare('SELECT id, created_at, votes_in_varzea_da_palma, is_test, choices FROM responses WHERE is_test=?' + condition + ' ORDER BY created_at DESC').bind(cohort === 'test' ? 1 : 0).all<{id: string; created_at: string; votes_in_varzea_da_palma: number | null; is_test: number; choices: string}>(),
   settings()
  ]);
  const responses: SurveyResponse[] = stored.results.map(row => ({
   id: row.id, created_at: row.created_at, isTest: Number(row.is_test) === 1,
   votesInVarzeaDaPalma: row.votes_in_varzea_da_palma == null ? null : Number(row.votes_in_varzea_da_palma) === 1,
   choices: JSON.parse(row.choices)
  }));
  const book = createWorkbook({responses, candidates, cohort, locality, targetElectors: electors, title: config.title});
  const buffer = await book.xlsx.writeBuffer();
  const filename = `minas-opina-${cohort === 'test' ? 'teste' : 'real'}-${locality}-${new Date().toISOString().slice(0, 10)}.xlsx`;
  return new Response(new Uint8Array(buffer), {headers: {
   'Content-Type': 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet',
   'Content-Disposition': `attachment; filename="${filename}"`,
   'Cache-Control': 'private, no-store', 'X-Content-Type-Options': 'nosniff'
  }});
 } catch (error) {
  console.error('Falha ao exportar respostas:', error);
  return json({error: 'Não foi possível exportar as respostas. Tente novamente.'}, 503);
 }
}
