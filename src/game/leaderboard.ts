export const YOU_NAME = 'jonatan';
export const LB_PAGE_SIZE = 100;

export interface LbRow { name: string; tier: number; seconds: number; country: string; }

function generateMockLeaderboard(count: number): LbRow[] {
  const adjectives = ['cosmic','epic','lazy','sneaky','turbo','silent','crazy','mighty','dark','shiny','gold','iron','fire','ice','shadow','super','mega','ultra','noob','pro','wild','calm','quick','slow','tiny','huge','grim','pure','rough','smooth','sweet','salty','spicy','funky','jazzy','witty','bold','chill','flux','retro','neon','toxic','swift','silent','lucky','rusty','blank','hyper','cyber','quantum'];
  const nouns = ['ninja','wizard','bot','cat','panda','dragon','tiger','snake','hawk','wolf','bear','fox','lion','eagle','shark','owl','spider','rhino','gorilla','whale','phoenix','kraken','golem','ghost','sage','knight','pirate','viking','samurai','ronin','monk','jester','witch','vampire','demon','angel','titan','specter','warden','reaper','prophet','overlord','baron','duke','king','queen','jester','rogue','bard','druid','ranger'];
  const countries = ['BR','US','JP','DE','FR','UK','CN','IN','KR','CA','AU','MX','IT','ES','NL','SE','NO','AR','CL','PT','RU','PL','TR','VN','TH','SG','PH','ZA','NG','EG','SA','AE','IL','UA','CZ','GR','RO','HU','FI','DK','NZ','MY','ID','PE','CO'];

  const players: LbRow[] = [];
  for (let i = 0; i < count; i++) {
    const adj = adjectives[Math.floor(Math.random() * adjectives.length)];
    const noun = nouns[Math.floor(Math.random() * nouns.length)];
    const num = Math.floor(Math.random() * 999);
    const sep = Math.random() < 0.5 ? '.' : (Math.random() < 0.5 ? '-' : '_');
    const name = num > 100 ? `${adj}${sep}${noun}${num}` : `${adj}${sep}${noun}`;
    const tierRoll = Math.random();
    const tier = Math.max(1, Math.floor(600 * Math.pow(tierRoll, 1.8)));
    const baseSeconds = tier * (240 + Math.random() * 480);
    const seconds = Math.floor(baseSeconds + Math.random() * 3600);
    const country = countries[Math.floor(Math.random() * countries.length)];
    players.push({ name, tier, seconds, country });
  }
  players[Math.floor(Math.random() * count)] = {
    name: YOU_NAME, tier: 188, seconds: 1 * 3600 + 22 * 60, country: 'BR',
  };
  return players;
}

const MOCK_LEADERBOARD = generateMockLeaderboard(1000);
export const SORTED_LB: LbRow[] = MOCK_LEADERBOARD.slice().sort((a, b) => b.tier - a.tier || a.seconds - b.seconds);
export const YOU_RANK = SORTED_LB.findIndex(r => r.name === YOU_NAME) + 1;
export const YOU_DATA: LbRow | undefined = SORTED_LB[YOU_RANK - 1];

export function rankClass(rank: number): string {
  if (rank === 1) return 'top-1';
  if (rank === 2) return 'top-2';
  if (rank === 3) return 'top-3';
  return '';
}
export function rankPrefix(rank: number): string | number {
  if (rank === 1) return '🥇';
  if (rank === 2) return '🥈';
  if (rank === 3) return '🥉';
  return rank;
}
