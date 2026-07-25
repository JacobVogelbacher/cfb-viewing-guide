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
    <>
      <div className="sticky top-0 left-0 z-30 flex w-full max-w-[1600px] items-center justify-between gap-3 bg-zinc-100 px-4 py-3 sm:px-6 md:static lg:px-8">
        <Link href="/" title="Home">
          <Logo />
        </Link>
        {headerActions ? (
          <div className="flex shrink-0 items-center gap-2">
            {headerActions}
          </div>
        ) : null}
      </div>

      <main className="flex-1">{children}</main>
    </>
  );
}
