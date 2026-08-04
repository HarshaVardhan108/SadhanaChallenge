export function PageHeader({
  title,
  subtitle,
  emoji,
  action,
}: {
  title: string;
  subtitle?: string;
  emoji?: string;
  action?: React.ReactNode;
}) {
  return (
    <div className="mb-5 flex flex-col gap-3 sm:mb-8 sm:flex-row sm:items-end sm:justify-between sm:gap-4">
      <div className="min-w-0">
        <h1 className="font-serif text-2xl font-bold leading-tight text-krishna sm:text-3xl md:text-4xl">
          {emoji && <span className="mr-1.5 sm:mr-2">{emoji}</span>}
          {title}
        </h1>
        {subtitle && (
          <p className="mt-1.5 max-w-2xl text-sm leading-relaxed text-[var(--text-muted)] sm:mt-2 sm:text-base">
            {subtitle}
          </p>
        )}
      </div>
      {action && <div className="w-full shrink-0 sm:w-auto">{action}</div>}
    </div>
  );
}
