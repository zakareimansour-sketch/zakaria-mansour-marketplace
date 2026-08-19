import { randomBytes } from 'node:crypto';
import { createSecurity } from './security.js';
import { publicUser, throwIfError } from './supabase-client.js';

export function createSupabaseContext({ supabase, jwtSecret, isProduction = false, exposeTokens = !isProduction }) {
  const security = createSecurity(jwtSecret);
  const issueSession = (res, user) => {
    const token = security.sign(user);
    const csrfToken = randomBytes(24).toString('base64url');
    const cookie = { secure: isProduction, sameSite: 'lax', path: '/', maxAge: 7 * 86400000 };
    res.cookie('zm_session', token, { ...cookie, httpOnly: true });
    res.cookie('zm_csrf', csrfToken, { ...cookie, httpOnly: false });
    return exposeTokens ? token : undefined;
  };
  const sessionPayload = (res, user) => {
    const token = issueSession(res, user);
    return token ? { user: publicUser(user), token } : { user: publicUser(user) };
  };
  const audit = async (actorId, action, entityType, entityId = null, metadata = null) => {
    const result = await supabase.from('audit_log').insert({ actor_id: actorId || null, action, entity_type: entityType, entity_id: entityId, metadata });
    if (result.error) console.error('Audit log failed:', result.error.message);
  };
  const userById = async id => {
    const result = await supabase.from('users').select('*').eq('id', Number(id)).maybeSingle();
    return throwIfError(result);
  };
  return { supabase, security, issueSession, sessionPayload, audit, userById };
}
