# Calculadora Cuota Simple (React + Vite + ShadCN + Tailwind)

Esta aplicación web permite simular el precio sugerido, costos, tasas e impuestos asociados al programa Cuota Simple para comercios de Argentina. Permite editar coeficientes y tasas desde archivos CSV, visualizar el desglose completo y consultar las tasas de ingresos brutos vigentes por provincia.

## ¿Qué hace la aplicación?
- Calcula el precio sugerido a cobrar para ventas con Cuota Simple, según provincia, tipo de inscripción y programa (3 o 6 cuotas).
- Desglosa todos los costos, tasas e impuestos involucrados: arancel, costo financiero, IVA, RG 140/98, IIBB, tasa municipal, etc.
- Permite editar los coeficientes y tasas desde archivos CSV visualmente, con opción de descarga.
- Muestra una tabla de tasas de IIBB por provincia.
- Optimizada para SEO y con diseño moderno y responsivo.

## Estructura del desglose de resultados
- **Precio contado**: El valor de venta al contado ingresado por el usuario.
- **Precio sugerido**: El precio final sugerido a cobrar, calculado aplicando el coeficiente correspondiente al programa y provincia.
- **Total de descuentos en pesos**: Diferencia entre el precio sugerido y el precio contado.
- **Tasa del programa**: Costo financiero del programa (3 o 6 cuotas), según tasas oficiales.
- **Arancel T.Cred (1,8%)**: Comisión de tarjeta de crédito sobre el precio sugerido.
- **IVA (21%)**: IVA sobre el arancel de tarjeta de crédito.
- **IVA (10,5%) ley 25.063**: IVA sobre el costo financiero del programa.
- **Subtotal**: Precio sugerido menos todos los descuentos anteriores.
- **IVA RG 140/98 (3%)**: Retención de IVA según RG 140/98 sobre el subtotal.
- **Liquidación**: Monto neto recibido tras todos los descuentos y retenciones anteriores.
- **Venta neta de IVA**: Base imponible para IVA (depende del tipo de inscripción).
- **IVA Débito (sobre venta neta)**: IVA generado por la venta (solo para responsables inscriptos/sociedades).
- **IVA Crédito (sobre costos financieros)**: IVA que puede tomarse como crédito fiscal (arancel, costo financiero, RG 140/98).
- **Posición IVA**: Diferencia entre IVA débito y crédito.
- **Saldo cobrado**: Monto efectivamente recibido tras restar la posición IVA a la liquidación.
- **Tasa Municipal (1%)**: Tasa municipal sobre la venta (puede variar según jurisdicción).
- **II.BB (Alícuota para la provincia...)**: Ingresos Brutos según provincia y tipo de inscripción.
- **Utilidad antes de costos**: Saldo cobrado menos tasa municipal e IIBB. Es la utilidad bruta antes de otros costos internos del comercio.

### Definiciones clave
- **Saldo cobrado**: Es el monto neto que recibe el comercio luego de aplicar todos los descuentos, retenciones y la posición de IVA (débito - crédito). Representa el dinero efectivamente disponible antes de impuestos locales.
- **Utilidad antes de costos**: Es el saldo cobrado menos la tasa municipal y los ingresos brutos. Representa la utilidad bruta antes de considerar otros costos internos del comercio (alquiler, sueldos, etc).

## Edición de tasas y coeficientes
- Los coeficientes y tasas se almacenan en archivos CSV editables desde la ruta `/calculadora/editor-csv`.
- Los cambios pueden descargarse como CSV, pero no se guardan en el servidor (no hay backend).

## Estructura del proyecto
- `src/App.jsx`: Lógica principal, UI y cálculo.
- `public/Datos/Datos.csv`: Coeficientes y tasas por provincia/programa.
- `public/Datos/Globales.csv`: Tasas globales del programa.
- `src/components/DatosTableEditor.jsx`: Editor visual de CSV.
- `src/lib/coeficientes.js`: Lógica para leer coeficientes/tasas desde CSV.
- `src/lib/globales.js`: Lógica para leer tasas globales desde CSV.

## Instalación y uso
1. Instalar dependencias:
   ```sh
   pnpm install
   ```
2. Iniciar en modo desarrollo:
   ```sh
   pnpm dev
   ```
3. Acceder a la app en `http://localhost:5173/calculadora/`

## Créditos
Desarrollado por CAME. Basado en React, Vite, ShadCN y Tailwind CSS.
