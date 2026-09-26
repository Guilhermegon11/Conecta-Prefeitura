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
 initializing??=c.batch(schema,'write').then(()=>{}).catch(error=>{initializing=undefined;throw error;});
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
