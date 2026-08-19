import 'dotenv/config';
import { randomBytes } from 'node:crypto';
import { resolve } from 'node:path';
import { existsSync } from 'node:fs';
import express from 'express';
import { createDatabase } from './database.js';
import { createApp } from './app.js';
import { createSupabaseAdmin } from './supabase-client.js';
import { createSupabaseApp } from './supabase-app.js';

const port=Number(process.env.PORT||process.env.API_PORT||3001);
const isProduction=process.env.NODE_ENV==='production';
const useSupabase=Boolean(process.env.SUPABASE_URL&&process.env.SUPABASE_SERVICE_ROLE_KEY);
const jwtSecret=process.env.JWT_SECRET||randomBytes(48).toString('hex');
const setupToken=process.env.SETUP_TOKEN||randomBytes(18).toString('base64url');
const allowedOrigins=(process.env.ALLOWED_ORIGINS||'http://localhost:5173,https://zakareimansour-sketch.github.io').split(',').map(v=>v.trim()).filter(Boolean);

if(isProduction&&(!process.env.JWT_SECRET||process.env.JWT_SECRET.length<48))throw new Error('Production requires JWT_SECRET with at least 48 characters.');
if(isProduction&&(!process.env.SETUP_TOKEN||process.env.SETUP_TOKEN.length<24))throw new Error('Production requires SETUP_TOKEN with at least 24 characters.');

let app,ownerExists=false;
if(useSupabase){
 const supabase=createSupabaseAdmin({url:process.env.SUPABASE_URL,serviceRoleKey:process.env.SUPABASE_SERVICE_ROLE_KEY});
 const ownerResult=await supabase.from('users').select('id',{count:'exact',head:true}).eq('role','owner');
 ownerExists=(ownerResult.count||0)>0;
 app=createSupabaseApp({supabase,jwtSecret,setupToken,supabaseUrl:process.env.SUPABASE_URL,allowedOrigins,isProduction,exposeTokens:!isProduction});
}else{
 const db=createDatabase(resolve(process.env.DATABASE_PATH||'data/marketplace.sqlite'));
 ownerExists=Boolean(db.prepare("SELECT id FROM users WHERE role='owner' LIMIT 1").get());
 app=createApp({db,jwtSecret,setupToken,isProduction,allowedOrigins,exposeTokens:!isProduction});
 if(isProduction)console.warn('Production is using local SQLite. Configure Supabase for persistent cloud data.');
}

const frontendDirectory=resolve('dist');
if(existsSync(frontendDirectory)){
 app.use(express.static(frontendDirectory,{maxAge:isProduction?'1d':0,index:false}));
 app.use((req,res,next)=>{if(req.method==='GET'&&req.accepts('html')&&!req.path.startsWith('/api/')&&!req.path.startsWith('/media/'))return res.sendFile(resolve(frontendDirectory,'index.html'));next();});
}

app.listen(port,'0.0.0.0',()=>{
 console.log(`ZM Marketplace ${useSupabase?'Supabase':'SQLite'} API listening on http://0.0.0.0:${port}`);
 if(!isProduction&&!process.env.JWT_SECRET)console.warn('Development mode: JWT_SECRET generated for this run.');
 if(!ownerExists&&!isProduction)console.log(`One-time owner setup token: ${setupToken}`);
});
