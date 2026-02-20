export type VideoRow = {
  url: string;
  title: string;
  owner_url?: string;
  owner?: string;
  duration?: string; // HH:MM:SS or MM:SS
  published_date?: string; // YYYY-MM-DD
  view_count?: string | number;
  subscription_count?: string | number;
  tags?: string;
  gpt_tags?: string;
  Summary?: string;
  Format?: string;
  Topic?: string;
};

export type Video = VideoRow & {
  id: string;               // stable key (videoId if possible, else url)
  videoId?: string;         // YouTube video id (if parsed)
  durationSeconds?: number; // derived
  topics: string[];         // normalized topic categories
};

export type VideoFlags = {
  id: string; // matches Video.id
  watched?: boolean;
  watchLater?: boolean;
  favorite?: boolean;
  updatedAt: number;
};
