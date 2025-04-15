import { pgTable, text, serial, integer, boolean, timestamp } from "drizzle-orm/pg-core";
import { createInsertSchema } from "drizzle-zod";
import { z } from "zod";

export const users = pgTable("users", {
  id: serial("id").primaryKey(),
  username: text("username").notNull().unique(),
  email: text("email").notNull().unique(),
  password: text("password"),
  firebaseUid: text("firebase_uid").notNull().unique(),
  avatarUrl: text("avatar_url"),
  isPro: boolean("is_pro").default(false).notNull(),
  lastLogin: timestamp("last_login"),
  isFirstLogin: boolean("is_first_login").default(true).notNull(),
});

export const apiKeys = pgTable("api_keys", {
  id: serial("id").primaryKey(),
  userId: integer("user_id").notNull().references(() => users.id),
  youtubeKey: text("youtube_key"),
  instagramKey: text("instagram_key"),
  twitterKey: text("twitter_key"),
  facebookKey: text("facebook_key"),
});

export const subscriptions = pgTable("subscriptions", {
  id: serial("id").primaryKey(),
  userId: integer("user_id").notNull().references(() => users.id),
  plan: text("plan").notNull(),
  paymentId: text("payment_id"),
  startDate: timestamp("start_date").notNull(),
  endDate: timestamp("end_date").notNull(),
  status: text("status").notNull(),
});

// Insert schemas
export const insertUserSchema = createInsertSchema(users).omit({
  id: true,
  isPro: true,
  lastLogin: true,
  isFirstLogin: true,
});

export const insertApiKeySchema = createInsertSchema(apiKeys).omit({
  id: true,
});

export const insertSubscriptionSchema = createInsertSchema(subscriptions).omit({
  id: true,
});

// Types
export type InsertUser = z.infer<typeof insertUserSchema>;
export type User = typeof users.$inferSelect;

export type InsertApiKey = z.infer<typeof insertApiKeySchema>;
export type ApiKey = typeof apiKeys.$inferSelect;

export type InsertSubscription = z.infer<typeof insertSubscriptionSchema>;
export type Subscription = typeof subscriptions.$inferSelect;

// Social Media Platform Types
export type Platform = 'youtube' | 'instagram' | 'twitter' | 'facebook';

export type SocialStats = {
  platform: Platform;
  followers: number;
  followersGrowth: number;
  views: number;
  viewsGrowth: number;
  engagement: number;
  engagementGrowth: number;
  posts: SocialPost[];
  lastUpdated: string;
};

export type SocialPost = {
  id: string;
  platform: Platform;
  title: string;
  thumbnailUrl?: string;
  views: number;
  likes: number;
  comments: number;
  shares: number;
  datePosted: string;
  postUrl: string;
};
