"use client";

import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle, CardFooter } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { toast } from "sonner";
import { API_ENDPOINTS } from "@/lib/api-config";
// --- INICIO CORRECCIÓN: Añadir imports faltantes ---
import { Loader2, Save, KeyRound, ShieldCheck, CheckCircle, XCircle } from "lucide-react"; 
// --- FIN CORRECCIÓN ---
import { useSession } from "next-auth/react";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Switch } from "@/components/ui/switch";
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert";
import { AlertDialog, AlertDialogAction, AlertDialogCancel, AlertDialogContent, AlertDialogDescription, AlertDialogFooter, AlertDialogHeader, AlertDialogTitle } from "@/components/ui/alert-dialog";
import { InputOTP, InputOTPGroup, InputOTPSlot } from "@/components/ui/input-otp";
import { Skeleton } from "@/components/ui/skeleton";

interface ProfileData {
    nombre_usuario: string;
    nombre_completo: string;
    email: string;
    foto_url?: string;
    autenticacion_2fa?: boolean;
}

// Función auxiliar para construir URL del avatar (corregida)
const getAvatarUrl = (imagePath?: string | null): string | undefined => {
    if (!imagePath) return undefined;
    if (imagePath.startsWith('http://') || imagePath.startsWith('https://')) return imagePath;
    if (imagePath.startsWith('/uploads/')) {
        const cleanedPath = imagePath.substring('/uploads/'.length);
        return `/api/media/${cleanedPath}`;
    }
    const prefix = imagePath.startsWith('/') ? '/api/media' : '/api/media/';
    return `${prefix}${imagePath}`;
}

export default function PerfilPage() {
    const { data: session, status, update } = useSession();

    if (status === 'loading') {
        return (
            <div className="flex-1 space-y-4 p-4 md:p-8 pt-6">
                <Skeleton className="h-10 w-1/3" />
                <Skeleton className="h-12 w-full" />
                <div className="grid grid-cols-3 gap-2">
                     <Skeleton className="h-10 w-full" />
                     <Skeleton className="h-10 w-full" />
                     <Skeleton className="h-10 w-full" />
                </div>
                <Skeleton className="h-64 w-full" />
            </div>
        );
    }

    if (status === 'unauthenticated' || !session?.user) {
        return <p className="p-8">Necesitas iniciar sesión para ver tu perfil.</p>;
    }

    const profile: ProfileData = {
        nombre_usuario: session.user.name || '',
        nombre_completo: session.user.fullName || session.user.name || '',
        email: session.user.email || '',
        foto_url: session.user.image || undefined,
        autenticacion_2fa: session.user.autenticacion_2fa || false,
    };

    return (
        <div className="flex-1 space-y-4 p-4 md:p-8 pt-6">
            <h2 className="text-3xl font-bold tracking-tight">Mi Perfil</h2>
            <Tabs defaultValue="general" className="w-full">
                <TabsList className="grid w-full grid-cols-2">
                    <TabsTrigger value="general">Información General</TabsTrigger>
                    <TabsTrigger value="password">Cambiar Contraseña</TabsTrigger>
                    {/* <TabsTrigger value="security">Seguridad (2FA)</TabsTrigger> */}
                </TabsList>
                <TabsContent value="general">
                    <GeneralProfileForm 
                        profileData={profile} 
                        onProfileUpdate={async () => await update(true)} 
                    />
                </TabsContent>
                <TabsContent value="password">
                    <PasswordChangeForm />
                </TabsContent>
                {/* <TabsContent value="security">
                    <TwoFactorAuthForm />
                </TabsContent> */}
            </Tabs>
        </div>
    );
}


function GeneralProfileForm({ profileData, onProfileUpdate }: { profileData: ProfileData, onProfileUpdate: () => void }) {
    const { data: session, update } = useSession();
    const [formData, setFormData] = useState(profileData);
    const [selectedFile, setSelectedFile] = useState<File | null>(null);
    const [isSaving, setIsSaving] = useState(false);
    const [isUploading, setIsUploading] = useState(false);

    // Usamos la función auxiliar corregida
    const finalAvatarUrl = getAvatarUrl(formData.foto_url || session?.user?.image);

    const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
        if (e.target.files && e.target.files[0]) {
            setSelectedFile(e.target.files[0]);
        }
    };

    const handleUpload = async () => {
        if (!selectedFile) {
            toast.error("Por favor, selecciona un archivo primero.");
            return;
        }
        setIsUploading(true);
        const body = new FormData();
        body.append('file', selectedFile);

        try {
            const res = await fetch(API_ENDPOINTS.PERFIL.UPLOAD_PICTURE, {
                method: 'POST',
                body: body,
            });
            const data = await res.json();
            if (!res.ok) throw new Error(data.message || 'Error al subir la imagen.');

            const newFileUrl = data.fileUrl; // ej: /uploads/avatars/foto.jpg
            
            setFormData(prevData => ({ ...prevData!, foto_url: newFileUrl }));
            
            // Actualizar la sesión de NextAuth
            await update({ 
                ...session, 
                user: { ...session?.user, image: newFileUrl } 
            });
            
            setSelectedFile(null);
            const fileInput = document.getElementById('foto_file') as HTMLInputElement;
            if (fileInput) fileInput.value = '';

            toast.success("Tu foto de perfil ha sido actualizada.");
            onProfileUpdate(); 

        } catch (error: any) {
            toast.error(`Error al subir: ${error.message}`);
        } finally {
            setIsUploading(false);
        }
    };

    const handleSave = async (e: React.FormEvent) => {
        e.preventDefault();
        setIsSaving(true);
        try {
            const updateData = {
                nombre_completo: formData.nombre_completo,
                nombre_usuario: formData.nombre_usuario,
            };
            
            const res = await fetch(API_ENDPOINTS.PERFIL.UPDATE, {
                method: 'PUT',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify(updateData)
            });
             const responseData = await res.json();
            if (!res.ok) throw new Error(responseData.message || "Error al actualizar");

            // Actualizar sesión si los nombres cambiaron
            if (session?.user?.name !== formData.nombre_usuario || session?.user?.fullName !== formData.nombre_completo) {
                await update({ 
                    ...session,
                    user: { ...session?.user, name: formData.nombre_usuario, fullName: formData.nombre_completo } 
                });
            }

            toast.success("Tu perfil ha sido actualizado.");
            onProfileUpdate();
        } catch (error: any) {
            toast.error(`Error al actualizar: ${error.message}`);
        } finally {
            setIsSaving(false);
        }
    };

     const getInitials = (fullName?: string | null, name?: string | null): string => {
        const targetName = fullName || name;
        if (!targetName) return '??';
        const parts = targetName.trim().split(' ');
        if (parts.length > 1) {
            return (parts[0][0] + parts[parts.length - 1][0]).toUpperCase();
        }
        return parts[0].substring(0, 2).toUpperCase();
     }

    return (
        <Card>
            <CardHeader><CardTitle>Información General</CardTitle></CardHeader>
            <CardContent className="space-y-6">
                 <div className="flex flex-col sm:flex-row items-center gap-4">
                     <Avatar className="h-24 w-24">
                         {/* Usar 'key' para forzar recarga */}
                         <AvatarImage key={finalAvatarUrl} src={finalAvatarUrl} />
                         <AvatarFallback className="text-3xl">
                           {getInitials(formData.nombre_completo, formData.nombre_usuario)}
                         </AvatarFallback>
                     </Avatar>
                     <div className="w-full space-y-2">
                         <Label htmlFor="foto_file">Foto de Perfil</Label>
                         <div className="flex flex-col sm:flex-row gap-2">
                             <Input id="foto_file" type="file" accept="image/jpeg, image/png, image/webp" onChange={handleFileChange} />
                             <Button type="button" onClick={handleUpload} disabled={!selectedFile || isUploading || isSaving} className="w-full sm:w-auto">
                                 {isUploading ? <Loader2 className="h-4 w-4 animate-spin"/> : "Subir Foto"}
                             </Button>
                         </div>
                         <p className="text-xs text-muted-foreground">Sube un archivo JPG, PNG o WebP. Máximo 5MB.</p>
                     </div>
                 </div>
                 <form onSubmit={handleSave}>
                     <div className="space-y-4">
                         <div className="space-y-2">
                             <Label htmlFor="nombre_completo_form">Nombre Completo</Label>
                             <Input id="nombre_completo_form" value={formData.nombre_completo || ""} onChange={e => setFormData({...formData, nombre_completo: e.target.value})} />
                         </div>
                         <div className="space-y-2">
                             <Label htmlFor="nombre_usuario_form">Nombre de Usuario</Label>
                             <Input id="nombre_usuario_form" value={formData.nombre_usuario || ""} onChange={e => setFormData({...formData, nombre_usuario: e.target.value})} />
                         </div>
                         <div className="space-y-2">
                             <Label htmlFor="email_form">Email</Label>
                             <Input id="email_form" type="email" value={formData.email || ""} disabled readOnly />
                             <p className="text-xs text-muted-foreground">El email no se puede cambiar.</p>
                         </div>
                     </div>
                     <CardFooter className="px-0 pt-6">
                         <Button type="submit" disabled={isSaving || isUploading}>
                             {isSaving ? <Loader2 className="mr-2 h-4 w-4 animate-spin"/> : <Save className="mr-2 h-4 w-4" />}
                             Guardar Cambios
                         </Button>
                     </CardFooter>
                 </form>
            </CardContent>
        </Card>
    );
}

// Función auxiliar para mostrar los requisitos de contraseña
function PasswordStrength({ password }: { password?: string }) {
  const checks = [
    { label: "Al menos 13 caracteres", regex: /.{13,}/ },
    { label: "Al menos una letra mayúscula (A-Z)", regex: /[A-Z]/ },
    { label: "Al menos una letra minúscula (a-z)", regex: /[a-z]/ },
    { label: "Al menos un número (0-9)", regex: /[0-9]/ },
    { label: "Al menos un carácter especial (!@#...)", regex: /[!@#$%^&*(),.?":{}|<>]/ },
  ];

  return (
    <div className="space-y-2 p-4 bg-muted/50 rounded-lg border"> 
      <h4 className="text-sm font-semibold mb-2 text-foreground">Requisitos de la contraseña:</h4> 
      {checks.map((check, index) => {
        const isValid = password ? check.regex.test(password) : false;
        return (
          <div key={index} className={`flex items-center text-xs ${isValid ? "text-green-600 font-medium" : "text-muted-foreground"}`}> 
            {isValid 
              ? <CheckCircle className="h-3.5 w-3.5 mr-2 flex-shrink-0" /> 
              : <XCircle className="h-3.5 w-3.5 mr-2 flex-shrink-0" /> 
            }
            {check.label}
          </div>
        );
      })}
    </div>
  );
}

function PasswordChangeForm() {
    const [currentPassword, setCurrentPassword] = useState("");
    const [newPassword, setNewPassword] = useState("");
    const [confirmPassword, setConfirmPassword] = useState("");
    const [isSaving, setIsSaving] = useState(false);

    const handleSave = async (e: React.FormEvent) => {
        e.preventDefault();
        if (newPassword !== confirmPassword) {
            toast.error("Las nuevas contraseñas no coinciden.");
            return;
        }
        
        // Validación de complejidad
        const minLength = 13;
        const hasUpperCase = /[A-Z]/.test(newPassword);
        const hasLowerCase = /[a-z]/.test(newPassword);
        const hasNumber = /[0-9]/.test(newPassword);
        const hasSpecialChar = /[!@#$%^&*(),.?":{}|<>]/.test(newPassword);

        if (!newPassword || newPassword.length < minLength || !hasUpperCase || !hasLowerCase || !hasNumber || !hasSpecialChar) {
             toast.error("La nueva contraseña no cumple con todos los requisitos de seguridad.", { duration: 6000 });
            return;
        }

        setIsSaving(true);
        const toastId = toast.loading("Cambiando contraseña...");
        try {
            const res = await fetch(API_ENDPOINTS.PERFIL.CHANGE_PASSWORD, {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ currentPassword, newPassword })
            });
            const data = await res.json();
            if (!res.ok) throw new Error(data.message || "Error al cambiar la contraseña");

            toast.success("Contraseña actualizada correctamente.", { id: toastId });
            setCurrentPassword("");
            setNewPassword("");
            setConfirmPassword("");
        } catch (error: any) {
            toast.error(`Error: ${error.message}`, { id: toastId });
        } finally {
            setIsSaving(false);
        }
    };

    return (
         <Card>
             <CardHeader>
                 <CardTitle>Cambiar Contraseña</CardTitle>
                 <CardDescription>Asegúrate de que tu nueva contraseña cumpla los requisitos de seguridad.</CardDescription>
             </CardHeader>
             <form onSubmit={handleSave}>
                 <CardContent className="space-y-4">
                     <div className="space-y-2">
                         <Label htmlFor="currentPasswordForm">Contraseña Actual</Label>
                         <Input id="currentPasswordForm" type="password" value={currentPassword} onChange={e => setCurrentPassword(e.target.value)} required />
                     </div>
                     <div className="space-y-2">
                         <Label htmlFor="newPasswordForm">Nueva Contraseña</Label>
                         <Input id="newPasswordForm" type="password" value={newPassword} onChange={e => setNewPassword(e.target.value)} required />
                     </div>
                      <div className="space-y-2">
                         <Label htmlFor="confirmPasswordForm">Confirmar Nueva Contraseña</Label>
                         <Input id="confirmPasswordForm" type="password" value={confirmPassword} onChange={e => setConfirmPassword(e.target.value)} required />
                     </div>
                     
                     {/* Mostrar requisitos */}
                     <PasswordStrength password={newPassword} />

                 </CardContent>
                 <CardFooter>
                      <Button type="submit" disabled={isSaving}>
                         {isSaving ? <Loader2 className="mr-2 h-4 w-4 animate-spin"/> : <KeyRound className="mr-2 h-4 w-4" />}
                         Cambiar Contraseña
                     </Button>
                 </CardFooter>
             </form>
         </Card>
    );
}

function TwoFactorAuthForm() {
    const { data: session, status, update } = useSession();
    const [loadingToggle, setLoadingToggle] = useState(false);
    
    // Lee estado 2FA de la sesión
    const is2faEnabled = session?.user?.autenticacion_2fa || false;
    
    const [showVerification, setShowVerification] = useState(false);
    const [verificationCode, setVerificationCode] = useState('');
    const [isVerifying, setIsVerifying] = useState(false);

    const handleToggle2FA = async (checked: boolean) => {
        setLoadingToggle(true);
        setShowVerification(false);
        setVerificationCode('');

        const toastId = toast.loading(`${checked ? "Iniciando activación" : "Desactivando"} 2FA...`);

        try {
            const response = await fetch(API_ENDPOINTS.PERFIL.TOGGLE_2FA, {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ enable: checked }),
            });
            const data = await response.json();
            if (!response.ok) throw new Error(data.message || 'Error al procesar la solicitud 2FA');

            if (checked) {
                toast.info("Código enviado. Ingrésalo para verificar.", { id: toastId });
                setShowVerification(true);
            } else {
                toast.success("Autenticación de dos factores desactivada.", { id: toastId });
                await update({ ...session, user: { ...session?.user, autenticacion_2fa: false } });
            }
        } catch (error: any) {
            toast.error(error.message, { id: toastId });
        } finally {
            setLoadingToggle(false);
        }
    };

    const handleVerifyCode = async () => {
        if (verificationCode.length !== 6) {
            toast.error("El código debe tener 6 dígitos.");
            return;
        }
        setIsVerifying(true);
        const toastId = toast.loading("Verificando código...");
        try {
            const response = await fetch(API_ENDPOINTS.PERFIL.VERIFY_2FA, {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ code: verificationCode }),
            });
            const data = await response.json();
            if (!response.ok) throw new Error(data.message || 'Error al verificar el código');

            toast.success("¡Autenticación de dos factores activada con éxito!", { id: toastId });
            setShowVerification(false);
            setVerificationCode('');
            await update({ ...session, user: { ...session?.user, autenticacion_2fa: true } });

        } catch (error: any) {
            toast.error(`Error: ${error.message}`, { id: toastId });
        } finally {
            setIsVerifying(false);
        }
    };

     if (status === 'loading') {
        return (
           <Card>
              <CardHeader><Skeleton className="h-6 w-1/2" /></CardHeader>
              <CardContent><Skeleton className="h-10 w-full" /></CardContent>
           </Card>
        );
     }

    return (
        <Card>
            <CardHeader>
                <CardTitle>Autenticación de Dos Factores (2FA)</CardTitle>
                <CardDescription>
                    Añade una capa extra de seguridad. Se enviará un código a tu correo para habilitarla.
                </CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
                 <div className="flex items-center space-x-4">
                     <Switch
                         id="2fa-switch-form"
                         checked={is2faEnabled}
                         onCheckedChange={handleToggle2FA}
                         disabled={loadingToggle || isVerifying}
                         aria-label="Activar/Desactivar Autenticación de Dos Factores"
                     />
                     <Label htmlFor="2fa-switch-form" className="flex-grow">
                         {is2faEnabled ? "2FA Habilitado" : "2FA Deshabilitado"}
                     </Label>
                      {loadingToggle && <Loader2 className="h-4 w-4 animate-spin" />}
                 </div>

                 {/* Modal de Verificación */}
                 <AlertDialog open={showVerification} onOpenChange={(open) => {
                     if (!open && !is2faEnabled) {
                         setShowVerification(false);
                         toast.info("Activación de 2FA cancelada.");
                     }
                 }}>
                    <AlertDialogContent>
                        <AlertDialogHeader>
                            <AlertDialogTitle>Verificación de Dos Factores</AlertDialogTitle>
                            <AlertDialogDescription>
                                Hemos enviado un código a tu correo electrónico ({session?.user?.email}). 
                                Ingrésalo a continuación para activar 2FA.
                            </AlertDialogDescription>
                        </AlertDialogHeader>
                        <div className="py-4 flex justify-center">
                            <InputOTP
                                maxLength={6}
                                value={verificationCode}
                                onChange={(value) => setVerificationCode(value)}
                            >
                                <InputOTPGroup>
                                    <InputOTPSlot index={0} />
                                    <InputOTPSlot index={1} />
                                    <InputOTPSlot index={2} />
                                    <InputOTPSlot index={3} />
                                    <InputOTPSlot index={4} />
                                    <InputOTPSlot index={5} />
                                </InputOTPGroup>
                            </InputOTP>
                        </div>
                        <AlertDialogFooter>
                            <AlertDialogCancel disabled={isVerifying} onClick={() => setShowVerification(false)}>Cancelar</AlertDialogCancel>
                            <AlertDialogAction
                                onClick={(e) => { e.preventDefault(); handleVerifyCode(); }}
                                disabled={verificationCode.length !== 6 || isVerifying}
                            >
                                {isVerifying ? <Loader2 className="mr-2 h-4 w-4 animate-spin" /> : 'Verificar y Activar'}
                            </AlertDialogAction>
                        </AlertDialogFooter>
                    </AlertDialogContent>
                 </AlertDialog>
            </CardContent>
            <CardFooter>
                 <Alert>
                     <ShieldCheck className="h-4 w-4" />
                     <AlertTitle>Recomendación de Seguridad</AlertTitle>
                     <AlertDescription>
                         Recomendamos mantener la autenticación de dos factores activada.
                     </AlertDescription>
                 </Alert>
            </CardFooter>
        </Card>
    );
}