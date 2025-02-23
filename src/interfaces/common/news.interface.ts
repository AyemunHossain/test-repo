export interface News {
  _id?: string;
  title: string;
  description: string;
  content: string;
  thumbnail?: string;
  category?: string;
  source: string;
  url?: string;
  author?: string;
  publishedAt?: Date;
  fetchedAt?: Date;
  tags?: string[];
  isTrending?: boolean;
}
