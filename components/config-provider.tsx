"use client"

import React, { createContext, useContext, useState, useEffect, useCallback, ReactNode } from 'react';
import { API_ENDPOINTS } from '@/lib/api-config';

// Interfaz exportada para ser usada en toda la aplicación
export interface ConfiguracionItem {
  id: number;
  clave: string;
  valor: string;
  descripcion: string;
  tipo: 'string' | 'number' | 'boolean' | 'json';
}

interface ConfigContextType {
  settings: ConfiguracionItem[];
  getSetting: (clave: string) => string | undefined;
  loading: boolean;
  updateSettings: (newSettings: ConfiguracionItem[]) => Promise<void>;
}

const ConfigContext = createContext<ConfigContextType | undefined>(undefined);

export function ConfigProvider({ children }: { children: ReactNode }) {
  const [settings, setSettings] = useState<ConfiguracionItem[]>([]);
  const [loading, setLoading] = useState(true);

  const fetchSettings = useCallback(async () => {
    try {
      const response = await fetch(API_ENDPOINTS.CONFIGURACION.LIST);
      if (!response.ok) throw new Error("Failed to fetch settings");
      const data = await response.json();
      setSettings(data);
    } catch (error) {
      console.error("Error fetching settings:", error);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    fetchSettings();
  }, [fetchSettings]);

  const getSetting = (clave: string): string | undefined => {
    return settings.find(s => s.clave === clave)?.valor;
  };

  const updateSettings = async (newSettings: ConfiguracionItem[]) => {
    await fetch(API_ENDPOINTS.CONFIGURACION.UPDATE, {
      method: 'PUT',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(newSettings),
    });
    await fetchSettings();
  };

  return (
    <ConfigContext.Provider value={{ settings, getSetting, loading, updateSettings }}>
      {children}
    </ConfigContext.Provider>
  );
}

export function useConfig() {
  const context = useContext(ConfigContext);
  if (context === undefined) {
    throw new Error('useConfig must be used within a ConfigProvider');
  }
  return context;
}