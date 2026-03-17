import Logo from "@/components/Logo";

const Index = () => {
  return (
    <div className="min-h-screen flex flex-col items-center justify-center px-4 bg-background">
      <main className="flex flex-col items-center justify-center flex-1 text-center space-y-8">
        <Logo />

        <div className="space-y-2">
          <h1 className="text-4xl sm:text-5xl md:text-6xl font-bold text-foreground tracking-tight">
            ZUUPPI
          </h1>
          <p className="text-lg sm:text-xl text-foreground/90">
            Tudo o que você precisa.
          </p>
        </div>
      </main>

      <footer className="py-8 flex gap-4 text-sm text-muted-foreground">
        <a href="#" className="hover:text-foreground transition-colors">
          Stripe
        </a>
        <a href="#" className="hover:text-foreground transition-colors">
          M-Inner
        </a>
      </footer>
    </div>
  );
};

export default Index;

