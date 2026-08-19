import express from 'express';
import helmet from 'helmet';
import cors from 'cors';
import cookieParser from 'cookie-parser';
import { createSupabaseContext } from './supabase-context.js';
import { createSupabaseAuthRouter } from './routes/supabase-auth.js';
import { createSupabaseCatalogRouter } from './routes/supabase-catalog.js';
import { createSupabaseCommerceRouter } from './routes/supabase-commerce.js';
import { createSupabaseAdminRouter } from './routes/supabase-admin.js';

export function createSupabaseApp({supabase,jwtSecret,setupToken,supabaseUrl,allowedOrigins=['http://localhost:5173'],isProduction=false,exposeTokens=!isProduction}){
 const app=express();const ctx=createSupabaseContext({supabase,jwtSecret,isProduction,exposeTokens});
 app.disable('x-powered-by');if(isProduction)app.set('trust proxy',1);
 app.use(helmet({crossOriginResourcePolicy:{policy:'cross-origin'}}));
 app.use(cors({origin(origin,cb){if(!origin||allowedOrigins.includes(origin))return cb(null,true);cb(new Error('Origin not allowed'));},credentials:true}));
 app.use(cookieParser());app.use(express.json({limit:'300kb'}));
 app.use((req,res,next)=>{if(!['POST','PUT','PATCH','DELETE'].includes(req.method)||!req.cookies?.zm_session||req.headers.authorization?.startsWith('Bearer '))return next();if(!req.cookies.zm_csrf||req.headers['x-csrf-token']!==req.cookies.zm_csrf)return res.status(403).json({error:'CSRF_REJECTED',message:'فشل التحقق الأمني.'});next();});
 app.get('/api/health',(_req,res)=>res.json({ok:true,service:'ZM Marketplace Supabase API',time:new Date().toISOString()}));
 app.use('/api',createSupabaseAuthRouter(ctx,setupToken));
 app.use('/api',createSupabaseCatalogRouter(ctx,supabaseUrl));
 app.use('/api',createSupabaseCommerceRouter(ctx));
 app.use('/api',createSupabaseAdminRouter(ctx));
 app.use((error,_req,res,_next)=>{console.error(error);res.status(500).json({error:'INTERNAL_ERROR',message:'حدث خطأ داخلي غير متوقع.'});});
 return app;
}
