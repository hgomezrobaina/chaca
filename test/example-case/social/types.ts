export interface SocialUser {
  id: string;
  username: string;
  email: string;
  display_name: string;
  bio: string | null;
  private: boolean;
  created_at: Date;
}

export interface SocialFollow {
  id: string;
  follower_id: string;
  followed_id: string;
  created_at: Date;
}

export enum PostVisibility {
  Public = "public",
  Followers = "followers",
  Private = "private",
}

export interface SocialPost {
  id: string;
  author_id: string;
  body: string;
  visibility: PostVisibility;
  created_at: Date;
  edited_at: Date | null;
}

export interface SocialComment {
  id: string;
  post_id: string;
  author_id: string;
  parent_comment_id: string | null;
  depth: number;
  body: string;
  created_at: Date;
}

export enum ReactionKind {
  Like = "like",
  Love = "love",
  Laugh = "laugh",
  Angry = "angry",
}

export interface SocialReaction {
  id: string;
  user_id: string;
  post_id: string;
  kind: ReactionKind;
  created_at: Date;
}

export interface SocialHashtag {
  id: string;
  tag: string;
  created_at: Date;
}

export interface SocialPostHashtag {
  id: string;
  post_id: string;
  hashtag_id: string;
}

export interface SocialDirectMessage {
  id: string;
  sender_id: string;
  recipient_id: string;
  body: string;
  sent_at: Date;
  read_at: Date | null;
}

export interface SocialDataset {
  User: SocialUser[];
  Follow: SocialFollow[];
  Post: SocialPost[];
  Comment: SocialComment[];
  Reaction: SocialReaction[];
  Hashtag: SocialHashtag[];
  PostHashtag: SocialPostHashtag[];
  DirectMessage: SocialDirectMessage[];
}
