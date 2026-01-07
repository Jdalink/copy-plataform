// lib/theme-palettes.ts

export interface ThemePalette {
  name: string;
  colors: {
    light: { [key: string]: string };
    dark: { [key: string]: string };
  };
}

export const palettes: ThemePalette[] = [
  {
    name: "Default",
    colors: {
      light: {}, // Vacío para usar los colores por defecto de globals.css
      dark: {},
    },
  },
  {
    name: "Navidad",
    colors: {
      light: {
        '--background': '0 0% 100%',
        '--foreground': '10 80% 15%',
        '--primary': '0 65% 50%',      // Rojo Navidad
        '--primary-foreground': '0 0% 100%',
        '--secondary': '120 60% 96%',
        '--accent': '120 60% 90%',     // Verde Navidad claro
      },
      dark: {
        '--background': '120 20% 10%', // Verde oscuro de fondo
        '--foreground': '0 0% 98%',
        '--primary': '0 70% 55%',      // Rojo brillante
        '--primary-foreground': '0 0% 100%',
        '--secondary': '120 20% 15%',
        '--accent': '0 70% 50%',       // Rojo para acentos
      },
    },
  },
  {
    name: "Bandera de Guatemala",
    colors: {
      light: {
        '--background': '210 100% 97%', // Azul cielo muy claro
        '--foreground': '222.2 84% 4.9%',
        '--primary': '210 80% 50%',      // Azul Bandera
        '--primary-foreground': '0 0% 100%',
        '--secondary': '0 0% 96.1%',
        '--accent': '210 80% 90%',
      },
      dark: {
        '--background': '222.2 84% 4.9%',
        '--foreground': '0 0% 98%',
        '--primary': '210 90% 60%',      // Azul Bandera brillante
        '--primary-foreground': '0 0% 100%',
        '--secondary': '217.2 32.6% 17.5%',
        '--accent': '210 90% 55%',
      },
    },
  },
  {
    name: "Semana Santa",
    colors: {
      light: {
        '--background': '260 50% 98%', // Lila muy pálido
        '--foreground': '260 25% 15%',
        '--primary': '260 60% 50%',      // Morado Procesión
        '--primary-foreground': '0 0% 100%',
        '--secondary': '45 90% 95%',
        '--accent': '45 90% 85%',       // Dorado claro
      },
      dark: {
        '--background': '260 30% 10%', // Morado oscuro
        '--foreground': '0 0% 98%',
        '--primary': '45 80% 60%',       // Dorado brillante
        '--primary-foreground': '260 25% 15%',
        '--secondary': '260 30% 15%',
        '--accent': '45 80% 55%',
      },
    },
  },
];

export const paletteMap = new Map(palettes.map(p => [p.name, p]));