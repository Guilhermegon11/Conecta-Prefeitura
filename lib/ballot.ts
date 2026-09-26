import featuredData from '@/data/featured-candidates.json';
import type {Candidate} from './survey';
const featured:Record<string,string[]>=featuredData;
export const hasFeaturedCandidates=(office:string)=>!!featured[office]?.length;
export const isFeaturedCandidate=(candidate:Candidate)=>(featured[candidate.office]||[]).includes(candidate.id);
export function compareCandidates(a:Candidate,b:Candidate){
 const ids=featured[a.office]||[];
 const first=ids.indexOf(a.id),second=ids.indexOf(b.id);
 const difference=(first<0?Number.MAX_SAFE_INTEGER:first)-(second<0?Number.MAX_SAFE_INTEGER:second);
 return difference||a.name.localeCompare(b.name,'pt-BR');
}
