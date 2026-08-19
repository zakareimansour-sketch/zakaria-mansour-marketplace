export function audit(db, actorId, action, entityType, entityId = null, metadata = null) {
  db.prepare('INSERT INTO audit_log(actor_id,action,entity_type,entity_id,metadata) VALUES(?,?,?,?,?)')
    .run(actorId || null, action, entityType, entityId, metadata ? JSON.stringify(metadata) : null);
}
