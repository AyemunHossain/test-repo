export interface NYTResponse {
  response: {
    docs: Array<{
      headline: { main: string };
      abstract: string;
      source: string;
      lead_paragraph: string;
      multimedia: Array<{ url: string }>;
      section_name: string;
      web_url: string;
      pub_date: Date;
      byline: {
        original: string;
      };
    }>;
  };
}
