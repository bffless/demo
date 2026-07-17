function handler({ steps }) {
  var rows = steps.get || [];
  var count = 0;

  if (rows.length > 0) {
    count = Number(rows[0].count) || 0;
  }

  return { count: count };
}
