'use client'

import { MessageCircle } from 'lucide-react'

export function WhatsAppWidget({ number }: { number?: string }) {
  if (!number) return null

  // Ensure number format is ready for wa.me
  const formattedNumber = number.replace(/[^0-9]/g, '')

  return (
    <a
      href={`https://wa.me/${formattedNumber}`}
      target="_blank"
      rel="noopener noreferrer"
      className="fixed bottom-6 right-6 z-50 bg-[#25D366] text-white p-4 rounded-full shadow-lg hover:shadow-xl hover:scale-110 transition-all duration-300 flex items-center justify-center cursor-pointer"
      aria-label="Chat on WhatsApp"
    >
      <MessageCircle className="w-8 h-8" />
    </a>
  )
}
