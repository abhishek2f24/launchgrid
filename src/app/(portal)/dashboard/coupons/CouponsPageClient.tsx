'use client'

import { useState, useTransition } from 'react'
import { Plus, Trash2, ToggleLeft, ToggleRight, Loader2, CheckCircle2, AlertCircle, Tag } from 'lucide-react'
import { createCouponAction, deleteCouponAction, toggleCouponStatusAction } from '@/actions/portal'

interface Coupon {
  id: string
  code: string
  discount_type: 'percentage' | 'fixed' | 'free_shipping'
  value: number
  min_order_value: number
  is_active: boolean
  created_at: string
}

interface Props {
  initialCoupons: any[]
  tenantId: string
}

export function CouponsPageClient({ initialCoupons, tenantId }: Props) {
  const [coupons, setCoupons] = useState<Coupon[]>(initialCoupons)
  const [showAddForm, setShowAddForm] = useState(false)
  const [isPending, startTransition] = useTransition()

  // Form states
  const [code, setCode] = useState('')
  const [discountType, setDiscountType] = useState<'percentage' | 'fixed' | 'free_shipping'>('percentage')
  const [value, setValue] = useState(10)
  const [minOrderValue, setMinOrderValue] = useState(0)
  const [error, setError] = useState('')
  const [success, setSuccess] = useState('')

  const handleToggleStatus = async (id: string, currentStatus: boolean) => {
    startTransition(async () => {
      const res = await toggleCouponStatusAction(id, currentStatus)
      if (res.success) {
        setCoupons(prev =>
          prev.map(c => (c.id === id ? { ...c, is_active: !currentStatus } : c))
        )
      }
    })
  }

  const handleDelete = async (id: string) => {
    if (!confirm('Are you sure you want to delete this coupon code?')) return
    startTransition(async () => {
      const res = await deleteCouponAction(id)
      if (res.success) {
        setCoupons(prev => prev.filter(c => c.id !== id))
      }
    })
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setError('')
    setSuccess('')

    if (!code.trim()) {
      setError('Coupon code is required')
      return
    }

    startTransition(async () => {
      const res = await createCouponAction(code, discountType, value, minOrderValue)
      if (res.error) {
        setError(res.error)
      } else {
        setSuccess('Coupon code created successfully!')
        setCode('')
        setValue(10)
        setMinOrderValue(0)
        setDiscountType('percentage')
        setShowAddForm(false)
        // Refresh local list (since we don't return the coupon directly, we can reload or guess, or simple window location reload to fetch server-side state cleanly)
        window.location.reload()
      }
    })
  }

  return (
    <div className="p-8 max-w-7xl mx-auto space-y-8 font-inter">
      {/* Title */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="font-playfair text-4xl font-bold text-[var(--color-mark-ink)] mb-2">Discount Coupons</h1>
          <p className="text-sm text-[var(--color-mark-secondary)]">Create and manage discounts for your customers.</p>
        </div>
        <button
          onClick={() => setShowAddForm(!showAddForm)}
          className="flex items-center gap-2 px-6 py-2.5 rounded-xl bg-[var(--color-mark-ink)] text-white hover:bg-black/90 transition-all shadow-md font-bold text-sm"
        >
          <Plus className="w-4 h-4" /> Create Coupon
        </button>
      </div>

      {/* Success/Error Alerts */}
      {success && (
        <div className="p-4 bg-green-50 border border-green-200 text-green-800 text-sm font-medium rounded-xl flex items-center gap-2">
          <CheckCircle2 className="w-5 h-5 text-green-600" /> {success}
        </div>
      )}
      {error && (
        <div className="p-4 bg-red-50 border border-red-200 text-red-800 text-sm font-medium rounded-xl flex items-center gap-2">
          <AlertCircle className="w-5 h-5 text-red-600" /> {error}
        </div>
      )}

      {/* Add Coupon Section */}
      {showAddForm && (
        <div className="bg-white border border-black/5 rounded-[2rem] p-6 sm:p-8 shadow-sm">
          <h3 className="font-playfair text-xl font-bold text-[var(--color-mark-ink)] mb-6">New Discount Coupon</h3>
          <form onSubmit={handleSubmit} className="grid grid-cols-1 md:grid-cols-4 gap-6 items-end">
            <div>
              <label className="block text-[10px] font-bold uppercase tracking-widest text-[var(--color-mark-secondary)] mb-2">Coupon Code</label>
              <input
                type="text"
                placeholder="e.g. FLAT10"
                value={code}
                onChange={e => setCode(e.target.value.toUpperCase())}
                className="w-full px-4 py-3 bg-[var(--color-mark-base)] border border-black/5 rounded-xl text-sm focus:outline-none focus:border-[var(--color-mark-ink)]"
              />
            </div>
            <div>
              <label className="block text-[10px] font-bold uppercase tracking-widest text-[var(--color-mark-secondary)] mb-2">Discount Type</label>
              <select
                value={discountType}
                onChange={e => {
                  const val = e.target.value as any
                  setDiscountType(val)
                  if (val === 'free_shipping') setValue(0)
                }}
                className="w-full px-4 py-3 bg-[var(--color-mark-base)] border border-black/5 rounded-xl text-sm focus:outline-none focus:border-[var(--color-mark-ink)]"
              >
                <option value="percentage">Percentage (%)</option>
                <option value="fixed">Fixed Amount (₹)</option>
                <option value="free_shipping">Free Shipping</option>
              </select>
            </div>
            <div>
              <label className="block text-[10px] font-bold uppercase tracking-widest text-[var(--color-mark-secondary)] mb-2">
                Value {discountType === 'percentage' ? '(%)' : discountType === 'fixed' ? '(₹)' : ''}
              </label>
              <input
                type="number"
                disabled={discountType === 'free_shipping'}
                value={value}
                onChange={e => setValue(Number(e.target.value))}
                className="w-full px-4 py-3 bg-[var(--color-mark-base)] border border-black/5 rounded-xl text-sm focus:outline-none focus:border-[var(--color-mark-ink)] disabled:opacity-50"
              />
            </div>
            <div>
              <label className="block text-[10px] font-bold uppercase tracking-widest text-[var(--color-mark-secondary)] mb-2">Min Order Value (₹)</label>
              <input
                type="number"
                value={minOrderValue}
                onChange={e => setMinOrderValue(Number(e.target.value))}
                className="w-full px-4 py-3 bg-[var(--color-mark-base)] border border-black/5 rounded-xl text-sm focus:outline-none focus:border-[var(--color-mark-ink)]"
              />
            </div>
            <div className="md:col-span-4 flex justify-end gap-3 pt-2">
              <button
                type="button"
                onClick={() => setShowAddForm(false)}
                className="px-5 py-2.5 rounded-xl text-xs font-bold text-[var(--color-mark-secondary)] hover:bg-black/5 transition-all"
              >
                Cancel
              </button>
              <button
                type="submit"
                disabled={isPending}
                className="px-6 py-2.5 rounded-xl bg-[var(--color-mark-ink)] text-white hover:bg-black/90 transition-all font-bold text-xs flex items-center gap-2"
              >
                {isPending && <Loader2 className="w-3.5 h-3.5 animate-spin" />} Create Coupon
              </button>
            </div>
          </form>
        </div>
      )}

      {/* Coupons List */}
      {coupons.length === 0 ? (
        <div className="text-center py-16 bg-white border border-black/5 rounded-[2rem] p-8">
          <Tag className="w-12 h-12 text-[var(--color-mark-secondary)]/30 mx-auto mb-4" />
          <h3 className="font-playfair text-lg font-bold text-[var(--color-mark-ink)] mb-1">A launch coupon gets your first sale sooner</h3>
          <p className="text-sm text-[var(--color-mark-secondary)] max-w-sm mx-auto mb-6">
            A small first-order discount gives hesitant friends-of-friends a reason to buy today.
            We&apos;ve pre-filled <span className="font-bold text-[var(--color-mark-ink)]">FIRST10</span> — 10% off, ready to share on WhatsApp.
          </p>
          <button
            onClick={() => {
              setCode('FIRST10')
              setDiscountType('percentage')
              setValue(10)
              setShowAddForm(true)
            }}
            className="px-5 py-2.5 rounded-xl bg-[var(--color-mark-ink)] text-white hover:bg-black/90 transition-all font-bold text-xs"
          >
            Create FIRST10 →
          </button>
        </div>
      ) : (
        <div className="bg-white border border-black/5 rounded-[2rem] shadow-sm overflow-hidden">
          <table className="w-full text-left border-collapse">
            <thead>
              <tr className="border-b border-black/5 bg-black/[0.02]">
                <th className="p-4 text-xs font-bold text-[var(--color-mark-secondary)] uppercase tracking-widest pl-8">Coupon Code</th>
                <th className="p-4 text-xs font-bold text-[var(--color-mark-secondary)] uppercase tracking-widest">Discount Details</th>
                <th className="p-4 text-xs font-bold text-[var(--color-mark-secondary)] uppercase tracking-widest">Minimum Order</th>
                <th className="p-4 text-xs font-bold text-[var(--color-mark-secondary)] uppercase tracking-widest">Status</th>
                <th className="p-4 text-xs font-bold text-[var(--color-mark-secondary)] uppercase tracking-widest text-right pr-8">Actions</th>
              </tr>
            </thead>
            <tbody>
              {coupons.map(c => (
                <tr key={c.id} className="border-b border-black/5 last:border-0 hover:bg-black/[0.01] transition-colors">
                  <td className="p-4 pl-8 font-bold text-sm text-[var(--color-mark-ink)] uppercase tracking-wider">
                    {c.code}
                  </td>
                  <td className="p-4 text-sm text-[var(--color-mark-secondary)] font-medium">
                    {c.discount_type === 'percentage' && `${c.value}% Off`}
                    {c.discount_type === 'fixed' && `₹${c.value} Off`}
                    {c.discount_type === 'free_shipping' && 'Free Shipping'}
                  </td>
                  <td className="p-4 text-sm text-[var(--color-mark-secondary)] font-medium">
                    {c.min_order_value > 0 ? `₹${c.min_order_value}` : 'No minimum'}
                  </td>
                  <td className="p-4">
                    <span
                      className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-bold uppercase tracking-wider border ${
                        c.is_active
                          ? 'bg-green-50 text-green-700 border-green-200'
                          : 'bg-red-50 text-red-700 border-red-200'
                      }`}
                    >
                      {c.is_active ? 'Active' : 'Inactive'}
                    </span>
                  </td>
                  <td className="p-4 text-right pr-8">
                    <div className="flex items-center justify-end gap-3">
                      <button
                        onClick={() => handleToggleStatus(c.id, c.is_active)}
                        disabled={isPending}
                        className="text-[var(--color-mark-secondary)] hover:text-[var(--color-mark-ink)] transition-colors p-1"
                        title={c.is_active ? 'Deactivate' : 'Activate'}
                      >
                        {c.is_active ? <ToggleRight className="w-6 h-6 text-green-600" /> : <ToggleLeft className="w-6 h-6" />}
                      </button>
                      <button
                        onClick={() => handleDelete(c.id)}
                        disabled={isPending}
                        className="text-red-500 hover:text-red-700 transition-colors p-1"
                        title="Delete"
                      >
                        <Trash2 className="w-4.5 h-4.5" />
                      </button>
                    </div>
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
