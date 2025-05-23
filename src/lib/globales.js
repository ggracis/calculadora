// src/lib/globales.js
// Lee los valores globales desde el CSV Globales.csv
import Papa from "papaparse";

let cache = null;

export async function getGlobales() {
  if (cache) return cache;
  const res = await fetch("/calculadora/Datos/Globales.csv");
  const csv = await res.text();
  const parsed = Papa.parse(csv, { header: true });
  cache = {};
  parsed.data.forEach((row) => {
    if (row.Variable && row.Valor) {
      cache[row.Variable] = parseFloat(row.Valor);
    }
  });
  return cache;
}
