"use client"

import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { ShieldAlert } from "lucide-react";
import Link from "next/link";

export default function AccesoDenegadoPage() {
    return (
        <div className="flex items-center justify-center min-h-screen bg-gray-100 dark:bg-gray-900">
            <Card className="w-full max-w-md text-center">
                <CardHeader>
                    <div className="mx-auto bg-red-100 dark:bg-red-900/30 rounded-full p-4 w-fit">
                        <ShieldAlert className="h-12 w-12 text-red-500" />
                    </div>
                    <CardTitle className="mt-4 text-2xl">Acceso Denegado</CardTitle>
                    <CardDescription>
                        No tienes los permisos necesarios para acceder a esta página.
                    </CardDescription>
                </CardHeader>
                <CardContent>
                    <p className="text-sm text-muted-foreground mb-6">
                        Si crees que esto es un error, por favor, contacta a un administrador del sistema.
                    </p>
                    <Button asChild>
                        <Link href="/">Volver al Dashboard</Link>
                    </Button>
                </CardContent>
            </Card>
        </div>
    );
}
