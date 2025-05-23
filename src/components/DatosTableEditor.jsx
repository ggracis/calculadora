import { useState, useEffect } from "react";
import { Card, CardHeader, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";

// Recibe: columns, data, onEdit(rowIndex, colKey, newValue)
export function DataTable({ columns, data, onEdit }) {
  return (
    <div className="overflow-x-auto">
      <table className="min-w-full border text-xs">
        <thead>
          <tr>
            {columns.map((col) => (
              <th key={col.key} className="border p-2 bg-gray-100 text-left">
                {col.label}
              </th>
            ))}
          </tr>
        </thead>
        <tbody>
          {data.map((row, rowIdx) => (
            <tr key={rowIdx}>
              {columns.map((col) => (
                <td key={col.key} className="border p-1">
                  <Input
                    className=" text-xs"
                    value={row[col.key] ?? ""}
                    onChange={(e) => onEdit(rowIdx, col.key, e.target.value)}
                  />
                </td>
              ))}
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
}

// Card para edición de tabla CSV
export default function DatosTableEditor({
  title,
  columns,
  data,
  onChange,
  onSave,
  onCancel,
}) {
  const [rows, setRows] = useState(data);

  // Actualizar fila/celda
  function handleEdit(rowIdx, colKey, value) {
    const newRows = rows.map((row, i) =>
      i === rowIdx ? { ...row, [colKey]: value } : row
    );
    setRows(newRows);
    onChange && onChange(newRows);
  }

  // Agregar fila vacía
  function handleAddRow() {
    setRows([...rows, Object.fromEntries(columns.map((c) => [c.key, ""]))]);
  }

  // Eliminar fila
  function handleDeleteRow(idx) {
    setRows(rows.filter((_, i) => i !== idx));
  }

  // Guardar cambios: escribir el CSV original si estamos en entorno local
  async function handleSaveCsv(rows) {
    const Papa = await import("papaparse");
    const csv = Papa.unparse(rows);
    // Si estamos en entorno local (localhost), intentamos escribir el archivo usando la API File System Access
    if (window.location.hostname === "localhost" && window.showSaveFilePicker) {
      try {
        const opts = {
          suggestedName: title.includes("Globales")
            ? "Globales.csv"
            : "Datos.csv",
          types: [{ description: "CSV", accept: { "text/csv": [".csv"] } }],
        };
        const handle = await window.showSaveFilePicker(opts);
        const writable = await handle.createWritable();
        await writable.write(csv);
        await writable.close();
        alert("Archivo CSV guardado correctamente.");
      } catch (e) {
        alert("No se pudo guardar el archivo: " + e.message);
      }
    } else {
      // Fallback: descarga el archivo
      const blob = new Blob([csv], { type: "text/csv" });
      const url = URL.createObjectURL(blob);
      const a = document.createElement("a");
      a.href = url;
      a.download = title.includes("Globales") ? "Globales.csv" : "Datos.csv";
      a.click();
      URL.revokeObjectURL(url);
    }
    onSave && onSave(rows);
  }

  return (
    <Card className="max-w-3xl mx-auto my-8">
      <CardHeader>
        <h2 className="text-xl font-semibold">Editar {title}</h2>
      </CardHeader>
      <CardContent>
        <DataTable columns={columns} data={rows} onEdit={handleEdit} />
        <div className="flex gap-2 mt-4">
          <Button variant="outline" onClick={onCancel}>
            Cancelar
          </Button>
          <Button onClick={() => handleSaveCsv(rows)}>Guardar</Button>
        </div>
      </CardContent>
    </Card>
  );
}
