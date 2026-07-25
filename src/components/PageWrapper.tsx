import Link from "next/link";
import { Logo } from "./Logo";

export function PageWrapper({ children }: { children: React.ReactNode }) {
  return (
    <>
      <div className="sticky top-0 left-0 z-30 flex max-w-[1600px] items-center justify-between bg-zinc-100 px-4 py-3 sm:px-6 lg:px-8 xl:static">
        <Link href="/" title="Home">
          <Logo />
        </Link>
      </div>

      <main className="flex-1">{children}</main>
    </>
  );
}
