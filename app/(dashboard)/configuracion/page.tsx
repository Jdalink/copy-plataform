"use client"

import React, { useState, useEffect } from "react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Label } from "@/components/ui/label";
import { Input } from "@/components/ui/input";
import { Switch } from "@/components/ui/switch";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Loader2, Save } from "lucide-react";
import { toast } from "sonner"; // Usar sonner directamente
import { useConfig, type ConfiguracionItem } from "@/components/config-provider";
import { palettes, type ThemePalette } from "@/lib/theme-palettes";

const getLogoUrl = (dbPath?: string | null): string => {
    if (!dbPath) return '/placeholder-logo.png';
    if (dbPath.startsWith('http')) return dbPath;
    return `/api/media/${dbPath.replace(/^\//, '')}`;
}

export default function ConfiguracionPage() {
  const { settings: globalSettings, loading, updateSettings, getSetting } = useConfig();
  const [localSettings, setLocalSettings] = useState<ConfiguracionItem[]>([]);
  const [isSaving, setIsSaving] = useState(false);

  useEffect(() => {
    if (globalSettings) {
      setLocalSettings(globalSettings);
    }
  }, [globalSettings]);

  const handleInputChange = (clave: string, valor: string | boolean) => {
    setLocalSettings(currentSettings =>
      currentSettings.map(setting =>
        setting.clave === clave ? { ...setting, valor: String(valor) } : setting
      )
    );
  };

  const handleSave = async () => {
    setIsSaving(true);
    // Filtrar solo los settings que NO son de logo (se guardan por separado)
    const settingsToSave = localSettings.filter(s => !s.clave.startsWith('logo_'));
    try {
      await updateSettings(settingsToSave);
      toast.success("La configuración ha sido guardada correctamente.");
      // Recargar solo si se cambió la paleta para aplicar estilos
      if (localSettings.some(s => s.clave === 'theme_palette')) {
        setTimeout(() => window.location.reload(), 1000); // Dar tiempo al toast
      }
    } catch (error: any) {
      toast.error("Error al Guardar", { description: error.message || "No se pudieron guardar los cambios." });
    } finally {
      setIsSaving(false);
    }
  };

  const renderInput = (setting: ConfiguracionItem) => {
    switch (setting.clave) {
        case 'unidades_default':
            return (
                <Select value={setting.valor} onValueChange={(value) => handleInputChange(setting.clave, value)}>
                    <SelectTrigger><SelectValue /></SelectTrigger>
                    <SelectContent>
                        <SelectItem value="kg">Kilogramos (kg)</SelectItem>
                        <SelectItem value="lb">Libras (lb)</SelectItem>
                    </SelectContent>
                </Select>
            );
        default:
            switch (setting.tipo) {
                case 'boolean':
                    return <Switch id={setting.clave} checked={setting.valor === 'true'} onCheckedChange={(checked) => handleInputChange(setting.clave, checked)} />;
                case 'number':
                    return <Input type="number" id={setting.clave} value={setting.valor} onChange={(e) => handleInputChange(setting.clave, e.target.value)} />;
                default:
                    return <Input type="text" id={setting.clave} value={setting.valor} onChange={(e) => handleInputChange(setting.clave, e.target.value)} />;
            }
    }
  };

  if (loading) {
    return <div className="flex items-center justify-center min-h-[calc(100vh-theme(space.16))]"><Loader2 className="h-16 w-16 animate-spin text-primary" /></div>;
  }

  const logoLoginUrl = getLogoUrl(getSetting('logo_login_url'));
  const logoMainUrl = getLogoUrl(getSetting('logo_main_url'));

  return (
    <div className="flex-1 space-y-4 p-4 md:p-8 pt-6">
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-3xl font-bold tracking-tight">Configuración del Sistema</h2>
          <p className="text-muted-foreground">Ajusta los parámetros generales de la aplicación.</p>
        </div>
        <Button onClick={handleSave} disabled={isSaving}>
          {isSaving ? <Loader2 className="mr-2 h-4 w-4 animate-spin" /> : <Save className="mr-2 h-4 w-4" />}
          Guardar Cambios
        </Button>
      </div>

      <div className="grid gap-6">
        <Card>
          <CardHeader><CardTitle>Parámetros Generales</CardTitle></CardHeader>
          <CardContent className="space-y-6">
            {localSettings.map(setting => (
              <div key={setting.id} className="grid grid-cols-1 md:grid-cols-3 gap-4 items-center border-b pb-4 last:border-b-0 last:pb-0">
                <div className="md:col-span-1 space-y-1">
                  <Label htmlFor={setting.clave} className="font-semibold">{setting.descripcion || setting.clave}</Label>
                  <p className="text-xs text-muted-foreground">Clave: <code>{setting.clave}</code></p>
                </div>
                <div className="md:col-span-2">{renderInput(setting)}</div>
              </div>
            ))}
          </CardContent>
        </Card>
        
      </div>
    </div>
  );
}
