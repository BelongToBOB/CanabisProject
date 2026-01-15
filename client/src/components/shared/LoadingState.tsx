import { Skeleton } from "@/components/common/Skeleton";
import { Loader2 } from "lucide-react";
import { cn } from "@/lib/utils";

export interface LoadingStateProps {
  type?: "spinner" | "skeleton" | "page";
  count?: number;
  className?: string;
}

export function LoadingState({
  type = "spinner",
  count = 3,
  className,
}: LoadingStateProps) {
  if (type === "spinner") {
    return (
      <div
        className={cn(
          "flex items-center justify-center p-8",
          className
        )}
        role="status"
        aria-busy="true"
        aria-label="กำลังโหลด"
      >
        <Loader2 className="h-8 w-8 animate-spin text-emerald-600 dark:text-emerald-500" />
      </div>
    );
  }

  if (type === "skeleton") {
    return (
      <div className={cn("space-y-4", className)} role="status" aria-busy="true">
        {Array.from({ length: count }).map((_, index) => (
          <div key={index} className="space-y-2">
            <Skeleton className="h-4 w-full bg-slate-200 dark:bg-slate-800" />
            <Skeleton className="h-4 w-3/4 bg-slate-200 dark:bg-slate-800" />
          </div>
        ))}
      </div>
    );
  }

  if (type === "page") {
    return (
      <div className={cn("space-y-6 p-6", className)} role="status" aria-busy="true">
        {/* Header skeleton */}
        <div className="space-y-3">
          <Skeleton className="h-8 w-1/3 bg-slate-200 dark:bg-slate-800" />
          <Skeleton className="h-4 w-1/2 bg-slate-200 dark:bg-slate-800" />
        </div>

        {/* Content skeleton */}
        <div className="space-y-4">
          <Skeleton className="h-10 w-full bg-slate-200 dark:bg-slate-800" />
          <div className="space-y-3">
            {Array.from({ length: 5 }).map((_, index) => (
              <Skeleton key={index} className="h-16 w-full bg-slate-200 dark:bg-slate-800" />
            ))}
          </div>
        </div>
      </div>
    );
  }

  return null;
}
