export interface UserData {
  id: number;
  username: string;
  email: string;
  bio: string;
  image: string;
  articleCount: number;
  totalLikes: number;
  firstArticleDate: Date;
  articles?: any[];
}
