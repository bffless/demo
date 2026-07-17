function handler({ steps }) {
  var rows = steps.get || [];
  var current = 0;
  var recordId = '';

  if (rows.length > 0) {
    current = Number(rows[0].count) || 0;
    recordId = rows[0].id || '';
  }

  var hasRecord = recordId !== '';

  return {
    next: current + 1,
    recordId: recordId,
    hasRecord: hasRecord,
    noRecord: !hasRecord,
  };
}
