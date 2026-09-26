export const localityQuestion='Você vota em Várzea da Palma?';
export const varzeaDaPalmaId='3170800';
export const localityFilters=[
 {id:'all',name:'Todos os participantes'},
 {id:'yes',name:'Vota em Várzea da Palma: Sim'},
 {id:'no',name:'Vota em Várzea da Palma: Não'},
 {id:'legacy',name:'Não respondido na versão anterior'}
];
export const localityLabel=(value:boolean|null|undefined)=>value===true?'Sim':value===false?'Não':'Não respondido na versão anterior';
export function matchesLocalityFilter(value:boolean|null|undefined,filter:string){return filter==='all'||(filter==='yes'&&value===true)||(filter==='no'&&value===false)||(filter==='legacy'&&value==null);}
