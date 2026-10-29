// Name filter for anything players type that other players can see (league names, coach names, leaderboard names).
// Normalizes common letter swaps, then checks two lists: fragments that are never OK inside a name,
// and words that are only blocked as whole words (so "Gamecocks" or "Canal Street" are fine).
const SUB = ['fuck', 'shit', 'cunt', 'nigg', 'niga', 'faggot', 'fagot', 'retard', 'whore', 'slut', 'pussy', 'asshole', 'dildo', 'jizz', 'molest', 'kike', 'wetback', 'raghead', 'towelhead', 'porn', 'hitler', 'nazi', 'bitch', 'rapist', 'pedophile', 'blowjob', 'handjob', 'cumshot', 'tranny', 'spick', 'chink', 'gook', 'beaner', 'heilhitler', 'siegheil', 'kkk', 'killallthe'];
const WORD = ['fag', 'fags', 'dick', 'dicks', 'cock', 'cocks', 'penis', 'vagina', 'rape', 'raped', 'sex', 'sexy', 'cum', 'tit', 'tits', 'titty', 'boob', 'boobs', 'anal', 'anus', 'pedo', 'coon', 'coons', 'negro', 'spic', 'spics', 'dyke', 'twat', 'wank', 'heil', 'nude', 'nudes', 'bastard', 'ass', 'arse', 'piss', 'damn', 'hoe', 'hoes', 'thot', 'incel', 'isis', 'jihad'];
const LEET = { '0': 'o', '1': 'i', '!': 'i', '|': 'i', '3': 'e', '4': 'a', '@': 'a', '5': 's', '$': 's', '7': 't', '+': 't', '8': 'b', '9': 'g' };
const norm = s => String(s || '').toLowerCase().replace(/[01!|3@457$+89]/g, c => LEET[c] || c);
export function badName(s) {
  const n = norm(s);
  const squashed = n.replace(/[^a-z]/g, '');
  const dedup = squashed.replace(/(.)\1+/g, '$1');
  if (SUB.some(w => { const d = w.replace(/(.)\1+/g, '$1'); return squashed.includes(w) || (d.length >= 4 && dedup.includes(d)); })) return true;
  const words = n.split(/[^a-z]+/).filter(Boolean);
  if (words.some(w => WORD.includes(w) || WORD.includes(w.replace(/(.)\1+/g, '$1')))) return true;
  return false;
}
