import Link from "next/link";
import { Image } from "@/components/ui/image";
import { ArrowUpRight } from "lucide-react";

export interface CategoryCardData {
  id: string;
  name: string;
  slug: string;
  image: string | null;
  itemCount?: number;
}

interface CategoryGridProps {
  categories: CategoryCardData[];
}

export function CategoryGrid({ categories }: CategoryGridProps) {
  return (
    <div className="grid grid-cols-2 sm:grid-cols-2 md:grid-cols-4 gap-4 sm:gap-6">
      {categories.map((cat) => (
        <Link
          key={cat.id}
          href={`/category/${cat.slug}`}
          className="group relative rounded-2xl border border-border bg-card p-4 hover:border-primary/50 shadow-2xs hover:shadow-md transition-all flex flex-col items-center text-center overflow-hidden"
        >
          {/* Circular image badge */}
          <div className="w-20 h-20 sm:w-24 sm:h-24 rounded-2xl overflow-hidden bg-muted/50 mb-3 relative flex items-center justify-center border border-border/80 group-hover:scale-105 transition-transform duration-300">
            {cat.image ? (
              <Image
                src={cat.image}
                alt={cat.name}
                fill
                sizes="96px"
                className="object-cover"
              />
            ) : (
              <span className="text-2xl">🏺</span>
            )}
          </div>

          <h3 className="font-heading font-bold text-sm sm:text-base text-foreground group-hover:text-primary transition-colors line-clamp-1">
            {cat.name}
          </h3>

          <div className="mt-1 flex items-center gap-1 text-[11px] font-semibold text-muted-foreground group-hover:text-primary group-hover:underline underline-offset-2 transition-colors">
            <span>Explore crafts</span>
            <ArrowUpRight className="w-3.5 h-3.5 transition-transform group-hover:translate-x-0.5 group-hover:-translate-y-0.5" />
          </div>
        </Link>
      ))}
    </div>
  );
}
