import { Card, Skeleton } from '@heroui/react';

export const PageSkeleton = () => {
  return (
    <main className="min-h-screen bg-background">
      <div className="mx-auto flex w-full max-w-7xl flex-col gap-6 px-3 py-5 sm:px-6 md:py-8">
        <div className="space-y-3">
          <Skeleton className="h-6 w-32 rounded-lg" />
          <Skeleton className="h-10 w-80 rounded-xl" />
          <Skeleton className="h-5 w-96 max-w-full rounded-lg" />
        </div>

        <Card className="p-6">
          <div className="space-y-4">
            <Skeleton className="h-5 w-40 rounded-lg" />

            <div className="flex gap-3">
              <Skeleton className="h-10 flex-1 rounded-xl" />
              <Skeleton className="h-10 w-32 rounded-xl" />
            </div>
          </div>
        </Card>

        <div className="grid gap-6 md:grid-cols-[minmax(0,2fr)_320px]">
          <Card className="p-6">
            <div className="space-y-4">
              <Skeleton className="h-6 w-40 rounded-lg" />

              {Array.from({ length: 5 }).map((_, index) => (
                <Skeleton key={index} className="h-16 w-full rounded-xl" />
              ))}
            </div>
          </Card>

          <div className="space-y-6">
            <Card className="p-6">
              <Skeleton className="mb-4 h-6 w-32 rounded-lg" />

              {Array.from({ length: 4 }).map((_, index) => (
                <Skeleton key={index} className="mb-3 h-10 w-full rounded-lg" />
              ))}
            </Card>

            <Card className="p-6">
              <Skeleton className="mb-4 h-6 w-32 rounded-lg" />

              {Array.from({ length: 3 }).map((_, index) => (
                <Skeleton key={index} className="mb-3 h-12 w-full rounded-lg" />
              ))}
            </Card>
          </div>
        </div>
      </div>
    </main>
  );
};
