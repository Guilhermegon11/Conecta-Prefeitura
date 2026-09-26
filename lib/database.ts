import {createClient, type Client, type InValue, type InStatement} from '@libsql/client/web';
import {schema} from '@/db/schema';

let client:Client|undefined;
let initializing:Promise<void>|undefined;
export function databaseConfigured(){return !!(process.env.TURSO_DATABASE_URL&&process.env.TURSO_AUTH_TOKEN);}
function connection(){
 if(!databaseConfigured())throw new Error('Configure TURSO_DATABASE_URL e TURSO_AUTH_TOKEN na Vercel.');
 client??=createClient({url:process.env.TURSO_DATABASE_URL!,authToken:process.env.TURSO_AUTH_TOKEN!});
 return client;
}
async function ready(){
 const c=connection();
 initializing??=(async()=>{
  await c.batch(schema,'write');
  // Existing responses are preserved as real data. Never relabel an old response as a test.
  const migrations=[
   ['responses','votes_in_varzea_da_palma','INTEGER CHECK(votes_in_varzea_da_palma IN (0,1))'],
   ['responses','is_test','INTEGER NOT NULL DEFAULT 0 CHECK(is_test IN (0,1))'],
   ['invitations','is_test','INTEGER NOT NULL DEFAULT 0 CHECK(is_test IN (0,1))']
  ];
  for(const [table,column,definition] of migrations){
   const columns=await c.execute(`PRAGMA table_info(${table})`);
   if(columns.rows.some(row=>row.name===column))continue;
   try{await c.execute(`ALTER TABLE ${table} ADD COLUMN ${column} ${definition}`);}
   catch(error){
    // Another server instance may have completed this migration concurrently.
    const current=await c.execute(`PRAGMA table_info(${table})`);
    if(!current.rows.some(row=>row.name===column))throw error;
   }
  }
 })().catch(error=>{initializing=undefined;throw error;});
 await initializing;return c;
}
class Statement {
 constructor(readonly sql:string,readonly args:InValue[]=[]){ }
 bind(...args:InValue[]){return new Statement(this.sql,args);}
 statement():InStatement{return {sql:this.sql,args:this.args};}
 async first<T=Record<string,unknown>>():Promise<T|null>{const result=await (await ready()).execute(this.statement());return (result.rows[0] as unknown as T)||null;}
 async all<T=Record<string,unknown>>():Promise<{results:T[]}>{const result=await (await ready()).execute(this.statement());return {results:result.rows as unknown as T[]};}
 async run(){const result=await (await ready()).execute(this.statement());return {meta:{changes:result.rowsAffected}};}
}
const database={
 prepare:(sql:string)=>new Statement(sql),
 async batch(statements:Statement[]){return (await ready()).batch(statements.map(s=>s.statement()),'write');}
};
export function db(){return database;}
