import { PageWrapper } from "@/components/PageWrapper";

export default function Loading() {
  return (
    <PageWrapper>
      <div className="flex w-full min-h-0 flex-1 flex-col overflow-hidden">
        <div className="shrink-0 px-4 pb-2 sm:px-6 lg:px-8">
          <div className="flex animate-pulse items-center gap-3">
            <div className="h-7 w-28 rounded-lg bg-zinc-200" />
            <div className="h-7 w-28 rounded-lg bg-zinc-200" />
            <div className="ml-auto h-7 w-36 rounded-lg bg-zinc-200" />
          </div>
        </div>
        <div className="min-h-0 flex-1 border-y border-zinc-200 bg-white">
          <div className="h-full w-full animate-pulse bg-zinc-100" />
        </div>
      </div>
    </PageWrapper>
  );
}
