import { Skeleton } from '@/components/ui/skeleton';

export default function Loading() {
  return (
    <main className="page-shell">
      {/* Header skeleton */}
      <div className="border-b pb-4 mb-8">
        <div className="flex items-center gap-4 min-h-[3.25rem]">
          <div className="flex items-center gap-2.5 shrink-0">
            <Skeleton className="size-9 rounded-xl" />
            <Skeleton className="h-6 w-40" />
          </div>
          <Skeleton className="h-8 w-24 hidden md:block" />
          <Skeleton className="h-8 w-32 hidden md:block" />
          <div className="hidden md:flex items-center gap-2 pl-4 border-l">
            <Skeleton className="size-9 rounded-full" />
            <Skeleton className="h-8 w-8" />
          </div>
        </div>
      </div>

      {/* Search bar skeleton */}
      <div className="flex flex-col sm:flex-row gap-3 mb-6">
        <Skeleton className="h-10 flex-1" />
        <Skeleton className="h-10 w-full sm:w-[200px]" />
      </div>

      {/* Grid skeleton */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3 sm:gap-3.5">
        {[...Array(6)].map((_, i) => (
          <div key={i} className="rounded-xl border p-3.5 flex flex-col gap-2.5">
            <div className="flex gap-2.5">
              <Skeleton className="size-8 rounded-lg shrink-0" />
              <Skeleton className="h-5 w-20 rounded-md" />
            </div>
            <Skeleton className="h-9 w-full" />
            <div className="flex gap-1.5">
              <Skeleton className="h-5 w-14 rounded-full" />
              <Skeleton className="h-5 w-12 rounded-full" />
            </div>
          </div>
        ))}
      </div>
    </main>
  );
}