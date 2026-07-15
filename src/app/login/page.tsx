import { login } from './actions'
import Link from 'next/link'

export default async function LoginPage(
  props: {
    searchParams: Promise<{ error?: string }>
  }
) {
  const searchParams = await props.searchParams;
  return (
    <div className="flex flex-col items-center justify-center min-h-screen bg-[#14161C] text-[#EDEDEF]">
      <div className="w-full max-w-sm p-8 bg-[#1B1E27] rounded-xl shadow-lg border border-[#2A2D38]">
        <h1 className="text-2xl font-bold mb-6 text-center font-['Archivo_Expanded',_sans-serif]">
          Log In to <span className="text-[#3DDC84]">TICKETSLIP</span>
        </h1>
        
        {searchParams?.error && (
          <div className="mb-4 p-3 bg-[#C97C7C]/20 text-[#C97C7C] border border-[#C97C7C]/30 rounded text-sm text-center">
            {searchParams.error}
          </div>
        )}

        <form className="flex flex-col gap-4">
          <div className="flex flex-col gap-2">
            <label htmlFor="email" className="text-sm font-medium text-[#9A9DA8]">Email</label>
            <input
              id="email"
              name="email"
              type="email"
              required
              className="p-3 bg-[#14161C] border border-[#2A2D38] rounded focus:outline-none focus:border-[#3DDC84] text-[#EDEDEF]"
              placeholder="you@example.com"
            />
          </div>
          <div className="flex flex-col gap-2">
            <label htmlFor="password" className="text-sm font-medium text-[#9A9DA8]">Password</label>
            <input
              id="password"
              name="password"
              type="password"
              required
              className="p-3 bg-[#14161C] border border-[#2A2D38] rounded focus:outline-none focus:border-[#3DDC84] text-[#EDEDEF]"
              placeholder="••••••••"
            />
          </div>
          <button
            formAction={login}
            className="mt-2 w-full p-3 bg-[#3DDC84] text-[#0C1410] font-bold rounded hover:bg-[#3DDC84]/90 transition-colors"
          >
            Log In
          </button>
        </form>
        
        <div className="mt-6 text-center text-sm text-[#9A9DA8]">
          Don't have an account? <Link href="/signup" className="text-[#3DDC84] hover:underline">Sign up</Link>
        </div>
      </div>
    </div>
  )
}
