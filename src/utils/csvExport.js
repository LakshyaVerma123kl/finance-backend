function toCSV(records) {
  if (!records.length) return "No records found";

  const headers = [
    "id",
    "amount",
    "type",
    "category",
    "date",
    "notes",
    "created_by_name",
    "created_at",
  ];
  const rows = records.map((r) =>
    headers
      .map((h) => {
        const val = r[h] ?? "";
        // Escape commas and quotes
        return `"${String(val).replace(/"/g, '""')}"`;
      })
      .join(","),
  );

  return [headers.join(","), ...rows].join("\r\n");
}

module.exports = { toCSV };
