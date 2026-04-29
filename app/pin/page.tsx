export default function PinPage() {
  return (
    <main className="min-h-screen flex items-center justify-center bg-background px-4 py-12">
      <div className="w-full max-w-md bg-card border border-border rounded-2xl p-8 shadow-sm flex flex-col gap-5">
        <h1 className="text-xl font-semibold text-foreground text-balance">
          Thank you for submitting your review!
        </h1>

        <div className="flex flex-col gap-1">
          <p className="text-sm text-muted-foreground">Your 100% free coupon code is:</p>
          <div className="bg-muted rounded-lg px-4 py-3 font-mono text-base font-bold tracking-widest text-foreground select-all text-center">
            znvhsDlqslek123
          </div>
        </div>

        <div className="flex flex-col gap-3 text-sm text-foreground/80 leading-relaxed">
          <p>
            You can apply this code at the bottom of the checkout page where it says{' '}
            <span className="font-medium text-foreground">&quot;Have a coupon code?&quot;</span>
          </p>
          <p>
            Please note: This code is limited to one use per person. Please make sure to enter
            your correct birth information when using it :)
          </p>
        </div>

        <a
          href="mailto:support@sajume.com"
          className="mt-1 w-full text-center py-3 px-4 rounded-xl border border-border text-sm text-muted-foreground hover:bg-muted hover:text-foreground transition-colors"
        >
          Having an issue? Click here.
        </a>
      </div>
    </main>
  )
}
