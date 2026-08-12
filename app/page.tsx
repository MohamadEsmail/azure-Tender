/**
 * Landing shell. Once the Auth module lands, this route redirects authenticated
 * users to /dashboard and everyone else to /sign-in. For now it renders the
 * app shell in RTL so the Arabic layout can be verified from day one.
 */
export default function HomePage() {
  return (
    <main className="container flex min-h-dvh flex-col items-center justify-center gap-6 text-center">
      <div className="space-y-3">
        <h1 className="text-3xl font-bold tracking-tight">
          منصة أزور الإبداعية للفعاليات
        </h1>
        <p className="max-w-xl text-muted-foreground">
          تحويل بريف العميل إلى ذكاء إبداعي، ثم مفهوم فعالية، ونظام تصميم بصري،
          وتصورات ثلاثية الأبعاد، وعرض تقديمي معتمد.
        </p>
      </div>
      <p className="text-sm text-muted-foreground" dir="ltr">
        Azure Media Group · Creative Event Design Platform
      </p>
    </main>
  );
}
