export default async function AuthErrorPage({
  searchParams,
}: {
  searchParams: Promise<{ error: string }>
}) {
  const params = await searchParams

  return (
    <div className="min-h-screen bg-background flex items-center justify-center p-6">
      <div className="w-full max-w-sm text-center">
        <div className="w-14 h-14 mx-auto mb-4 rounded-full bg-destructive/20 flex items-center justify-center">
          <svg className="w-7 h-7 text-destructive" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 9v2m0 4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
          </svg>
        </div>
        <h1 className="text-xl font-semibold text-foreground mb-2">Authentication Error</h1>
        <p className="text-sm text-muted-foreground mb-6">
          {params?.error ? `Error: ${params.error}` : 'Something went wrong during sign in. Please try again.'}
        </p>
        <a
          href="/auth/login"
          className="inline-block text-sm text-primary underline underline-offset-4"
        >
          Back to Login
        </a>
      </div>
    </div>
  )
}
