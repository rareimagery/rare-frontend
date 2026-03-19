export type PreviewProduct = {
  id: string;
  title: string;
  price: number;
  image?: string;
};

export type PreviewVideo = {
  id: string;
  url: string;
  thumbnail?: string;
};

export type PreviewPost = {
  id: string;
  text: string;
  linkedProduct?: string;
};

export type TemplatePreviewProps = {
  products: PreviewProduct[];
  videos: PreviewVideo[];
  posts: PreviewPost[];
  handle: string;
  avatar?: string;
  bio?: string;
};
