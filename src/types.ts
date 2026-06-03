export interface Channel {
  name: string;
  logo: string;
  url: string;
  country: string;
  category: string;
  language: string;
  quality?: string;
}

export type ActiveTab = 'all' | 'hd' | 'recent';
