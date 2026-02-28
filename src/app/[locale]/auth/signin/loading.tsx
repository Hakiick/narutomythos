import { Skeleton } from '@/components/ui/skeleton';

export default function SignInLoading() {
  return (
    <div className="container mx-auto flex min-h-[calc(100vh-8rem)] items-center justify-center px-4 py-8">
      <div className="w-full max-w-md rounded-xl border border-border bg-card p-6">
        <div className="mb-6 text-center">
          <Skeleton className="mx-auto mb-2 h-7 w-40" />
          <Skeleton className="mx-auto h-4 w-60" />
        </div>
        <div className="space-y-4">
          <div className="space-y-2">
            <Skeleton className="h-4 w-12" />
            <Skeleton className="h-9 w-full" />
          </div>
          <div className="space-y-2">
            <Skeleton className="h-4 w-16" />
            <Skeleton className="h-9 w-full" />
          </div>
          <Skeleton className="h-9 w-full" />
        </div>
        <Skeleton className="my-6 h-px w-full" />
        <div className="space-y-3">
          <Skeleton className="h-9 w-full" />
          <Skeleton className="h-9 w-full" />
        </div>
      </div>
    </div>
  );
}
