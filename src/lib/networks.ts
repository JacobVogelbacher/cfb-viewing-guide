/** Preferred network display order. */
const NETWORK_ORDER = [
  "NBC",
  "CBS",
  "ABC",
  "FOX",
  "ESPN",
  "ESPN2",
  "ESPNU",
  "BTN",
  "SECN",
  "ACCN",
  "FS1",
  "CBSSN",
  "CW",
  "TNT",
  "truTV",
  "Peacock",
  "ESPN+",
  "MW+",
  // Remaining outlets (alphabetized via compare when not listed above)
  "FS2",
  "Prime Video",
  "USA Network",
  "NFL Network",
  "PAC12",
] as const;

/** Normalize raw CFBD outlet names to a canonical key + display name. */
const OUTLET_ALIASES: Record<string, string> = {
  cbs: "CBS",
  "cbs sports": "CBS",
  nbc: "NBC",
  fox: "FOX",
  abc: "ABC",
  espn: "ESPN",
  espn2: "ESPN2",
  espnu: "ESPNU",
  "espn+": "ESPN+",
  "espn plus": "ESPN+",
  "espn+ / sec network+": "ESPN+",
  "sec network+": "ESPN+",
  "big ten plus": "ESPN+",
  "btn+": "ESPN+",
  "acc extra": "ESPN+",
  "accnx": "ESPN+",
  "acc network extra": "ESPN+",
  cbssn: "CBSSN",
  "cbs sports network": "CBSSN",
  "cbs sports net": "CBSSN",
  btn: "BTN",
  "big ten network": "BTN",
  "big ten net": "BTN",
  secn: "SECN",
  "sec network": "SECN",
  "sec net": "SECN",
  accn: "ACCN",
  "acc network": "ACCN",
  "acc net": "ACCN",
  fs1: "FS1",
  "fox sports 1": "FS1",
  fs2: "FS2",
  "fox sports 2": "FS2",
  peacock: "Peacock",
  "prime video": "Prime Video",
  "amazon prime": "Prime Video",
  "amazon prime video": "Prime Video",
  cw: "CW",
  "the cw": "CW",
  tnt: "TNT",
  "trutv": "truTV",
  "tru tv": "truTV",
  "usa network": "USA Network",
  usa: "USA Network",
  "nfl network": "NFL Network",
  pac12: "PAC12",
  "pac-12 network": "PAC12",
  "pac-12 net": "PAC12",
  "mw+": "MW+",
  "mw plus": "MW+",
  "mountain west+": "MW+",
  "mountain west plus": "MW+",
  "mountain west network": "MW+",
};

export function normalizeOutlet(outlet: string | null | undefined): string {
  if (!outlet?.trim()) return "TBD";
  const raw = outlet.trim();
  const key = raw.toLowerCase();
  if (OUTLET_ALIASES[key]) return OUTLET_ALIASES[key];

  // Partial matches for long outlet strings
  for (const [alias, name] of Object.entries(OUTLET_ALIASES)) {
    if (key.includes(alias) || alias.includes(key)) {
      return name;
    }
  }

  return raw;
}

export function networkSortIndex(network: string): number {
  const idx = NETWORK_ORDER.indexOf(network as (typeof NETWORK_ORDER)[number]);
  return idx === -1 ? NETWORK_ORDER.length + network.localeCompare("a") : idx;
}

export function compareNetworks(a: string, b: string): number {
  const ai = NETWORK_ORDER.indexOf(a as (typeof NETWORK_ORDER)[number]);
  const bi = NETWORK_ORDER.indexOf(b as (typeof NETWORK_ORDER)[number]);
  if (ai === -1 && bi === -1) return a.localeCompare(b);
  if (ai === -1) return 1;
  if (bi === -1) return -1;
  return ai - bi;
}

/** Brand colors for network row accents. */
export const NETWORK_COLORS: Record<string, string> = {
  NBC: "#222222",
  CBS: "#0033A0",
  ABC: "#000000",
  FOX: "#1B3FA0",
  ESPN: "#D00027",
  ESPN2: "#D00027",
  ESPNU: "#D00027",
  BTN: "#0088CE",
  SECN: "#004B87",
  ACCN: "#013CA6",
  FS1: "#1B3FA0",
  CBSSN: "#0033A0",
  CW: "#00B5E2",
  TNT: "#FF6600",
  truTV: "#FF6600",
  Peacock: "#000000",
  "ESPN+": "#D00027",
  "MW+": "#4F2D7F",
  FS2: "#1B3FA0",
  "Prime Video": "#00A8E1",
};

/**
 * Local SVG logos under /public/networks.
 * Keyed by canonical outlet name from normalizeOutlet().
 *
 * Square marks (ABC, CBS) get a larger display box via `boxScale` so they
 * don't look undersized next to wide wordmarks — no CSS transform.
 */
export type NetworkLogoMeta = {
  src: string;
  /**
   * Multiplier on the logo display box (width & height). Use for square
   * marks that under-fill a wide short cell with object-fit:contain.
   * Default 1.
   */
  boxScale?: number;
};

export const NETWORK_LOGOS: Record<string, NetworkLogoMeta> = {
  NBC: { src: "/networks/nbc.svg" },
  CBS: { src: "/networks/cbs.svg", boxScale: 1.2 },
  ABC: { src: "/networks/abc.svg", boxScale: 1.2 },
  // Wordmark; viewBox tight-cropped vertically (was letterboxed on 24×24)
  FOX: { src: "/networks/fox.svg" },
  ESPN: { src: "/networks/espn.svg" },
  ESPN2: { src: "/networks/espn2.svg" },
  // Square U badge — same box boost as ABC/CBS
  ESPNU: { src: "/networks/espnu.svg", boxScale: 1.2 },
  BTN: { src: "/networks/btn.svg" },
  ACCN: { src: "/networks/accn.svg" },
  SECN: { src: "/networks/secn.svg" },
  FS1: { src: "/networks/fs1.svg" },
  CBSSN: { src: "/networks/cbssn.svg" },
  CW: { src: "/networks/cw.svg" },
  // Circular mark — same box boost as ABC/CBS
  TNT: { src: "/networks/tnt.svg", boxScale: 1.2 },
  "ESPN+": { src: "/networks/espn-plus.svg" },
  "USA Network": { src: "/networks/usa.svg" },
  Peacock: { src: "/networks/peacock.svg" },
  // Near-square conference mark
  "MW+": { src: "/networks/mw.svg", boxScale: 1.2 },
  truTV: { src: "/networks/trutv.svg" },
};

export function getNetworkLogo(network: string): NetworkLogoMeta | null {
  return NETWORK_LOGOS[network] ?? null;
}
