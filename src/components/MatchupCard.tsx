import type { ViewingGame } from "@/lib/cfbd/types";
import { formatGameKickoff } from "@/lib/time";

function TeamLogo({
  name,
  logo,
  sizePx,
}: {
  name: string;
  logo: string | null;
  sizePx: number;
}) {
  const size = Math.max(12, Math.round(sizePx));
  return (
    <div
      className="relative flex shrink-0 items-center justify-center"
      style={{ width: size, height: size }}
      title={name}
    >
      {logo ? (
        // Native img (not next/image) so export can rewrite src to data URLs.
        // eslint-disable-next-line @next/next/no-img-element
        <img
          src={logo}
          alt={name}
          width={size}
          height={size}
          className="h-full w-full object-contain"
          draggable={false}
        />
      ) : (
        <span
          className="flex h-full w-full items-center justify-center rounded-full bg-zinc-100 font-bold uppercase text-zinc-600"
          style={{ fontSize: Math.max(7, size * 0.28) }}
        >
          {name.slice(0, 3)}
        </span>
      )}
    </div>
  );
}

/**
 * Compact matchup that fills its timeline bar (typically a 3-hour span).
 */
export function MatchupCard({
  game,
  logoSizePx = 36,
}: {
  game: ViewingGame;
  logoSizePx?: number;
}) {
  const title = [
    `${game.awayTeam} at ${game.homeTeam}`,
    game.venue,
    formatGameKickoff(game.startTime),
  ]
    .filter(Boolean)
    .join(" · ");

  const pad = Math.max(2, Math.round(logoSizePx * 0.12));
  const gap = Math.max(2, Math.round(logoSizePx * 0.15));

  return (
    <article
      className="flex h-full w-full min-w-0 items-center justify-center overflow-hidden rounded-md border border-zinc-200/90 bg-white shadow-sm"
      style={{ gap, paddingLeft: pad, paddingRight: pad }}
      title={title}
    >
      <TeamLogo name={game.awayTeam} logo={game.awayLogo} sizePx={logoSizePx} />
      <TeamLogo name={game.homeTeam} logo={game.homeLogo} sizePx={logoSizePx} />
    </article>
  );
}
