export default function Loading() {
  return (
    <main className="mx-auto w-full max-w-[1600px] px-4 py-8 sm:px-6 lg:px-8">
      <div className="mb-8 animate-pulse space-y-3">
        <div className="h-3 w-48 rounded bg-zinc-200" />
        <div className="h-10 w-72 rounded bg-zinc-200" />
        <div className="h-4 w-96 max-w-full rounded bg-zinc-200" />
      </div>
      <div className="h-12 w-full animate-pulse rounded-xl bg-zinc-200" />
      <div className="mt-6 h-96 w-full animate-pulse rounded-xl bg-zinc-200" />
    </main>
  );
}
