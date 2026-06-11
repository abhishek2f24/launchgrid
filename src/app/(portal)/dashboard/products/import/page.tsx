import { redirect } from 'next/navigation'

// Import is now a tab inside /dashboard/products
export default function ImportRedirect() {
  redirect('/dashboard/products')
}
