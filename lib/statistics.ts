export const offices = [
 {key: 'federal', label: 'Deputado federal'},
 {key: 'estadual', label: 'Deputado estadual'},
 {key: 'senador', label: 'Senador'},
 {key: 'governador', label: 'Governador de Minas Gerais'},
 {key: 'presidente', label: 'Presidente da República'}
] as const;

export type SurveyResponse = {
 id: string;
 created_at: string;
 votesInVarzeaDaPalma: boolean | null;
 isTest: boolean;
 choices: Record<string, string>;
};
export type SummaryRow = {value: string; count: number; share: number; projected: number | null};
export function validElectorTotal(value: number) {
 return Number.isInteger(value) && value >= 1 && value <= 100_000_000;
}

/** Each respondent contributes one choice per office and two choices for senator.
 * Blank, null, undecided, skipped and missing answers remain in the denominator.
 * This is descriptive arithmetic; the target electorate is supplied by the operator.
 */
export function summarize(responses: SurveyResponse[], office: string, targetElectors: number) {
 if (!offices.some(item => item.key === office)) throw new RangeError('Cargo inválido.');
 const keys = office === 'senador' ? ['senador1', 'senador2'] : [office];
 const total = responses.length;
 const denominator = total * keys.length;
 const target = validElectorTotal(targetElectors) ? targetElectors : null;
 const projectedChoices = denominator && target !== null ? target * keys.length : null;
 const counts = new Map<string, number>();
 for (const response of responses) {
  for (const key of keys) {
   const value = response.choices[key] || 'missing';
   counts.set(value, (counts.get(value) || 0) + 1);
  }
 }
 const rows: SummaryRow[] = [...counts].map(([value, count]) => ({
  value, count, share: count / denominator,
  // Per-respondent rate keeps the two-vote Senate pool consistent with the target.
  projected: target !== null && total ? Math.round(count / total * target) : null
 })).sort((a, b) => b.count - a.count || a.value.localeCompare(b.value, 'pt-BR'));
 return {office, total, denominator, choicesPerRespondent: keys.length, targetElectors: target, projectedChoices, rows};
}
