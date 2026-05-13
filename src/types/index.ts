export interface PostFrontmatter {
  title: string;
  description: string;
  date: Date;
  updated?: Date;
  category: 'hardware' | 'ai' | 'cuda' | 'guide';
  tags: string[];
  image?: string;
  draft: boolean;
}

export interface Project {
  id: string;
  title: string;
  description: string;
  category: 'hardware' | 'ai';
  techStack: string[];
  highlights: string[];
  link?: string;
}

export interface SiteStats {
  postCount: number;
  tagCount: number;
  totalWords: number;
}