"use client"

import type React from "react"
import { useState, useEffect, useCallback } from "react"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table"
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from "@/components/ui/dialog"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { Switch } from "@/components/ui/switch"
import { Plus, Edit, Trash2, Loader2, KeyRound } from "lucide-react"
import { useToast } from "@/hooks/use-toast"
import { API_ENDPOINTS } from "@/lib/api-config"
import { ConfirmationDialog } from "@/components/reusable/confirmation-dialog"

// --- INTERFACES ---
interface Rol {
  id: number;
  nombre: string;
}

interface Usuario {
  id: string;
  nombre_usuario: string;
  email: string;
  rol: string;
  activo: boolean;
  rol_id?: number;
}

// --- COMPONENTE PRINCIPAL ---
export default function UsuariosPage() {
  const [usuarios, setUsuarios] = useState<Usuario[]>([]);
  const [roles, setRoles] = useState<Rol[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [isDialogOpen, setIsDialogOpen] = useState(false);
  const [editingUser, setEditingUser] = useState<Usuario | null>(null);
  const [userToDelete, setUserToDelete] = useState<Usuario | null>(null);

  const { toast } = useToast();

  const fetchData = useCallback(async () => {
    setIsLoading(true);
    try {
      const [usersRes, rolesRes] = await Promise.all([
        fetch(API_ENDPOINTS.USUARIOS.LIST),
        fetch(API_ENDPOINTS.ROLES.LIST)
      ]);
      if (!usersRes.ok || !rolesRes.ok) throw new Error("Error cargando datos");
      
      const usersData = await usersRes.json();
      const rolesData = await rolesRes.json();
      
      setUsuarios(usersData);
      setRoles(rolesData);
    } catch (error) {
      toast({ title: "Error de Carga", description: "No se pudieron cargar los datos.", variant: "destructive" });
    } finally {
      setIsLoading(false);
    }
  }, [toast]);

  useEffect(() => {
    fetchData();
  }, [fetchData]);

  const handleSave = async (data: Partial<Usuario> & { password?: string }) => {
    const isEditing = !!editingUser;
    const url = isEditing ? API_ENDPOINTS.USUARIOS.UPDATE(editingUser!.id) : API_ENDPOINTS.USUARIOS.CREATE;
    const method = isEditing ? 'PUT' : 'POST';

    try {
      await fetch(url, {
        method,
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(data),
      });
      toast({ title: `Usuario ${isEditing ? 'actualizado' : 'creado'}` });
      setIsDialogOpen(false);
      fetchData();
    } catch (error) {
      toast({ title: "Error al guardar el usuario", variant: "destructive" });
    }
  };
  
  const handleDelete = async () => {
    if (!userToDelete) return;
    try {
        await fetch(API_ENDPOINTS.USUARIOS.DELETE(userToDelete.id), { method: 'DELETE' });
        toast({ title: "Usuario eliminado" });
        setUserToDelete(null); // Cerrar el diálogo
        fetchData();
    } catch (error) {
        toast({ title: "Error al eliminar", description: "No se pudo eliminar el usuario.", variant: "destructive" });
        setUserToDelete(null);
    }
  };

  if (isLoading) {
    return <div className="flex items-center justify-center min-h-screen"><Loader2 className="h-16 w-16 animate-spin" /></div>;
  }

  return (
    <div className="flex-1 space-y-4 p-4 md:p-8 pt-6">
      <div className="flex items-center justify-between">
        <h2 className="text-3xl font-bold tracking-tight">Gestión de Usuarios</h2>
        <Button onClick={() => { setEditingUser(null); setIsDialogOpen(true); }}>
          <Plus className="mr-2 h-4 w-4" /> Nuevo Usuario
        </Button>
      </div>
      <Card>
        <CardHeader><CardTitle>Usuarios del Sistema</CardTitle></CardHeader>
        <CardContent>
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Nombre de Usuario</TableHead>
                <TableHead>Email</TableHead>
                <TableHead>Rol</TableHead>
                <TableHead>Estado</TableHead>
                <TableHead className="text-right">Acciones</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {usuarios.length > 0 ? (
                usuarios.map((user) => (
                  <TableRow key={user.id}>
                    <TableCell className="font-medium">{user.nombre_usuario}</TableCell>
                    <TableCell>{user.email}</TableCell>
                    <TableCell><Badge variant="outline">{user.rol}</Badge></TableCell>
                    <TableCell>
                      <Badge variant={user.activo ? "default" : "destructive"}>
                        {user.activo ? "Activo" : "Inactivo"}
                      </Badge>
                    </TableCell>
                    <TableCell className="text-right">
                      <Button variant="ghost" size="icon" onClick={() => { setEditingUser(user); setIsDialogOpen(true); }}>
                        <Edit className="h-4 w-4" />
                      </Button>
                      <Button variant="ghost" size="icon" onClick={() => setUserToDelete(user)}>
                        <Trash2 className="h-4 w-4" />
                      </Button>
                    </TableCell>
                  </TableRow>
                ))
              ) : (
                <TableRow>
                  <TableCell colSpan={5} className="h-24 text-center">
                    No hay usuarios registrados.
                  </TableCell>
                </TableRow>
              )}
            </TableBody>
          </Table>
        </CardContent>
      </Card>
      <UserDialog isOpen={isDialogOpen} onClose={() => setIsDialogOpen(false)} user={editingUser} roles={roles} onSave={handleSave} />
      
      <ConfirmationDialog
        isOpen={!!userToDelete}
        onClose={() => setUserToDelete(null)}
        onConfirm={handleDelete}
        title="¿Estás seguro de eliminar este usuario?"
        description="Esta acción no se puede deshacer. El usuario será eliminado permanentemente."
      />
    </div>
  );
}

// --- COMPONENTE DIALOG PARA CREAR/EDITAR USUARIO ---
interface UserDialogProps {
  isOpen: boolean;
  onClose: () => void;
  user: Usuario | null;
  roles: Rol[];
  onSave: (data: Partial<Usuario> & { password?: string }) => void;
}

// Interfaz para el estado del formulario del Dialog
interface UserFormData {
  nombre_usuario: string;
  email: string;
  password?: string;
  rol_id: number;
  activo: boolean;
}

function UserDialog({ isOpen, onClose, user, roles, onSave }: UserDialogProps) {
  // Estado del formulario con un tipo explícito para evitar 'any'
  const [formData, setFormData] = useState<Partial<UserFormData>>({});

  useEffect(() => {
    if (isOpen) {
      if (user) {
        const currentUserRole = roles.find(r => r.nombre === user.rol);
        setFormData({ 
          nombre_usuario: user.nombre_usuario,
          email: user.email,
          rol_id: currentUserRole?.id, 
          activo: user.activo,
          password: "" 
        });
      } else {
        setFormData({ 
          nombre_usuario: "", 
          email: "", 
          password: "", 
          rol_id: roles[0]?.id, 
          activo: true 
        });
      }
    }
  }, [user, isOpen, roles]);

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    const dataToSave = { ...formData };
    if (user && !dataToSave.password) {
      delete dataToSave.password; // No enviar la contraseña si está vacía al editar
    }
    onSave(dataToSave);
  };

  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent>
        <DialogHeader><DialogTitle>{user ? "Editar Usuario" : "Nuevo Usuario"}</DialogTitle></DialogHeader>
        <form onSubmit={handleSubmit} className="space-y-4 py-4">
          <div className="space-y-2">
            <Label htmlFor="nombre_usuario">Nombre de Usuario</Label>
            <Input id="nombre_usuario" value={formData.nombre_usuario || ""} onChange={e => setFormData(p => ({ ...p, nombre_usuario: e.target.value }))} required />
          </div>
          <div className="space-y-2">
            <Label htmlFor="email">Email</Label>
            <Input id="email" type="email" value={formData.email || ""} onChange={e => setFormData(p => ({ ...p, email: e.target.value }))} required />
          </div>
          <div className="space-y-2">
            <Label htmlFor="password">Contraseña</Label>
            <div className="relative">
              <KeyRound className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
              <Input id="password" type="password" placeholder={user ? "Dejar en blanco para no cambiar" : "Requerida"} value={formData.password || ""} onChange={e => setFormData(p => ({ ...p, password: e.target.value }))} required={!user} className="pl-10" />
            </div>
          </div>
          <div className="space-y-2">
            <Label htmlFor="rol_id">Rol</Label>
            <Select value={formData.rol_id?.toString()} onValueChange={v => setFormData(p => ({ ...p, rol_id: parseInt(v) }))}>
              <SelectTrigger><SelectValue /></SelectTrigger>
              <SelectContent>
                {roles.map(r => <SelectItem key={r.id} value={r.id.toString()}>{r.nombre}</SelectItem>)}
              </SelectContent>
            </Select>
          </div>
          {user && (
            <div className="flex items-center space-x-2">
              <Switch id="activo" checked={formData.activo} onCheckedChange={c => setFormData(p => ({ ...p, activo: c }))} />
              <Label htmlFor="activo">Usuario Activo</Label>
            </div>
          )}
          <DialogFooter>
            <Button type="button" variant="outline" onClick={onClose}>Cancelar</Button>
            <Button type="submit">{user ? 'Actualizar Usuario' : 'Crear Usuario'}</Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  );
}
