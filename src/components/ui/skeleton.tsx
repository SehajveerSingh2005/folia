import { cn } from "@/lib/utils"

function Skeleton({
  className,
  ...props
}: React.HTMLAttributes<HTMLDivElement>) {
  return (
    <div
      className={cn(
        "animate-shimmer rounded-md bg-gradient-to-r from-secondary via-background to-secondary bg-[length:200%_100%]",
        className
      )}
      {...props}
    />
  )
}

export { Skeleton }