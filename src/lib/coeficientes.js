// src/lib/coeficientes.js
// Devuelve coeficiente e IIBB según provincia, programa y tipo de inscripción
import Papa from "papaparse";

let cache = null;

export async function getCoeficientes({ provincia, programa, inscripcion }) {
  if (
    !provincia ||
    !programa ||
    !inscripcion ||
    provincia === "-" ||
    programa === "-" ||
    inscripcion === "-"
  ) {
    return { coeficiente: 1, tasaIibb: 0.035 };
  }
  if (!cache) {
    const res = await fetch("/calculadora/Datos/Datos.csv");
    const csv = await res.text();
    const parsed = Papa.parse(csv, { header: true });
    cache = parsed.data;
  }
  const row = cache.find(
    (r) => r["Provincia"] === provincia && r["Cuota Simple"] === programa
  );
  if (!row) return { coeficiente: 1, tasaIibb: 0.035 };
  let coeficiente = 1;
  if (inscripcion === "Monotributista") {
    coeficiente = parseFloat(row["Monotributo *"]);
  } else {
    coeficiente = parseFloat(row["IVA Resp, Insc."]);
  }
  const tasaIibb = parseFloat(row["Tasa IIBB"]);
  return { coeficiente, tasaIibb };
}
