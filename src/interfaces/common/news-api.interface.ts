export interface NewsAPIResponse {
  articles: Array<{
    title: string;
    description: string;
    author: string;
    content: string;
    urlToImage: string | null;
    source: {
      name: string;
    };
    url: string;
    publishedAt: Date;
  }>;
}
