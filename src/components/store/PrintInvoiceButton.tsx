'use client'

import { Printer } from 'lucide-react'

export function PrintInvoiceButton() {
  return (
    <button
      onClick={() => window.print()}
      className="inline-flex items-center gap-2 px-4 py-2 bg-neutral-900 text-white text-xs font-bold rounded-xl hover:bg-neutral-800 transition-colors shadow-md cursor-pointer"
    >
      <Printer className="w-3.5 h-3.5" /> Print / Save PDF
    </button>
  )
}
