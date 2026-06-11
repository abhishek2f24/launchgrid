export const COLOR_MAP: Record<string, string> = {
  purple:  '#8b5cf6',
  blue:    '#3b82f6',
  emerald: '#10b981',
  rose:    '#f43f5e',
  amber:   '#f59e0b',
  orange:  '#f97316',
  indigo:  '#6366f1',
  mono:    '#e5e7eb',
  zinc:    '#e5e7eb',
}

export function getTemplateConfig(templateStyle: string, themeColor: string) {
  const accentColor = COLOR_MAP[themeColor] || '#8b5cf6'
  
  switch (templateStyle) {
    case 'minimal':
      return {
        baseClass: 'theme-marketing font-inter min-h-screen relative bg-[#050505] text-[#F8FAFC]',
        headerClass: 'border-b border-white/10 py-5 px-6 md:px-12 flex items-center justify-between bg-[#050505]/80 backdrop-blur-md sticky top-0 z-20',
        heroClass: 'py-24 md:py-32 px-6 md:px-12 text-center max-w-4xl mx-auto',
        titleFont: 'text-5xl md:text-7xl font-bold text-white mb-6 leading-tight tracking-tight font-playfair',
        subtitleClass: 'text-sm md:text-base text-slate-400 mb-10 max-w-lg mx-auto leading-relaxed',
        btnClass: 'inline-flex items-center gap-2 px-8 py-4 bg-white text-black text-xs font-bold uppercase tracking-widest hover:bg-slate-200 transition-colors rounded-none',
        sectionHeaderClass: 'flex items-baseline justify-between border-b border-white/10 py-4 mb-12',
        cardClass: 'aspect-[4/5] overflow-hidden bg-neutral-900 relative border border-white/10',
        inkColor: 'text-[#F8FAFC]',
        secondaryColor: 'text-slate-400',
        footerClass: 'border-t border-white/10 py-12 px-6 md:px-12 text-center bg-[#050505]',
        accentStyle: {
          '--color-mark-base': '#050505',
          '--color-mark-surface': '#0F0F12',
          '--color-mark-subtle': '#141418',
          '--color-mark-muted': '#1E1E24',
          '--color-mark-ink': '#F8FAFC',
          '--color-mark-secondary': '#94A3B8',
          '--color-mark-default': 'rgba(255, 255, 255, 0.1)',
        }
      }
    case 'bold':
      return {
        baseClass: 'theme-marketing font-sans min-h-screen relative bg-white text-black tracking-tight',
        headerClass: 'border-b-4 border-black py-6 px-6 md:px-12 flex items-center justify-between bg-black text-white sticky top-0 z-20',
        heroClass: 'py-28 px-6 text-center max-w-5xl mx-auto border-b-4 border-black mb-12',
        titleFont: 'font-sans font-black uppercase text-5xl sm:text-8xl tracking-tighter leading-none italic text-black mb-6',
        subtitleClass: 'text-base font-bold uppercase tracking-wider text-neutral-600 max-w-xl mx-auto mb-8',
        btnClass: 'inline-flex items-center gap-2 px-10 py-5 bg-black text-white text-sm font-black uppercase tracking-wider hover:bg-neutral-800 transition-colors rounded-none',
        sectionHeaderClass: 'flex items-baseline justify-between border-b-4 border-black py-4 mb-12',
        cardClass: 'aspect-square bg-neutral-100 border-2 border-black overflow-hidden relative rounded-none',
        inkColor: 'text-black font-black uppercase',
        secondaryColor: 'text-neutral-500 font-bold',
        footerClass: 'border-t-4 border-black py-16 px-6 text-center bg-black text-white',
        accentStyle: {
          '--color-mark-base': '#FFFFFF',
          '--color-mark-surface': '#FFFFFF',
          '--color-mark-subtle': '#F3F4F6',
          '--color-mark-muted': '#E5E7EB',
          '--color-mark-ink': '#000000',
          '--color-mark-secondary': '#4B5563',
          '--color-mark-default': '#000000',
        }
      }
    case 'luxury':
      return {
        baseClass: 'theme-marketing font-serif min-h-screen relative bg-[#FAF8F4] text-[#1A1A18]',
        headerClass: 'border-b border-[#1A1A18]/10 py-6 px-6 md:px-12 flex items-center justify-between bg-[#FAF8F4]/95 backdrop-blur-md sticky top-0 z-20 font-serif',
        heroClass: 'py-32 px-6 text-center max-w-4xl mx-auto',
        titleFont: 'font-serif italic text-4xl sm:text-7xl tracking-wide text-[#1A1A18] mb-8',
        subtitleClass: 'text-sm text-[#5C5C54] italic max-w-md mx-auto leading-relaxed mb-10 font-serif',
        btnClass: 'inline-flex items-center gap-2 px-8 py-4 bg-[#1A1A18] text-[#FAF8F4] text-xs font-semibold uppercase tracking-[0.25em] hover:bg-neutral-800 transition-colors rounded-none',
        sectionHeaderClass: 'flex items-baseline justify-between border-b border-[#1A1A18]/10 py-4 mb-12',
        cardClass: 'aspect-[3/4] bg-[#F3EFE9] border border-[#1A1A18]/5 overflow-hidden relative rounded-none',
        inkColor: 'text-[#1A1A18] font-medium',
        secondaryColor: 'text-[#5C5C54] italic',
        footerClass: 'border-t border-[#1A1A18]/10 py-16 px-6 text-center bg-[#FAF8F4] text-[#1A1A18]',
        accentStyle: {
          '--color-mark-base': '#FAF8F4',
          '--color-mark-surface': '#FFFFFF',
          '--color-mark-subtle': '#F3EFE9',
          '--color-mark-muted': '#EBE6DC',
          '--color-mark-ink': '#1A1A18',
          '--color-mark-secondary': '#5C5C54',
          '--color-mark-default': 'rgba(26,26,24,0.08)',
        }
      }
    case 'warm':
      return {
        baseClass: 'theme-marketing font-sans min-h-screen relative bg-gradient-to-b from-[#FFF8F0] to-[#FEF9F5] text-[#2C1E15]',
        headerClass: 'border-b border-[#2C1E15]/5 py-5 px-6 md:px-12 flex items-center justify-between bg-[#FFF8F0]/80 backdrop-blur-md sticky top-0 z-20',
        heroClass: 'py-24 px-6 text-center max-w-4xl mx-auto',
        titleFont: 'font-serif text-[#2C1E15] font-bold text-4xl sm:text-6xl tracking-tight mb-6',
        subtitleClass: 'text-sm text-[#5C4D42] max-w-lg mx-auto leading-relaxed mb-10 font-medium',
        btnClass: 'inline-flex items-center gap-2 px-8 py-4 bg-[#E06D53] text-white text-xs font-bold uppercase tracking-widest hover:bg-[#C95C43] transition-colors rounded-2xl shadow-sm',
        sectionHeaderClass: 'flex items-baseline justify-between border-b border-[#2C1E15]/5 py-4 mb-12',
        cardClass: 'aspect-square bg-white border border-[#2C1E15]/5 overflow-hidden relative rounded-2xl shadow-sm',
        inkColor: 'text-[#2C1E15] font-bold',
        secondaryColor: 'text-[#5C4D42]',
        footerClass: 'border-t border-[#2C1E15]/5 py-12 px-6 text-center bg-[#FFF8F0] text-[#2C1E15]',
        accentStyle: {
          '--color-mark-base': '#FFF8F0',
          '--color-mark-surface': '#FFFFFF',
          '--color-mark-subtle': '#FDF5EC',
          '--color-mark-muted': '#F5E6D3',
          '--color-mark-ink': '#2C1E15',
          '--color-mark-secondary': '#5C4D42',
          '--color-mark-default': 'rgba(44,30,21,0.05)',
        }
      }
    case 'vibrant':
      return {
        baseClass: 'theme-marketing font-sans min-h-screen relative bg-[#0D0D0D] text-white',
        headerClass: 'border-b border-purple-500/20 py-5 px-6 md:px-12 flex items-center justify-between bg-[#0D0D0D]/85 backdrop-blur-md sticky top-0 z-20',
        heroClass: 'py-28 px-6 text-center max-w-4xl mx-auto',
        titleFont: 'font-black tracking-tight text-5xl sm:text-7xl bg-gradient-to-r from-purple-400 via-pink-500 to-red-500 bg-clip-text text-transparent mb-6',
        subtitleClass: 'text-sm text-neutral-400 max-w-lg mx-auto leading-relaxed mb-10',
        btnClass: 'inline-flex items-center gap-2 px-8 py-4 bg-gradient-to-r from-purple-600 to-pink-600 text-white text-xs font-bold uppercase tracking-widest hover:from-purple-500 hover:to-pink-500 transition-all shadow-[0_0_20px_rgba(168,85,247,0.4)] rounded-lg',
        sectionHeaderClass: 'flex items-baseline justify-between border-b border-neutral-800 py-4 mb-12',
        cardClass: 'aspect-[4/5] bg-neutral-900 border border-neutral-800 overflow-hidden relative rounded-xl hover:border-purple-500/50 transition-all',
        inkColor: 'text-white font-bold',
        secondaryColor: 'text-neutral-400',
        footerClass: 'border-t border-neutral-900 py-12 px-6 text-center bg-[#0D0D0D] text-white',
        accentStyle: {
          '--color-mark-base': '#0D0D0D',
          '--color-mark-surface': '#161616',
          '--color-mark-subtle': '#1A1A1A',
          '--color-mark-muted': '#262626',
          '--color-mark-ink': '#FFFFFF',
          '--color-mark-secondary': '#A3A3A3',
          '--color-mark-default': 'rgba(255,255,255,0.08)',
        }
      }
    default:
      return getTemplateConfig('minimal', themeColor)
  }
}
