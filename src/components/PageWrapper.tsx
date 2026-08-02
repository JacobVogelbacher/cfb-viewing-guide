import type { ReactNode } from "react";
import Link from "next/link";
import { Logo } from "./Logo";

export function PageWrapper({
  children,
  headerActions,
}: {
  children: ReactNode;
  /** Optional controls rendered on the right side of the sticky logo header. */
  headerActions?: ReactNode;
}) {
  return (
    <div className="flex h-full min-h-0 flex-1 flex-col">
      {/* App chrome: fixed-height strip (body is viewport-locked; table is the scrollport). */}
      <div className="z-40 flex w-full shrink-0 items-center justify-between gap-3 bg-zinc-100 px-4 py-3 sm:px-6 lg:px-8">
        <Link href="/" title="Home">
          <Logo />
        </Link>
        {headerActions ? (
          <div className="flex shrink-0 items-center gap-2">
            {headerActions}
          </div>
        ) : null}
      </div>

      <main className="flex min-h-0 flex-1 flex-col">{children}</main>
    </div>
  );
}
