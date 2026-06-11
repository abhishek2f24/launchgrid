# Initialize LaunchGrid Architecture

Now that the brainstorming phase is complete and the brand name **LaunchGrid.in** is locked, it's time to set up the foundational codebase.

## Proposed Changes

We will initialize a Next.js 15 application designed for a multi-tenant architecture. 

### 1. Next.js App Initialization
- Run `npx create-next-app@latest ./launchgrid`
- **Config:** TypeScript, Tailwind CSS, ESLint, App Router.

### 2. UI & Design System Setup
- Install **shadcn/ui** and **Radix UI** for accessible, premium primitives.
- Install **Framer Motion** for lightweight, premium SaaS page transitions.
- Configure `tailwind.config.ts` and `globals.css` with the deep dark mode colors and typography specified in our Design System.
- Set up Lucide React for consistent icons.

### 3. Multi-Tenant Middleware Routing
- Implement `middleware.ts` to rewrite wildcard subdomains (e.g. `customer.launchgrid.in`) to the dynamic Next.js route `/store/[subdomain]`.
- Ensure main domain `launchgrid.in` and `www.launchgrid.in` route to the marketing/dashboard pages.

### 4. Supabase Setup
- Initialize the Supabase client.
- Add base database types from the TRD schema.

### 5. Folder Structure
- Scaffold the `app/(marketing)`, `app/(portal)`, and `app/store/[slug]` directories to match the TRD.

## User Review Required

> [!IMPORTANT]  
> Are we ready to execute this initialization? Let me know if you want to proceed with setting up the Next.js repository!
