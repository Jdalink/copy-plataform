import React from 'react';

// Layout para páginas públicas que centra el contenido.
export default function PublicLayout({
  children,
}: {
  children: React.ReactNode;
}) 
{
  return (
    <div className="flex flex-1 w-full items-center justify-center bg-muted/40">
      {children}
    </div>
  );
}
