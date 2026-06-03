import { Channel } from '@/src/types';

export function parseM3U(text: string): Channel[] {
  const lines = text.split('\n');
  const out: Channel[] = [];
  let cur: Partial<Channel> | null = null;
  
  for (let i = 0; i < lines.length; i++) {
    const line = lines[i].trim();
    if (line.startsWith('#EXTINF:')) {
      const nameMatch = line.match(/,(.+)$/);
      const logoMatch = line.match(/tvg-logo="([^"]*)"/);
      const countryMatch = line.match(/tvg-country="([^"]*)"/);
      const languageMatch = line.match(/tvg-language="([^"]*)"/);
      const groupMatch = line.match(/group-title="([^"]*)"/);
      
      const qualityMatch = line.match(/\b(1080[pi]?|720[pi]?|480[pi]?|360[pi]?)\b/i);

      cur = {
        name: nameMatch ? nameMatch[1].trim() : 'Unknown',
        logo: logoMatch ? logoMatch[1] : '',
        country: countryMatch ? countryMatch[1].split(';')[0].trim().toLowerCase() : '',
        language: languageMatch ? languageMatch[1] : '',
        category: groupMatch ? groupMatch[1] : '',
        quality: qualityMatch ? qualityMatch[1] : '',
      };
    } else if (line && !line.startsWith('#') && cur) {
      cur.url = line;
      out.push(cur as Channel);
      cur = null;
    }
  }
  return out;
}
