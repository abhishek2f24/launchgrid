export function ChapterLabel({
  chapter,
  label,
  className = '',
}: {
  chapter: string;
  label: string;
  className?: string;
}) {
  return (
    <div className={`flex flex-col items-center justify-center space-y-1 mb-8 ${className}`}>
      <span className="caption text-[var(--color-mark-subtle-text)] tracking-[0.1em] text-xs uppercase">
        {chapter}
      </span>
      <span className="caption text-[var(--color-mark-secondary)] tracking-[0.1em] text-xs uppercase">
        {label}
      </span>
    </div>
  );
}
