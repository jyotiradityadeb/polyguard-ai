import {readdirSync,readFileSync,existsSync} from 'node:fs';
import {recordSchema} from '../types/scientific';
import {importRecords} from '../lib/research/repository';
import {db} from '../lib/db';
try{if(existsSync('data/imported'))for(const file of readdirSync('data/imported').filter(f=>f.endsWith('.json'))){const rows=JSON.parse(readFileSync(`data/imported/${file}`,'utf8'));console.log(file,await importRecords(rows.map((r:unknown)=>recordSchema.parse(r))));}}finally{await db.$disconnect();}
