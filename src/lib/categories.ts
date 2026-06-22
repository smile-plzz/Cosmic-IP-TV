/**
 * Streamlines raw M3U group-titles into a consolidated set of categories.
 */
export function streamlineCategory(raw?: string): string {
  if (!raw || raw.toLowerCase().includes('others') || raw.toLowerCase().includes('undefined')) return 'General';
  
  const category = raw.toLowerCase().trim();

  const mappings: Record<string, string[]> = {
    'News & Info': ['news', 'info', 'business', 'economy', 'weather', 'press', 'documentary', 'nature', 'science', 'discovery', 'history', 'wild', 'earth', 'nat geo', 'curiosity'],
    'Sports': ['sports', 'sport', 'football', 'soccer', 'cricket', 'nba', 'fighting', 'racing', 'tennis', 'golf', 'espn', 'beinsport'],
    'Cinema & TV': ['movie', 'cinema', 'films', 'action', 'comedy', 'drama', 'horror', 'thriller', 'sci-fi', 'romance', 'series', 'tv shows', 'show', 'serial', 'episodes'],
    'Entertainment': ['music', 'songs', 'mtv', 'radio', 'jazz', 'rock', 'pop', 'vhl', 'opera', 'lifestyle', 'fashion', 'cooking', 'food', 'travel', 'home', 'garden', 'health', 'wellness', 'entertainment', 'variety'],
    'Kids': ['kids', 'children', 'cartoon', 'animation', 'disney', 'nik', 'junior', 'baby'],
    'Religious': ['religious', 'islam', 'christian', 'faith', 'religion', 'church', 'quran', 'bible', 'gospel'],
    'Adult': ['adult', 'xxx', 'porn', 'nsfw', 'redlight', 'playboy']
  };

  for (const [standard, keywords] of Object.entries(mappings)) {
    if (keywords.some(k => category.includes(k))) {
      return standard;
    }
  }

  // Capitalize nicely
  return raw.trim().split(' ').map(word => word.charAt(0).toUpperCase() + word.slice(1).toLowerCase()).join(' ');
}
