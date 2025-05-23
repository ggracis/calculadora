// src/lib/variables.js
export const TASA_CFT = {
  "3 Cuotas": parseFloat(import.meta.env.VITE_TASA_CFT_3_CUOTAS),
  "6 Cuotas": parseFloat(import.meta.env.VITE_TASA_CFT_6_CUOTAS),
};
export const PORCENTAJE_MUNICIPAL = parseFloat(
  import.meta.env.VITE_PORCENTAJE_MUNICIPAL
);
export const IVA_ARANCEL = parseFloat(import.meta.env.VITE_IVA_ARANCEL);
export const IVA_COSTO_FINANCIERO = parseFloat(
  import.meta.env.VITE_IVA_COSTO_FINANCIERO
);
export const IVA_RG = parseFloat(import.meta.env.VITE_IVA_RG);
export const ARANCEL = parseFloat(import.meta.env.VITE_ARANCEL);
