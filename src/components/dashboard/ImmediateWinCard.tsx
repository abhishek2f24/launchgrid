import { CheckCircle2, ArrowRight, Sparkles, X } from "lucide-react";
import Link from "next/link";

interface ImmediateWinCardProps {
  storeUrl: string;
  storeName: string;
  onClose?: () => void;
}

export function ImmediateWinCard({ storeUrl, storeName, onClose }: ImmediateWinCardProps) {
  return (
    <div className="relative overflow-hidden rounded-[2rem] bg-white border border-black/5 p-8 shadow-sm font-inter">
      {/* Background Gradient */}
      <div className="absolute top-0 right-0 -mr-20 -mt-20 w-64 h-64 bg-amber-500/10 rounded-full blur-[100px] pointer-events-none" />

      {onClose && (
        <button 
          onClick={onClose}
          className="absolute top-6 right-6 p-2 rounded-full hover:bg-black/5 text-[var(--color-mark-secondary)] transition-colors"
        >
          <X className="w-5 h-5" />
        </button>
      )}

      <div className="relative z-10 flex flex-col md:flex-row gap-10 items-center justify-between">
        
        <div className="flex-1 space-y-6">
          <div className="inline-flex items-center gap-2 px-3 py-1.5 rounded-xl bg-green-50 text-green-700 border border-green-200 text-[10px] font-bold uppercase tracking-widest shadow-sm">
            <CheckCircle2 className="w-4 h-4 text-green-600" /> Account Created
          </div>
          
          <h2 className="text-3xl md:text-5xl font-extrabold tracking-tight text-[var(--color-mark-ink)] font-playfair leading-[1.1]">
            Welcome to <br/>LaunchGrid.
          </h2>
          
          <p className="text-[var(--color-mark-secondary)] text-base font-medium max-w-md leading-relaxed">
            Your store engine is ready. To get your first sale, you need to import your catalog, connect a custom domain, and setup your UPI to receive payments. Let's start the journey.
          </p>

          <div className="flex flex-col sm:flex-row gap-4 pt-4">
            <button 
              className="inline-flex items-center justify-center gap-2 px-6 py-3 bg-[var(--color-mark-ink)] text-white font-bold rounded-xl hover:bg-black/90 transition-transform cursor-pointer shadow-md hover:scale-105 active:scale-95 text-sm"
            >
              <Sparkles className="w-4 h-4" /> Start The Journey
            </button>
            <Link 
              href={`https://${storeUrl}`} 
              target="_blank"
              className="inline-flex items-center justify-center gap-2 px-6 py-3 bg-black/5 border border-black/5 text-[var(--color-mark-ink)] font-bold rounded-xl hover:bg-black/10 transition-colors cursor-pointer text-sm"
            >
              Preview Store <ArrowRight className="w-4 h-4" />
            </Link>
          </div>
        </div>

        {/* Store Preview Mockup */}
        <div className="w-full md:w-[400px] shrink-0">
          <div className="rounded-[1.5rem] border border-black/10 bg-white p-2 shadow-2xl backdrop-blur-sm relative overflow-hidden">
             {/* Gloss overlay */}
            <div className="absolute top-0 left-0 right-0 h-1/2 bg-gradient-to-b from-white/40 to-transparent pointer-events-none z-10" />
            <div className="flex items-center gap-1.5 px-4 py-3 border-b border-black/5 bg-black/[0.02] rounded-t-xl">
              <div className="w-3 h-3 rounded-full bg-red-400" />
              <div className="w-3 h-3 rounded-full bg-amber-400" />
              <div className="w-3 h-3 rounded-full bg-green-400" />
              <div className="ml-4 flex-1 h-6 bg-white rounded-md text-[10px] text-[var(--color-mark-secondary)]/60 flex items-center px-3 font-bold font-mono border border-black/5 shadow-sm">
                https://{storeUrl}
              </div>
            </div>
            {/* Fake skeleton content showing "progressive loading" */}
            <div className="p-5 space-y-4 bg-black/[0.01] rounded-b-xl">
              <div className="w-full h-32 bg-black/5 rounded-xl animate-pulse" />
              <div className="grid grid-cols-2 gap-4">
                <div className="w-full h-24 bg-black/5 rounded-xl animate-pulse" />
                <div className="w-full h-24 bg-black/5 rounded-xl animate-pulse" />
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
