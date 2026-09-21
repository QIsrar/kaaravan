import Link from 'next/link';
import { ArrowLeft } from 'lucide-react';

export default function AuthLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <div className="min-h-screen flex flex-col justify-center py-12 sm:px-6 lg:px-8 bg-gradient-to-br from-background via-warm-cream/30 to-background">
      <div className="sm:mx-auto sm:w-full sm:max-w-md px-4">
        <Link
          href="/"
          className="inline-flex items-center text-xs text-muted-foreground hover:text-foreground mb-6 transition-colors"
        >
          <ArrowLeft size={14} className="mr-1.5" />
          Back to Veiled Canvas
        </Link>
        <div className="text-center mb-6">
          <Link href="/">
            <span className="font-heading text-3xl font-bold tracking-tight text-foreground">
              Veiled <span className="text-primary">Canvas</span>
            </span>
          </Link>
          <p className="text-xs text-muted-foreground mt-1.5 uppercase tracking-widest">
            Where Modesty Meets Artistry
          </p>
        </div>
      </div>

      <div className="sm:mx-auto sm:w-full sm:max-w-md px-4">
        {children}
      </div>
    </div>
  );
}
