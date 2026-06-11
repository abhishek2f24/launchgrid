import { Puzzle, Info, ExternalLink, ShieldCheck, Zap, Download } from 'lucide-react'
import { getActiveTenant } from '@/utils/supabase/queries'

export default async function ExtensionGuidePage() {
  const result = await getActiveTenant()
  if (!result) return <div className="p-8">No store found.</div>
  
  const { tenant } = result

  return (
    <div className="p-8 max-w-4xl mx-auto space-y-10 font-inter">
      {/* Header */}
      <div>
        <h1 className="text-3xl font-playfair font-bold text-[var(--color-mark-ink)] mb-2 flex items-center gap-3">
          <Puzzle className="w-8 h-8 text-purple-600" />
          Chrome Extension.
        </h1>
        <p className="text-sm text-[var(--color-mark-secondary)]">
          Install the dropship import helper tool to source products instantly in one click.
        </p>
      </div>

      {/* Main explanation card */}
      <div className="bg-gradient-to-r from-purple-50 to-indigo-50 border border-purple-100 rounded-[2rem] p-8 shadow-sm flex flex-col md:flex-row gap-6 items-start justify-between relative overflow-hidden">
        <div className="space-y-4 max-w-xl">
          <span className="text-[10px] font-extrabold uppercase tracking-widest bg-purple-100 border border-purple-200 text-purple-700 px-3 py-1 rounded-lg">1-Click Sourcing</span>
          <h2 className="font-playfair text-2xl font-bold text-purple-950">Source products while browsing any supplier site</h2>
          <p className="text-xs text-purple-800/80 font-medium leading-relaxed">
            The LaunchGrid extension integrates seamlessly with Amazon, Flipkart, Meesho, Myntra, Nykaa, and Ajio. 
            When browsing any product page, click "Add to Store" to automatically extract images, title, description, and cost price, optimize descriptions using Gemini, and instantly list it live on your store.
          </p>
        </div>
        <div className="w-12 h-12 rounded-2xl bg-purple-600 flex items-center justify-center shrink-0 shadow-md text-white mt-2">
          <Puzzle className="w-6 h-6 animate-pulse" />
        </div>
      </div>

      {/* Developer installation steps */}
      <div className="bg-white border border-black/5 rounded-[2rem] p-8 shadow-sm space-y-6">
        <div className="border-b border-black/5 pb-4">
          <h3 className="font-playfair text-xl font-bold text-[var(--color-mark-ink)]">Developer Installation Guide</h3>
          <p className="text-xs text-[var(--color-mark-secondary)] mt-1">
            Since the extension is currently in developer-mode testing, install it locally using these simple steps:
          </p>
        </div>

        <div className="space-y-6">
          {[
            {
              step: '1',
              title: 'Locate Extension Directory',
              desc: 'The Chrome Extension source code is located in the `launchgrid-extension` folder inside your project directory.',
              icon: <Info className="w-4 h-4 text-blue-500" />
            },
            {
              step: '2',
              title: 'Open Chrome Extension Manager',
              desc: 'In your Google Chrome browser, open a new tab and navigate to `chrome://extensions/` (or click Menu → Extensions → Manage Extensions).',
              icon: <ExternalLink className="w-4 h-4 text-purple-500" />
            },
            {
              step: '3',
              title: 'Enable Developer Mode',
              desc: 'In the top-right corner of the Extensions page, toggle the "Developer mode" switch to ON.',
              icon: <Zap className="w-4 h-4 text-amber-500" />
            },
            {
              step: '4',
              title: 'Load Unpacked Extension',
              desc: 'Click the "Load unpacked" button in the top-left corner, and select the `launchgrid-extension` folder from your local directory.',
              icon: <Download className="w-4 h-4 text-emerald-500" />
            },
            {
              step: '5',
              title: 'Connect Your Store',
              desc: `Click the LaunchGrid puzzle icon in your Chrome toolbar, click "Connect Store", and authenticate your store subdomain: "${tenant.subdomain}".`,
              icon: <ShieldCheck className="w-4 h-4 text-green-600" />
            }
          ].map((item, idx) => (
            <div key={idx} className="flex gap-4 items-start">
              <div className="w-8 h-8 rounded-full bg-black/5 flex items-center justify-center shrink-0 font-playfair font-black text-sm text-[var(--color-mark-ink)]">
                {item.step}
              </div>
              <div className="space-y-1">
                <h4 className="font-bold text-sm text-[var(--color-mark-ink)] flex items-center gap-2">
                  {item.title}
                  {item.icon}
                </h4>
                <p className="text-xs text-[var(--color-mark-secondary)] leading-relaxed max-w-xl">{item.desc}</p>
              </div>
            </div>
          ))}
        </div>
      </div>

      {/* Direct Auth Quick link */}
      <div className="p-6 bg-black/[0.02] border border-black/5 rounded-[1.5rem] flex flex-col sm:flex-row items-center justify-between gap-4">
        <div>
          <h4 className="font-bold text-sm text-[var(--color-mark-ink)]">Need to authenticate?</h4>
          <p className="text-xs text-[var(--color-mark-secondary)] mt-0.5">
            If the extension asks you to login, click below to link your Supabase session.
          </p>
        </div>
        <a
          href={`/dashboard/extension-auth?ext_id=YOUR_EXTENSION_ID_HERE`}
          target="_blank"
          className="px-6 py-2.5 rounded-xl bg-[var(--color-mark-ink)] text-white hover:bg-black/90 font-bold text-xs shadow-md transition-transform hover:scale-105 shrink-0"
        >
          Open Connection Auth Page →
        </a>
      </div>
    </div>
  )
}
