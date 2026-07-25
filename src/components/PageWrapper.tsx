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
    <div className="flex min-h-0 flex-1 flex-col max-sm:h-full sm:min-h-full">
      {/* App chrome: fixed-height on mobile (body is 100svh); not a page-scroll sticky bar. */}
      <div className="z-40 flex w-full shrink-0 items-center justify-between gap-3 bg-zinc-100 px-4 py-3 sm:max-w-[1600px] sm:px-6 lg:px-8">
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
