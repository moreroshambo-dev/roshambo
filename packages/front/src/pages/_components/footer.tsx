export default function Footer() {
  const currentYear = new Date().getFullYear();

  return (
    <footer className="relative z-10 border-t border-border/30 px-6 py-8 mt-12">
      <div className="max-w-7xl mx-auto flex flex-col sm:flex-row items-center justify-between gap-4">
        <div className="flex items-center gap-2">
          <div className="w-7 h-7 rounded-md bg-gradient-to-br from-neon-purple to-neon-blue flex items-center justify-center text-white font-display font-bold text-xs">
            R
          </div>
          <span className="font-display font-bold text-sm tracking-wider text-foreground">
            RPS ARENA
          </span>
        </div>
        <p className="text-muted-foreground text-xs tracking-wider">
          {currentYear} RPS Arena. All rights reserved.
        </p>
      </div>
    </footer>
  );
}
