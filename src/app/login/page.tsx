import Navigation from '@/components/Navigation';
import AuthButton from '@/components/auth/AuthButton';

// Force dynamic rendering to avoid build-time Supabase env var requirement
export const dynamic = 'force-dynamic';

export default function LoginPage() {
  return (
    <>
      <Navigation />
      <main className="pt-16 min-h-screen flex flex-col justify-center items-center px-8 py-24 bg-gradient-to-b from-white to-neutral-50 relative overflow-hidden">
        <div className="absolute top-0 right-0 w-[200%] h-[200%] bg-gradient-radial from-blue-500/3 to-transparent animate-pulse-slow" />
        <div className="relative z-10 max-w-md w-full px-4">
          <div className="bg-white border border-neutral-200 rounded-2xl p-8 shadow-lg">
            <h1 className="text-3xl md:text-4xl font-bold leading-tight tracking-tight text-neutral-900 mb-4 text-center">
              Sign in to save your Galaw Pinoy progress.
            </h1>
            <p className="text-base text-neutral-600 mb-8 text-center leading-relaxed">
              Track your scores, calories burned, and game history by signing in with your Google account.
            </p>
            <div className="flex justify-center">
              <AuthButton />
            </div>
          </div>
        </div>
      </main>
    </>
  );
}

