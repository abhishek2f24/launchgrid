// Each page under (marketing) manages its own layout shell.
// This layout is a transparent passthrough to avoid double-rendering
// GrainOverlay, ProgressBar, JourneyNav, and pt-24/pb-32 padding.
export default function MarketingLayout({
  children,
}: {
  children: React.ReactNode
}) {
  return <>{children}</>
}
