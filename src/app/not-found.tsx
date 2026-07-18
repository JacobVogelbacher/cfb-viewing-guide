import Link from "next/link";

export default function NotFound() {
  return (
    <main className="mx-auto w-full max-w-[1600px] flex-1 px-4 py-16 sm:px-6 lg:px-8">
      <div className="mx-auto max-w-lg">
        <div className="rounded-xl border border-zinc-200 bg-white p-8 shadow-sm sm:p-10">
          <p className="text-xs font-bold uppercase tracking-wider text-emerald-700">
            404
          </p>
          <h1 className="mt-2 text-2xl font-black tracking-tight text-zinc-900 sm:text-3xl">
            Page not found
          </h1>
          <p className="mt-3 text-sm leading-relaxed text-zinc-500">
            That week or season isn&apos;t available. Seasons only go back five
            years from the current season, and some paths simply don&apos;t
            exist.
          </p>
          <div className="mt-8">
            <Link
              href="/"
              className="inline-flex items-center rounded-lg bg-emerald-700 px-4 py-2 text-sm font-semibold text-white shadow-sm transition hover:bg-emerald-800"
            >
              Back to the guide
            </Link>
          </div>
        </div>
        <p className="mt-6 text-center text-xs text-zinc-400">
          CFB TV Guide · Saturday kickoffs in Eastern Time
        </p>
      </div>
    </main>
  );
}
