'use client'

import { useState } from 'react'
import { Search, Filter, ShoppingBag, X } from 'lucide-react'
import Link from 'next/link'

interface Order {
  id: string
  created_at: string
  customer_name: string
  customer_email: string | null
  customer_phone: string | null
  total_amount: number
  payment_status: 'paid' | 'pending'
  fulfillment_status: 'unfulfilled' | 'shipped' | 'processing'
}

interface Props {
  initialOrders: Order[]
}

export function OrdersListClient({ initialOrders }: Props) {
  const [searchQuery, setSearchQuery] = useState('')
  const [paymentFilter, setPaymentFilter] = useState<'all' | 'paid' | 'pending'>('all')
  const [fulfillmentFilter, setFulfillmentFilter] = useState<'all' | 'unfulfilled' | 'shipped' | 'processing'>('all')
  const [showFilters, setShowFilters] = useState(false)

  // Filter orders based on search query and status filters
  const filteredOrders = initialOrders.filter(o => {
    const query = searchQuery.toLowerCase().trim()
    const matchesQuery = !query || 
      o.customer_name.toLowerCase().includes(query) ||
      (o.customer_email && o.customer_email.toLowerCase().includes(query)) ||
      (o.customer_phone && o.customer_phone.includes(query)) ||
      o.id.toLowerCase().includes(query) ||
      `#${o.id.split('-')[0]}`.toLowerCase().includes(query)

    const matchesPayment = paymentFilter === 'all' || o.payment_status === paymentFilter
    const matchesFulfillment = fulfillmentFilter === 'all' || o.fulfillment_status === fulfillmentFilter

    return matchesQuery && matchesPayment && matchesFulfillment
  })

  const clearFilters = () => {
    setSearchQuery('')
    setPaymentFilter('all')
    setFulfillmentFilter('all')
  }

  const hasActiveFilters = searchQuery !== '' || paymentFilter !== 'all' || fulfillmentFilter !== 'all'

  return (
    <div className="space-y-4">
      {/* Search and Filters Header */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div className="flex items-center gap-3 w-full md:w-auto flex-1 max-w-md">
          <div className="relative flex-1">
            <Search className="w-4 h-4 absolute left-3 top-1/2 -translate-y-1/2 text-black/40" />
            <input 
              type="text" 
              placeholder="Search by name, email, phone or Order ID..." 
              value={searchQuery}
              onChange={e => setSearchQuery(e.target.value)}
              className="w-full pl-9 pr-4 py-2 bg-white border border-black/10 rounded-xl text-sm focus:outline-none focus:ring-1 focus:ring-[var(--color-mark-ink)] shadow-sm font-inter"
            />
            {searchQuery && (
              <button 
                onClick={() => setSearchQuery('')}
                className="absolute right-3 top-1/2 -translate-y-1/2 p-0.5 rounded-full hover:bg-black/5 text-black/40"
              >
                <X className="w-3.5 h-3.5" />
              </button>
            )}
          </div>
          <button 
            onClick={() => setShowFilters(!showFilters)}
            className={`p-2 border rounded-xl shadow-sm hover:bg-black/5 transition-colors flex items-center gap-2 text-xs font-bold font-inter ${
              showFilters || paymentFilter !== 'all' || fulfillmentFilter !== 'all'
                ? 'border-[var(--color-mark-ink)] bg-black/5 text-[var(--color-mark-ink)]'
                : 'border-black/10 bg-white text-[var(--color-mark-ink)]'
            }`}
          >
            <Filter className="w-4 h-4" />
            <span>Filters</span>
          </button>
        </div>

        {hasActiveFilters && (
          <button 
            onClick={clearFilters}
            className="text-xs font-bold text-red-600 hover:text-red-700 transition-colors font-inter text-left md:text-right"
          >
            Clear Active Filters
          </button>
        )}
      </div>

      {/* Expandable Filter Panel */}
      {showFilters && (
        <div className="bg-black/[0.02] border border-black/5 rounded-[1.25rem] p-4 flex flex-wrap gap-6 text-sm font-inter">
          <div className="space-y-2">
            <span className="block text-xs font-bold text-[var(--color-mark-secondary)] uppercase tracking-wider">Payment Status</span>
            <div className="flex items-center gap-2">
              {(['all', 'paid', 'pending'] as const).map((status) => (
                <button
                  key={status}
                  onClick={() => setPaymentFilter(status)}
                  className={`px-3 py-1.5 rounded-lg text-xs font-bold border transition-all capitalize ${
                    paymentFilter === status
                      ? 'bg-[var(--color-mark-ink)] text-white border-transparent'
                      : 'bg-white text-[var(--color-mark-secondary)] border-black/10 hover:bg-black/5'
                  }`}
                >
                  {status}
                </button>
              ))}
            </div>
          </div>

          <div className="space-y-2">
            <span className="block text-xs font-bold text-[var(--color-mark-secondary)] uppercase tracking-wider">Fulfillment Status</span>
            <div className="flex items-center gap-2">
              {(['all', 'unfulfilled', 'processing', 'shipped'] as const).map((status) => (
                <button
                  key={status}
                  onClick={() => setFulfillmentFilter(status)}
                  className={`px-3 py-1.5 rounded-lg text-xs font-bold border transition-all capitalize ${
                    fulfillmentFilter === status
                      ? 'bg-[var(--color-mark-ink)] text-white border-transparent'
                      : 'bg-white text-[var(--color-mark-secondary)] border-black/10 hover:bg-black/5'
                  }`}
                >
                  {status}
                </button>
              ))}
            </div>
          </div>
        </div>
      )}

      {/* Orders Table or Empty Filter State */}
      {filteredOrders.length === 0 ? (
        <div className="bg-white border border-black/5 rounded-[1.5rem] p-12 text-center shadow-sm font-inter">
          <div className="w-12 h-12 rounded-full bg-black/5 flex items-center justify-center mx-auto mb-4">
            <ShoppingBag className="w-5 h-5 text-black/40" />
          </div>
          <h3 className="font-bold text-base text-[var(--color-mark-ink)] mb-1">No matching orders</h3>
          <p className="text-xs text-[var(--color-mark-secondary)] max-w-sm mx-auto leading-relaxed">
            Try adjusting your search query or filters to find what you are looking for.
          </p>
          {hasActiveFilters && (
            <button 
              onClick={clearFilters}
              className="mt-4 px-4 py-2 bg-black text-white text-xs font-bold rounded-xl hover:bg-black/90 active:scale-95 transition-all shadow-md"
            >
              Reset Search & Filters
            </button>
          )}
        </div>
      ) : (
        <div className="bg-white border border-black/5 rounded-[1.5rem] shadow-sm overflow-hidden">
          <table className="w-full text-left border-collapse">
            <thead>
              <tr className="border-b border-black/5 bg-black/[0.02]">
                <th className="p-4 text-xs font-bold text-[var(--color-mark-secondary)] uppercase tracking-widest font-inter">Order ID</th>
                <th className="p-4 text-xs font-bold text-[var(--color-mark-secondary)] uppercase tracking-widest font-inter">Customer</th>
                <th className="p-4 text-xs font-bold text-[var(--color-mark-secondary)] uppercase tracking-widest font-inter font-mono">Total</th>
                <th className="p-4 text-xs font-bold text-[var(--color-mark-secondary)] uppercase tracking-widest font-inter">Payment</th>
                <th className="p-4 text-xs font-bold text-[var(--color-mark-secondary)] uppercase tracking-widest text-right font-inter">Fulfillment</th>
              </tr>
            </thead>
            <tbody>
              {filteredOrders.map((o) => (
                <tr key={o.id} className="border-b border-black/5 last:border-0 hover:bg-black/[0.01] transition-colors">
                  <td className="p-4">
                    <Link href={`/dashboard/orders/${o.id}`} className="inline-block hover:underline">
                      <span className="font-mono text-xs font-bold text-[var(--color-mark-ink)]">
                        #{o.id.split('-')[0].toUpperCase()}
                      </span>
                    </Link>
                    <div className="text-[10px] text-[var(--color-mark-secondary)] mt-0.5 font-inter">
                      {new Date(o.created_at).toLocaleDateString()}
                    </div>
                  </td>
                  <td className="p-4">
                    <Link href={`/dashboard/orders/${o.id}`} className="block group">
                      <div className="text-sm font-bold text-[var(--color-mark-ink)] group-hover:text-blue-600 transition-colors font-inter">{o.customer_name}</div>
                      <div className="text-xs text-[var(--color-mark-secondary)] font-inter">{o.customer_email || o.customer_phone}</div>
                    </Link>
                  </td>
                  <td className="p-4 text-sm font-bold text-[var(--color-mark-ink)] font-inter">
                    ₹{o.total_amount}
                  </td>
                  <td className="p-4 font-inter">
                    {o.payment_status === 'paid' ? (
                      <span className="px-2.5 py-1 bg-green-50 text-green-700 border border-green-200 rounded-lg text-[10px] font-bold uppercase tracking-widest">Paid</span>
                    ) : (
                      <span className="px-2.5 py-1 bg-amber-50 text-amber-700 border border-amber-200 rounded-lg text-[10px] font-bold uppercase tracking-widest">Pending</span>
                    )}
                  </td>
                  <td className="p-4 text-right font-inter">
                    <Link href={`/dashboard/orders/${o.id}`}>
                      {o.fulfillment_status === 'shipped' ? (
                        <span className="px-2.5 py-1 bg-green-50 text-green-700 border border-green-200 rounded-lg text-[10px] font-bold uppercase tracking-widest font-inter">Shipped</span>
                      ) : o.fulfillment_status === 'unfulfilled' ? (
                        <span className="px-2.5 py-1 bg-red-50 text-red-700 border border-red-200 rounded-lg text-[10px] font-bold uppercase tracking-widest font-inter hover:bg-red-100 cursor-pointer">Unfulfilled</span>
                      ) : (
                        <span className="px-2.5 py-1 bg-blue-50 text-blue-700 border border-blue-200 rounded-lg text-[10px] font-bold uppercase tracking-widest font-inter">Processing</span>
                      )}
                    </Link>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}
    </div>
  )
}
