"use client"

import { useConfig } from '@/components/config-provider'
import { paletteMap } from '../../lib/theme-palettes'

/**
 * Este componente inyecta dinámicamente las variables de color CSS
 * basadas en la paleta de tema seleccionada en la configuración.
 */
export function DynamicStyles() {
  const { getSetting, loading } = useConfig();

  if (loading) {
    return null;
  }

  // 1. Obtener el nombre de la paleta seleccionada
  const selectedPaletteName = getSetting('theme_palette') || 'Default';
  const selectedPalette = paletteMap.get(selectedPaletteName);

  if (!selectedPalette) {
    return null;
  }

  // 2. Generar las variables CSS para los temas claro y oscuro
  const lightVars = Object.entries(selectedPalette.colors.light)
    .map(([key, value]) => `  ${key}: ${value};`)
    .join('\n');

  const darkVars = Object.entries(selectedPalette.colors.dark)
    .map(([key, value]) => `  ${key}: ${value};`)
    .join('\n');

  // 3. Construir el bloque de CSS final
  const css = [
    lightVars && `:root {\n${lightVars}\n}`,
    darkVars && `.dark {\n${darkVars}\n}`
  ].filter(Boolean).join('\n\n');
  
  // 4. Inyectar el CSS en el head del documento
  return <style dangerouslySetInnerHTML={{ __html: css }} />;
}