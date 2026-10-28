// Makes a collection append-only: documents can be created but never changed or deleted
// through Mongoose. Used for version history, reviews and the audit log, which must stay
// exactly as recorded (BR-006, NFR-012, NFR-019).
//
// This guards the application only. Someone with direct database access could still edit
// the data; a production system would also restrict the database user.

const BLOCKED_QUERY_OPERATIONS = [
  'updateOne',
  'updateMany',
  'findOneAndUpdate',
  'replaceOne',
  'findOneAndReplace',
  'deleteOne',
  'deleteMany',
  'findOneAndDelete',
];

export function appendOnly(schema, label) {
  const message = `${label} records are append-only and cannot be changed or deleted.`;

  // Model-level: Model.updateOne(...), Model.deleteMany(...) and friends.
  schema.pre(BLOCKED_QUERY_OPERATIONS, function blockQuery() {
    throw new Error(message);
  });

  // Document-level: doc.updateOne(...) and doc.deleteOne(...) need their own hook.
  schema.pre(['updateOne', 'deleteOne'], { document: true, query: false }, function blockDocument() {
    throw new Error(message);
  });

  schema.pre('save', function blockResave() {
    if (!this.isNew) throw new Error(message);
  });
}
