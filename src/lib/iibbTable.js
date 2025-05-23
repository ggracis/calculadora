// src/lib/iibbTable.js
// Lee y exporta la tabla de IIBB desde el CSV para mostrarla en la app
import Papa from "papaparse";

export async function getIibbTable() {
  return fetch("/Datos/Datos.csv")
    .then((res) => res.text())
    .then((csv) => {
      const parsed = Papa.parse(csv, { header: true });
      // Filtrar y mapear solo Provincia y Tasa IIBB, sin duplicados
      const unique = {};
      parsed.data.forEach((row) => {
        if (row["Provincia"] && row["Tasa IIBB"]) {
          unique[row["Provincia"]] = row["Tasa IIBB"];
        }
      });
      return Object.entries(unique).map(([provincia, tasa]) => ({
        provincia,
        tasa,
      }));
    });
}
