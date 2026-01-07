import {
    AlertDialog,
    AlertDialogAction,
    AlertDialogCancel,
    AlertDialogContent,
    AlertDialogDescription,
    AlertDialogFooter,
    AlertDialogHeader,
    AlertDialogTitle,
} from "@/components/ui/alert-dialog"
import { Button } from "@/components/ui/button"
import { Loader2 } from "lucide-react"

export interface ConfirmationDialogProps { // Exportar la interfaz
    isOpen: boolean;
    onClose: () => void;
    onConfirm: () => void;
    title: string;
    description: string;
    // --- INICIO CORRECCIÓN: Cambiar prop ---
    confirmLabel?: string; // Cambiado de confirmText
    // --- FIN CORRECCIÓN ---
    cancelLabel?: string;
    isLoading?: boolean;
    variant?: "default" | "destructive";
}

export function ConfirmationDialog({
    isOpen,
    onClose,
    onConfirm,
    title,
    description,
    confirmLabel = "Confirmar", // Default
    cancelLabel = "Cancelar",
    isLoading = false,
    variant = "default"
}: ConfirmationDialogProps) { // Usar la interfaz exportada
    return (
        <AlertDialog open={isOpen} onOpenChange={(open) => !open && onClose()}>
            <AlertDialogContent>
                <AlertDialogHeader>
                    <AlertDialogTitle>{title}</AlertDialogTitle>
                    <AlertDialogDescription>
                        {description}
                    </AlertDialogDescription>
                </AlertDialogHeader>
                <AlertDialogFooter>
                    <AlertDialogCancel onClick={onClose} disabled={isLoading}>
                        {cancelLabel}
                    </AlertDialogCancel>
                    {/* --- INICIO CORRECCIÓN: Usar confirmLabel --- */}
                    <AlertDialogAction
                        onClick={(e) => {
                            e.preventDefault();
                            onConfirm();
                        }}
                        disabled={isLoading}
                        className={variant === "destructive" ? "bg-destructive text-destructive-foreground hover:bg-destructive/90" : ""}
                    >
                         {isLoading && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
                        {confirmLabel}
                    </AlertDialogAction>
                     {/* --- FIN CORRECCIÓN --- */}
                </AlertDialogFooter>
            </AlertDialogContent>
        </AlertDialog>
    )
}