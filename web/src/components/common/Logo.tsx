export function Logo() {
  return (
    <div className="flex items-center gap-2">
      <div className="w-8 h-8 rounded-lg bg-gold flex items-center justify-center">
        <span className="text-lg font-bold text-background">★</span>
      </div>
      <span className="text-xl font-bold tracking-tight text-foreground">
        Big <span className="text-gold">Starz</span>
      </span>
    </div>
  );
}
