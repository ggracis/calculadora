import { useState } from "react";
import { Card, CardHeader, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";

export default function DatosEditor({ title, csvText, onSave, onCancel }) {
  const [text, setText] = useState(csvText);
  return (
    <Card className="max-w-2xl mx-auto my-8">
      <CardHeader>
        <h2 className="text-xl font-semibold">Editar {title}</h2>
      </CardHeader>
      <CardContent>
        <textarea
          className="w-full h-64 border rounded p-2 font-mono text-xs mb-4"
          value={text}
          onChange={(e) => setText(e.target.value)}
        />
        <div className="flex gap-2 justify-end">
          <Button variant="outline" onClick={onCancel}>
            Cancelar
          </Button>
          <Button onClick={() => onSave(text)}>Guardar</Button>
          <Button
            variant="secondary"
            onClick={() => {
              const blob = new Blob([text], { type: "text/csv" });
              const url = URL.createObjectURL(blob);
              const a = document.createElement("a");
              a.href = url;
              a.download = `${title.replace(/ /g, "_")}.csv`;
              a.click();
              URL.revokeObjectURL(url);
            }}
          >
            Descargar CSV
          </Button>
        </div>
      </CardContent>
    </Card>
  );
}
