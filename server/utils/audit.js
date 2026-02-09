const { db } = require('../db');

function logAction({ actorId, action, entityType, entityId, detail }) {
  db.prepare(
    'INSERT INTO audit_logs (actor_id, action, entity_type, entity_id, detail) VALUES (?,?,?,?,?)'
  ).run(actorId || null, action, entityType, entityId || null, detail ? JSON.stringify(detail) : null);
}

function diffFields(before, after, fields) {
  const changes = {};
  fields.forEach((field) => {
    if ((before?.[field] ?? null) !== (after?.[field] ?? null)) {
      changes[field] = { from: before?.[field] ?? null, to: after?.[field] ?? null };
    }
  });
  return changes;
}

module.exports = {
  logAction,
  diffFields
};
