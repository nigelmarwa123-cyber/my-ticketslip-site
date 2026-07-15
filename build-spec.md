# Step 1: Supabase Schema and Auth Setup

This plan covers Step 1 of the build prompt: setting up the database schema, Supabase client utilities for Next.js App Router, and the authentication flow (signup/login).

## User Review Required

Please review the proposed SQL schema (which I will provide in a separate file or within the execution step). You will need to execute this SQL snippet in your Supabase SQL Editor to create the tables. Also, ensure you have enabled **Email authentication** in your Supabase project settings. 

## Open Questions
- Do you want to enforce Row Level Security (RLS) immediately in this step, or leave the tables open for authenticated users for the MVP phase? (I will plan to add basic RLS for security, e.g. users can only insert their own profiles, tickets, etc.).

## Proposed Changes

### Supabase Schema
I will create a SQL schema file `supabase/schema.sql` containing:
- Enum types for `ticket_status` and `reaction_type`.
- Tables: `profiles`, `tickets`, `follows`, `reactions`, `flags`, `comments`.
- We'll include basic RLS policies.

### Project Dependencies

- **[NEW]** Install `@supabase/supabase-js` and `@supabase/ssr`.
- **[NEW]** Install `lucide-react` for simple UI icons in the forms.

### Next.js Supabase Utilities

#### [NEW] `src/utils/supabase/client.ts`
Client-side Supabase client initialization.

#### [NEW] `src/utils/supabase/server.ts`
Server-side Supabase client initialization for server components, server actions, and route handlers.

#### [NEW] `src/utils/supabase/middleware.ts`
Middleware utility to refresh auth tokens and protect routes.

#### [NEW] `src/middleware.ts`
Next.js middleware to enforce authentication on protected routes (redirecting to `/login` if not authenticated).

### Authentication Routes and Pages

#### [NEW] `src/app/login/page.tsx` & `src/app/login/actions.ts`
Login page with Email and Password form using Server Actions for authentication.

#### [NEW] `src/app/signup/page.tsx` & `src/app/signup/actions.ts`
Signup page with Email, Password, and Username form. It will create the auth user and insert a row into the `profiles` table with a random `avatar_color`.

#### [NEW] `src/app/auth/callback/route.ts`
Auth callback route handler to exchange auth code for a session (standard Supabase SSR flow).

## Verification Plan

1. You will run the schema SQL in your Supabase project.
2. I will implement the Next.js dependencies, utilities, and auth routes.
3. We will verify that a user can sign up, their profile gets created with a username and color, and they can log in successfully.
