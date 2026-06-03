export default function AuthLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <div className="flex min-h-screen flex-1 items-center justify-center bg-muted/40 px-4 py-12">
      <div className="w-full max-w-sm">
        <div className="mb-8 text-center">
          <h1 className="text-2xl font-bold tracking-tight text-primary">
            SkelloLike
          </h1>
          <p className="mt-1 text-sm text-muted-foreground">
            Plannings &amp; gestion RH simplifiés
          </p>
        </div>
        {children}
      </div>
    </div>
  );
}
