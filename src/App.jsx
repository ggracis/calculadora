import { useState, useEffect } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Card, CardContent, CardHeader } from "@/components/ui/card";
import {
  TASA_CFT,
  PORCENTAJE_MUNICIPAL,
  IVA_ARANCEL,
  IVA_COSTO_FINANCIERO,
  IVA_RG,
  ARANCEL,
} from "@/lib/variables";
import { IIBB_POR_PROVINCIA } from "@/lib/iibbPorProvincia";
import { Switch } from "@/components/ui/switch";
import { getCoeficientes } from "@/lib/coeficientes";
import { BrowserRouter as Router, Routes, Route, Link } from "react-router-dom";
import DatosTableEditor from "@/components/DatosTableEditor";
import Papa from "papaparse";
import { getGlobales } from "@/lib/globales";

const programas = ["-", "3 Cuotas", "6 Cuotas"];
const inscripciones = [
  "-",
  "Monotributista",
  "Responsable Inscripto",
  "Sociedad",
];
const provincias = [
  "-",
  "Buenos Aires",
  "CABA",
  "Catamarca",
  "Chaco",
  "Chubut",
  "Córdoba",
  "Corrientes",
  "Entre Ríos",
  "Formosa",
  "Jujuy",
  "La Pampa",
  "La Rioja",
  "Mendoza",
  "Misiones",
  "Neuquén",
  "Río Negro",
  "Salta",
  "San Juan",
  "San Luis",
  "Santa Cruz",
  "Santa Fe",
  "Santiago del Estero",
  "Tierra del Fuego",
  "Tucumán",
];

export default function App() {
  const [form, setForm] = useState({
    monto: "",
    programa: "-",
    inscripcion: "-",
    provincia: "-",
  });
  const [resultado, setResultado] = useState(null);
  const [showIibb, setShowIibb] = useState(false);
  const [editMode, setEditMode] = useState(null); // 'datos' | 'globales' | null
  const [datosRows, setDatosRows] = useState([]);
  const [globalesRows, setGlobalesRows] = useState([]);

  // Nuevo: cargar datosRows siempre al inicio (para la tabla de IIBB)
  useEffect(() => {
    async function cargarDatos() {
      try {
        const datosRes = await fetch("/calculadora/Datos/Datos.csv");
        if (!datosRes.ok)
          throw new Error("No se pudo leer el archivo Datos.csv");
        const datosText = await datosRes.text();
        setDatosRows(
          Papa.parse(datosText, { header: true }).data.filter(
            (r) => r.Provincia
          )
        );
      } catch {
        setDatosRows(null);
      }
    }
    cargarDatos();
  }, []);

  // Nuevo: cargar valores globales desde CSV
  const [globales, setGlobales] = useState(null);
  useEffect(() => {
    getGlobales()
      .then(setGlobales)
      .catch(() => setGlobales(null));
  }, []);

  // Nuevo: cálculo automático
  useEffect(() => {
    const calcular = async () => {
      if (!globales) return;
      const monto = parseFloat(
        form.monto.replace(/[$.,]/g, "").replace(",", ".")
      );
      if (
        isNaN(monto) ||
        monto <= 0 ||
        form.programa === "-" ||
        form.inscripcion === "-" ||
        form.provincia === "-"
      ) {
        setResultado(null);
        return;
      }
      const { coeficiente, tasaIibb } = await getCoeficientes({
        provincia: form.provincia,
        programa: form.programa,
        inscripcion: form.inscripcion,
      });
      if (isNaN(coeficiente) || isNaN(tasaIibb) || coeficiente === 1) {
        setResultado({
          error:
            "No se encontró coeficiente para la provincia y programa seleccionados. Verifique los datos en el CSV o seleccione otra combinación.",
        });
        return;
      }
      const tasaPrograma =
        form.programa === "3 Cuotas"
          ? parseFloat(globales.TASA_CFT_3_CUOTAS)
          : parseFloat(globales.TASA_CFT_6_CUOTAS);
      if (isNaN(tasaPrograma)) {
        setResultado({
          error:
            "No se encontró la tasa del programa en el archivo de tasas globales. Verifique el CSV de tasas globales.",
        });
        return;
      }
      const arancel = 0.018;
      const porcentajeMunicipal = 0.01;
      const ivaArancel = 0.21;
      const ivaCostoFinanciero = 0.105;
      const ivaRg = 0.03;
      // --- LOGS DETALLADOS ---
      console.log("\n--- CÁLCULO CUOTA SIMPLE ---");
      console.log(`Precio contado: $${monto}`);
      console.log(
        `Coeficiente (${form.provincia}, ${form.programa}, ${form.inscripcion}): ${coeficiente}`
      );
      const precioSugerido = monto * coeficiente;
      console.log(
        `Precio sugerido = ${monto} x ${coeficiente} = $${precioSugerido}`
      );
      const arancel_1_8 = arancel * precioSugerido;
      console.log(
        `Arancel 1,8% = ${arancel} x ${precioSugerido} = $${arancel_1_8}`
      );
      const costoFinanciero = tasaPrograma * precioSugerido;
      console.log(
        `Costo financiero (${(tasaPrograma * 100).toFixed(
          2
        )}%) = ${tasaPrograma} x ${precioSugerido} = $${costoFinanciero}`
      );
      const ivaArancelMonto = ivaArancel * arancel_1_8;
      console.log(
        `IVA arancel (21%) = ${ivaArancel} x ${arancel_1_8} = $${ivaArancelMonto}`
      );
      const ivaCostoFinancieroMonto = costoFinanciero * ivaCostoFinanciero;
      console.log(
        `IVA costo financiero (10,5%) = ${ivaCostoFinanciero} x ${costoFinanciero} = $${ivaCostoFinancieroMonto}`
      );
      const subtotal =
        precioSugerido -
        (arancel_1_8 +
          costoFinanciero +
          ivaArancelMonto +
          ivaCostoFinancieroMonto);
      console.log(
        `Subtotal = ${precioSugerido} - (${arancel_1_8} + ${costoFinanciero} + ${ivaArancelMonto} + ${ivaCostoFinancieroMonto}) = $${subtotal}`
      );
      const ivaRgMonto = subtotal * ivaRg;
      console.log(
        `IVA RG 140/98 (3%) = ${subtotal} x ${ivaRg} = $${ivaRgMonto}`
      );
      const totalCobradoLiquidacion = subtotal - ivaRgMonto;
      console.log(
        `Total cobrado en la liquidación = ${subtotal} - ${ivaRgMonto} = $${totalCobradoLiquidacion}`
      );
      let ventaNetaIva = 0,
        ivaDebito = 0,
        ivaCredito = 0,
        posicionIva = 0,
        saldoCobrado = 0,
        tasaMunicipal = 0,
        iibb = 0;
      if (form.inscripcion === "Monotributista") {
        iibb = precioSugerido * tasaIibb;
        console.log(`IIBB = ${precioSugerido} x ${tasaIibb} = $${iibb}`);
        ventaNetaIva = 0;
        ivaDebito = 0;
        ivaCredito = 0;
        posicionIva = 0;
        saldoCobrado = totalCobradoLiquidacion - posicionIva;
        console.log(
          `Saldo cobrado (monotributo) = ${totalCobradoLiquidacion} - ${posicionIva} = $${saldoCobrado}`
        );
        tasaMunicipal = precioSugerido * porcentajeMunicipal;
        console.log(
          `Tasa municipal = ${precioSugerido} x ${porcentajeMunicipal} = $${tasaMunicipal}`
        );
      } else {
        ventaNetaIva = precioSugerido;
        iibb = ventaNetaIva * tasaIibb;
        console.log(`IIBB = ${ventaNetaIva} x ${tasaIibb} = $${iibb}`);
        ivaDebito = ventaNetaIva * 0.21;
        ivaCredito = ivaArancelMonto + ivaCostoFinancieroMonto + ivaRgMonto;
        posicionIva = ivaDebito - ivaCredito;
        console.log(`IVA Débito = ${ventaNetaIva} x 0.21 = $${ivaDebito}`);
        console.log(
          `IVA Crédito = ${ivaArancelMonto} + ${ivaCostoFinancieroMonto} + ${ivaRgMonto} = $${ivaCredito}`
        );
        console.log(
          `Posición IVA = ${ivaDebito} - ${ivaCredito} = $${posicionIva}`
        );
        saldoCobrado = totalCobradoLiquidacion - posicionIva;
        console.log(
          `Saldo cobrado = ${totalCobradoLiquidacion} - ${posicionIva} = $${saldoCobrado}`
        );
        tasaMunicipal = ventaNetaIva * porcentajeMunicipal;
        console.log(
          `Tasa municipal = ${ventaNetaIva} x ${porcentajeMunicipal} = $${tasaMunicipal}`
        );
      }
      const utilidadAntesDeCostos = saldoCobrado - tasaMunicipal - iibb;
      console.log(
        `Utilidad antes de costos = ${saldoCobrado} - ${tasaMunicipal} - ${iibb} = $${utilidadAntesDeCostos}`
      );
      const totalDescuentoPesos = precioSugerido - monto;
      console.log(
        `Total de descuentos en pesos = ${precioSugerido} - ${monto} = $${totalDescuentoPesos}`
      );
      // Formateo seguro (no mostrar NaN)
      function f(n) {
        if (typeof n !== "number" || isNaN(n)) return "-";
        return n.toLocaleString("es-AR", {
          minimumFractionDigits: 2,
          maximumFractionDigits: 2,
        });
      }
      // Para mostrar la tasa del programa en %
      const tasaProgramaStr = isNaN(tasaPrograma)
        ? "-"
        : (tasaPrograma * 100)
            .toLocaleString("es-AR", { maximumFractionDigits: 2 })
            .replace(".", ",");
      const tasaIibbStr = isNaN(tasaIibb)
        ? "-"
        : (tasaIibb * 100)
            .toLocaleString("es-AR", { maximumFractionDigits: 2 })
            .replace(".", ",");
      setResultado({
        precioSugerido: f(precioSugerido),
        detalles: [
          { label: "Precio contado", value: f(monto) },
          { label: "Precio sugerido", value: f(precioSugerido) },
          {
            label: "Total de descuentos en pesos",
            value: f(totalDescuentoPesos),
          },
          {
            label: "",
            value:
              "ACLARACIÓN: Los montos se calcularon en base al precio sugerido, aplicando los descuentos correspondientes al programa seleccionado, IVA, IIBB y la tasa municipal. <hr>",
          },
          { label: "", value: "Detalle de descuentos:" },
          {
            label: `Tasa del programa ${form.programa} (${tasaProgramaStr}%)`,
            value: f(costoFinanciero),
          },
          { label: "Arancel T.Cred (1,8%)", value: f(arancel_1_8) },
          { label: "IVA (21%)", value: f(ivaArancelMonto) },
          {
            label: "IVA (10,5%) ley 25.063",
            value: f(ivaCostoFinancieroMonto),
          },
          { label: "<h3>Subtotal</h3>", value: f(subtotal) },
          { label: "IVA RG 140/98 (3%)", value: f(ivaRgMonto) },
          { label: "<b>Liquidación</b>", value: f(totalCobradoLiquidacion) },
          { label: "", value: "<hr>" },
          { label: "Venta neta de IVA", value: f(ventaNetaIva) },
          { label: "IVA Débito (sobre venta neta)", value: f(ivaDebito) },
          {
            label: "IVA Crédito (sobre costo financieros)",
            value: f(ivaCredito),
          },
          { label: "<h3>Posición IVA</h3>", value: f(posicionIva) },
          { label: "Saldo cobrado", value: f(saldoCobrado) },
          { label: "Tasa Municipal (1%)", value: f(tasaMunicipal) },
          {
            label: `II.BB (Alícuota para la provincia de ${form.provincia}: ${tasaIibbStr}%)`,
            value: f(iibb),
          },
          {
            label: "Utilidad antes de costos",
            value: f(utilidadAntesDeCostos),
          },
          {
            label: "",
            value:
              '<span style="font-size:11px;color:#888;">Ecuación: Precio sugerido = Precio contado × Coeficiente. Se descuentan: arancel 1,8%, costo financiero del programa, IVA sobre arancel y costo financiero, RG 140/98 (3%), IIBB y tasa municipal según provincia e inscripción.</span>',
          },
        ],
      });
    };
    calcular();
  }, [form.monto, form.programa, form.inscripcion, form.provincia, globales]);

  const handleChange = (e) =>
    setForm({ ...form, [e.target.name]: e.target.value });

  // Cargar CSVs y parsear a tabla
  async function loadCsvs() {
    const datosRes = await fetch("/calculadora/Datos/Datos.csv");
    const datosText = await datosRes.text();
    setDatosRows(
      Papa.parse(datosText, { header: true }).data.filter((r) => r.Provincia)
    );

    const globalesRes = await fetch("/calculadora/Datos/Globales.csv");
    const globalesText = await globalesRes.text();
    setGlobalesRows(
      Papa.parse(globalesText, { header: true }).data.filter((r) => r.Variable)
    );
  }

  // Al abrir editor
  function handleEdit(tipo) {
    loadCsvs();
    setEditMode(tipo);
  }

  // Guardar cambios CSV (descargar)
  function handleSave(tipo, rows) {
    let csv = "";
    if (tipo === "datos") {
      csv = Papa.unparse(rows);
      setDatosRows(rows);
    } else {
      csv = Papa.unparse(rows);
      setGlobalesRows(rows);
    }
    // Descargar CSV
    const blob = new Blob([csv], { type: "text/csv" });
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    a.download = tipo === "datos" ? "Datos.csv" : "Globales.csv";
    a.click();
    URL.revokeObjectURL(url);
    setEditMode(null);
  }

  return (
    <Router>
      <div className="min-h-screen bg-gray-50 flex flex-col">
        {/* Header */}
        <header className="text-center py-8">
          <img
            src="logos_came_con_fondo y recortados.png"
            alt="Logo CAME"
            className="mx-auto mb-4 max-w-xs"
          />
          <h1 className="text-4xl font-bold">
            Calculadora
            <br />
            Cuota Simple
          </h1>
        </header>

        {/* Formulario principal */}
        <main className="flex-1 flex flex-col items-center">
          <Routes>
            <Route
              path="/calculadora/editor-csv"
              element={
                <div>
                  <h2 className="text-xl font-bold mb-4">
                    Editor de Datos y Tasas
                  </h2>
                  <div className="flex gap-2 mb-4">
                    <Button
                      variant="outline"
                      onClick={() => handleEdit("datos")}
                    >
                      Editar Datos IIBB
                    </Button>
                    <Button
                      variant="outline"
                      onClick={() => handleEdit("globales")}
                    >
                      Editar Tasas Globales
                    </Button>
                  </div>
                  {editMode === "datos" && (
                    <DatosTableEditor
                      title="Datos IIBB"
                      columns={[
                        { key: "Provincia", label: "Provincia" },
                        { key: "Tasa IIBB", label: "Tasa IIBB" },
                        { key: "Cuota Simple", label: "Cuota Simple" },
                        { key: "IVA Resp, Insc.", label: "IVA Resp, Insc." },
                        { key: "Monotributo *", label: "Monotributo *" },
                      ]}
                      data={datosRows}
                      onChange={setDatosRows}
                      onSave={(rows) => handleSave("datos", rows)}
                      onCancel={() => setEditMode(null)}
                    />
                  )}
                  {editMode === "globales" && (
                    <DatosTableEditor
                      title="Tasas Globales"
                      columns={[
                        { key: "Variable", label: "Variable" },
                        { key: "Valor", label: "Valor" },
                      ]}
                      data={globalesRows}
                      onChange={setGlobalesRows}
                      onSave={(rows) => handleSave("globales", rows)}
                      onCancel={() => setEditMode(null)}
                    />
                  )}
                </div>
              }
            />
            <Route
              path="*"
              element={
                <>
                  <Card className="w-full max-w-3xl mb-8">
                    <CardHeader>
                      <h2 className="text-2xl font-semibold">
                        Ingrese los datos
                      </h2>
                    </CardHeader>
                    <CardContent>
                      <form
                        className="grid grid-cols-1 md:grid-cols-4 gap-2"
                        // onSubmit eliminado
                      >
                        <div>
                          <label className="block mb-1 text-sm font-medium">
                            Precio contado
                          </label>
                          <Input
                            name="monto"
                            value={form.monto}
                            onChange={handleChange}
                            placeholder="$"
                            required
                          />
                        </div>
                        <div>
                          <label className="block mb-1 text-sm font-medium">
                            Programa
                          </label>
                          <Select
                            value={form.programa}
                            onValueChange={(value) =>
                              setForm({ ...form, programa: value })
                            }
                          >
                            <SelectTrigger>
                              <SelectValue placeholder="Programa" />
                            </SelectTrigger>
                            <SelectContent>
                              {programas.map((p) => (
                                <SelectItem key={p} value={p}>
                                  {p}
                                </SelectItem>
                              ))}
                            </SelectContent>
                          </Select>
                        </div>
                        <div>
                          <label className="block mb-1 text-sm font-medium">
                            Tipo de inscripción
                          </label>
                          <Select
                            value={form.inscripcion}
                            onValueChange={(value) =>
                              setForm({ ...form, inscripcion: value })
                            }
                          >
                            <SelectTrigger>
                              <SelectValue placeholder="Tipo de inscripción" />
                            </SelectTrigger>
                            <SelectContent>
                              {inscripciones.map((i) => (
                                <SelectItem key={i} value={i}>
                                  {i}
                                </SelectItem>
                              ))}
                            </SelectContent>
                          </Select>
                        </div>
                        <div>
                          <label className="block mb-1 text-sm font-medium">
                            Provincia
                          </label>
                          <Select
                            value={form.provincia}
                            onValueChange={(value) =>
                              setForm({ ...form, provincia: value })
                            }
                          >
                            <SelectTrigger>
                              <SelectValue placeholder="Provincia" />
                            </SelectTrigger>
                            <SelectContent>
                              {provincias.map((p) => (
                                <SelectItem key={p} value={p}>
                                  {p}
                                </SelectItem>
                              ))}
                            </SelectContent>
                          </Select>
                        </div>
                      </form>
                    </CardContent>
                  </Card>

                  {/* Resultados */}
                  {resultado && (
                    <Card className="w-full max-w-3xl mb-8">
                      <CardHeader>
                        <h2 className="text-xl font-semibold">Resultado</h2>
                      </CardHeader>
                      <CardContent>
                        {resultado.error ? (
                          <div className="text-red-600 text-sm font-semibold p-4 text-center">
                            {resultado.error}
                          </div>
                        ) : (
                          <>
                            <div className="text-center mb-4">
                              <span className="text-3xl font-bold text-blue-700">
                                El precio sugerido a cobrar es:
                                <br />
                                <span className="text-4xl">
                                  ${resultado.precioSugerido}
                                </span>
                              </span>
                            </div>
                            <ul className="space-y-1">
                              {resultado.detalles.map((d, i) => {
                                // Línea divisoria para <hr>
                                if (d.value === "<hr>") {
                                  return (
                                    <li key={i}>
                                      <hr className="my-2 border-gray-300" />
                                    </li>
                                  );
                                }
                                // Subtítulos grandes
                                if (
                                  /<h3>(.*?)<\/h3>/.test(d.label || d.value)
                                ) {
                                  const text = (d.label || d.value).replace(
                                    /<\/?h3>/g,
                                    ""
                                  );
                                  return (
                                    <li
                                      key={i}
                                      className="mt-4 mb-1 text-lg font-semibold text-blue-800 border-b border-gray-200 pb-1"
                                    >
                                      {text}
                                      {d.value && d.value !== "<hr>" && `: `}
                                      <b>
                                        {d.value && d.value !== "<hr>"
                                          ? d.value
                                          : null}
                                      </b>
                                    </li>
                                  );
                                }
                                // Totales destacados
                                if (/<b>(.*?)<\/b>/.test(d.label || d.value)) {
                                  const text = (d.label || d.value).replace(
                                    /<\/?b>/g,
                                    ""
                                  );
                                  return (
                                    <li
                                      key={i}
                                      className="mt-2 text-lg font-bold text-green-700"
                                    >
                                      {text}
                                      {d.value && d.value !== "<hr>" && `: `}
                                      <b>
                                        {d.value && d.value !== "<hr>"
                                          ? d.value
                                          : null}
                                      </b>
                                    </li>
                                  );
                                }
                                // Aclaración
                                if ((d.value || "").includes("ACLARACIÓN")) {
                                  return (
                                    <li
                                      key={i}
                                      className="text-xs text-gray-600 border-b border-gray-200 pb-2 mb-2"
                                    >
                                      {d.value.replace("<hr>", "")}
                                    </li>
                                  );
                                }
                                // Detalle de descuentos
                                if (
                                  (d.value || "").includes(
                                    "Detalle de descuentos"
                                  )
                                ) {
                                  return (
                                    <li
                                      key={i}
                                      className="font-semibold text-gray-700 mt-2 mb-1"
                                    >
                                      {d.value
                                        .replace("<h3>", "")
                                        .replace("</h3>", "")}
                                    </li>
                                  );
                                }
                                // Posición IVA subtítulo
                                if ((d.label || "").includes("Posición IVA")) {
                                  return (
                                    <li
                                      key={i}
                                      className="font-semibold text-blue-700 mt-2"
                                    >
                                      {d.label
                                        .replace("<h3>", "")
                                        .replace("</h3>", "")}
                                      : <b>{d.value}</b>
                                    </li>
                                  );
                                }
                                // Subtotal destacado
                                if ((d.label || "").includes("Subtotal")) {
                                  return (
                                    <li
                                      key={i}
                                      className="font-semibold text-blue-700"
                                    >
                                      {d.label
                                        .replace("<h3>", "")
                                        .replace("</h3>", "")}
                                      : <b>{d.value}</b>
                                    </li>
                                  );
                                }
                                // Liquidación destacado
                                if ((d.label || "").includes("Liquidación")) {
                                  return (
                                    <li
                                      key={i}
                                      className="font-bold text-green-700"
                                    >
                                      {d.label
                                        .replace("<b>", "")
                                        .replace("</b>", "")}
                                      : <b>{d.value}</b>
                                    </li>
                                  );
                                }
                                // Si el label está vacío, renderizar value como HTML
                                if (!d.label) {
                                  return (
                                    <li
                                      key={i}
                                      className="mb-1"
                                      dangerouslySetInnerHTML={{
                                        __html: d.value,
                                      }}
                                    />
                                  );
                                }
                                // Si el label contiene HTML, renderizarlo como HTML
                                if (/<[a-z][\s\S]*>/i.test(d.label)) {
                                  return (
                                    <li key={i} className="mb-1">
                                      <span
                                        dangerouslySetInnerHTML={{
                                          __html: d.label,
                                        }}
                                      />
                                      : <b>{d.value}</b>
                                    </li>
                                  );
                                }
                                // Normal
                                return (
                                  <li key={i} className="mb-1">
                                    {d.label}: <b>{d.value}</b>
                                  </li>
                                );
                              })}
                            </ul>
                          </>
                        )}
                        {/*    <Button className="mt-4" disabled>
                          Descargar PDF (próximamente)
                        </Button> */}
                      </CardContent>
                    </Card>
                  )}

                  {/* Switch para mostrar/ocultar tabla de tasas de IIBB */}
                  <div className="w-full max-w-2xl mb-8 flex items-center gap-2">
                    <Switch
                      checked={showIibb}
                      onCheckedChange={setShowIibb}
                      id="iibb-switch"
                    />
                    <label
                      htmlFor="iibb-switch"
                      className="text-sm select-none cursor-pointer"
                    >
                      Tasas de ingresos brutos vigentes
                    </label>
                  </div>

                  {/* Tabla de tasas de IIBB */}
                  {showIibb && (
                    <div className="w-full max-w-2xl mb-8 bg-white rounded shadow p-4 overflow-x-auto">
                      {datosRows === null ? (
                        <div className="text-red-600 text-sm font-semibold p-2">
                          Error: No se pudo leer el archivo Datos.csv. Verifique
                          que el archivo exista y tenga el formato correcto.
                        </div>
                      ) : (
                        <table className="min-w-full text-sm">
                          <thead>
                            <tr>
                              <th className="text-left p-2 border-b">
                                Provincia
                              </th>
                              <th className="text-left p-2 border-b">
                                Tasa IIBB
                              </th>
                              <th className="text-left p-2 border-b">
                                Cuota Simple
                              </th>
                              <th className="text-left p-2 border-b">
                                IVA Resp, Insc.
                              </th>
                              <th className="text-left p-2 border-b">
                                Monotributo *
                              </th>
                            </tr>
                          </thead>
                          <tbody>
                            {(datosRows || []).map((row, idx) => (
                              <tr key={idx}>
                                <td className="p-2 border-b">
                                  {row["Provincia"]}
                                </td>
                                <td className="p-2 border-b">
                                  {row["Tasa IIBB"]
                                    ? `${(
                                        parseFloat(row["Tasa IIBB"]) * 100
                                      ).toLocaleString("es-AR", {
                                        maximumFractionDigits: 2,
                                      })}%`
                                    : ""}
                                </td>
                                <td className="p-2 border-b">
                                  {row["Cuota Simple"]}
                                </td>
                                <td className="p-2 border-b">
                                  {row["IVA Resp, Insc."]}
                                </td>
                                <td className="p-2 border-b">
                                  {row["Monotributo *"]}
                                </td>
                              </tr>
                            ))}
                          </tbody>
                        </table>
                      )}
                    </div>
                  )}
                  <div className="text-justify text-xs text-gray-500 max-w-2xl">
                    <b>Aclaración</b>
                    <p>
                      El usuario reconoce y acepta que los datos generados son a
                      título meramente informativo y orientativo. La herramienta
                      no apunta a establecer precios finales para ninguna
                      operación sino brindar, de manera detallada, la
                      información que un comercio puede necesitar para definir,
                      por decisión propia, los precios de los productos y
                      servicios que comercializa a través de las promociones del
                      programa Cuota Simple. Asimismo, CAME no se responsabiliza
                      por la información brindada por el sistema, su
                      actualización o su falta de disponibilidad. <br />
                      Para mayor información&nbsp;
                      <a
                        href="#https://www.argentina.gob.ar/economia/comercio/cuota-simple"
                        target="_blank"
                        className="underline"
                      >
                        click aquí
                      </a>
                    </p>
                  </div>
                  {/* Aquí puedes agregar los componentes de encuesta, consultas y tabla de tasas */}
                </>
              }
            />
          </Routes>
        </main>

        {/* Footer con redes */}
        <footer className="bg-white border-t py-6 mt-8">
          <div className="flex justify-center gap-6 mb-2">
            <a
              href="https://www.facebook.com/redcame"
              target="_blank"
              rel="noopener noreferrer"
            >
              <img src="facebook.png" alt="Facebook" className="w-8" />
            </a>
            <a
              href="https://www.instagram.com/redcame/"
              target="_blank"
              rel="noopener noreferrer"
            >
              <img src="ig.png" alt="Instagram" className="w-8" />
            </a>
            <a
              href="https://twitter.com/redcame"
              target="_blank"
              rel="noopener noreferrer"
            >
              <img src="twiter.png" alt="Twitter" className="w-8" />
            </a>
            <a
              href="https://ar.linkedin.com/company/redcame"
              target="_blank"
              rel="noopener noreferrer"
            >
              <img src="linkedin.png" alt="LinkedIn" className="w-8" />
            </a>
            <a
              href="https://www.youtube.com/c/CAMEar"
              target="_blank"
              rel="noopener noreferrer"
            >
              <img src="yutu.png" alt="YouTube" className="w-8" />
            </a>
          </div>
        </footer>
      </div>
    </Router>
  );
}
