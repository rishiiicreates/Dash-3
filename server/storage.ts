import { 
  users, 
  apiKeys, 
  subscriptions, 
  type User, 
  type InsertUser, 
  type ApiKey, 
  type InsertApiKey,
  type Subscription,
  type InsertSubscription,
  type SocialStats,
  type SocialPost,
  type Platform
} from "@shared/schema";
import { ExtendedSocialStats } from "./services/apiServices";

export interface IStorage {
  // User methods
  getUser(id: number): Promise<User | undefined>;
  getUserByEmail(email: string): Promise<User | undefined>;
  getUserByFirebaseUid(firebaseUid: string): Promise<User | undefined>;
  createUser(user: InsertUser): Promise<User>;
  updateUser(id: number, data: Partial<User>): Promise<User | undefined>;
  
  // API Keys methods
  getApiKeys(userId: number): Promise<ApiKey | undefined>;
  saveApiKeys(apiKeys: InsertApiKey): Promise<ApiKey>;
  updateApiKeys(userId: number, data: Partial<ApiKey>): Promise<ApiKey | undefined>;
  
  // Subscription methods
  getSubscription(userId: number): Promise<Subscription | undefined>;
  createSubscription(subscription: InsertSubscription): Promise<Subscription>;
  updateSubscription(id: number, data: Partial<Subscription>): Promise<Subscription | undefined>;
  
  // Social media data methods
  getPlatformStats(userId: number, platform: Platform, days: number): Promise<ExtendedSocialStats | undefined>;
  getAllPlatformStats(userId: number, days: number): Promise<ExtendedSocialStats[]>;
  getPosts(userId: number, platform: Platform | 'all', days: number, page: number, limit: number): Promise<{posts: SocialPost[], total: number}>;
}

export class MemStorage implements IStorage {
  private users: Map<number, User>;
  private platformApiKeys: Map<number, ApiKey>;
  private userSubscriptions: Map<number, Subscription>;
  private socialStats: Map<string, ExtendedSocialStats>;
  private currentUserId: number;
  private currentApiKeyId: number;
  private currentSubscriptionId: number;

  constructor() {
    this.users = new Map();
    this.platformApiKeys = new Map();
    this.userSubscriptions = new Map();
    this.socialStats = new Map();
    this.currentUserId = 1;
    this.currentApiKeyId = 1;
    this.currentSubscriptionId = 1;

    // Initialize with sample social stats
    this.initializeSampleData();
  }

  async getUser(id: number): Promise<User | undefined> {
    return this.users.get(id);
  }

  async getUserByEmail(email: string): Promise<User | undefined> {
    return Array.from(this.users.values()).find(
      (user) => user.email === email
    );
  }

  async getUserByFirebaseUid(firebaseUid: string): Promise<User | undefined> {
    return Array.from(this.users.values()).find(
      (user) => user.firebaseUid === firebaseUid
    );
  }

  async createUser(insertUser: InsertUser): Promise<User> {
    const id = this.currentUserId++;
    const now = new Date();
    
    const user: User = { 
      ...insertUser, 
      id, 
      isPro: false, 
      lastLogin: now,
      isFirstLogin: true,
      password: insertUser.password || null,
      avatarUrl: insertUser.avatarUrl || null
    };
    
    this.users.set(id, user);
    return user;
  }

  async updateUser(id: number, data: Partial<User>): Promise<User | undefined> {
    const user = this.users.get(id);
    if (!user) return undefined;
    
    const updatedUser = { ...user, ...data };
    this.users.set(id, updatedUser);
    return updatedUser;
  }

  async getApiKeys(userId: number): Promise<ApiKey | undefined> {
    return Array.from(this.platformApiKeys.values()).find(
      (apiKey) => apiKey.userId === userId
    );
  }

  async saveApiKeys(insertApiKey: InsertApiKey): Promise<ApiKey> {
    const id = this.currentApiKeyId++;
    const apiKey: ApiKey = { 
      ...insertApiKey, 
      id,
      youtubeKey: insertApiKey.youtubeKey || null,
      instagramKey: insertApiKey.instagramKey || null,
      twitterKey: insertApiKey.twitterKey || null,
      facebookKey: insertApiKey.facebookKey || null
    };
    this.platformApiKeys.set(id, apiKey);
    return apiKey;
  }

  async updateApiKeys(userId: number, data: Partial<ApiKey>): Promise<ApiKey | undefined> {
    const apiKey = Array.from(this.platformApiKeys.values()).find(
      (apiKey) => apiKey.userId === userId
    );
    
    if (!apiKey) return undefined;
    
    const updatedApiKey = { ...apiKey, ...data };
    this.platformApiKeys.set(apiKey.id, updatedApiKey);
    return updatedApiKey;
  }

  async getSubscription(userId: number): Promise<Subscription | undefined> {
    return Array.from(this.userSubscriptions.values()).find(
      (subscription) => subscription.userId === userId
    );
  }

  async createSubscription(insertSubscription: InsertSubscription): Promise<Subscription> {
    const id = this.currentSubscriptionId++;
    const subscription: Subscription = { 
      ...insertSubscription, 
      id,
      paymentId: insertSubscription.paymentId || null
    };
    this.userSubscriptions.set(id, subscription);
    return subscription;
  }

  async updateSubscription(id: number, data: Partial<Subscription>): Promise<Subscription | undefined> {
    const subscription = this.userSubscriptions.get(id);
    if (!subscription) return undefined;
    
    const updatedSubscription = { ...subscription, ...data };
    this.userSubscriptions.set(id, updatedSubscription);
    return updatedSubscription;
  }

  async getPlatformStats(userId: number, platform: Platform, days: number): Promise<ExtendedSocialStats | undefined> {
    try {
      // Check if user has API key for this platform
      const apiKeys = await this.getApiKeys(userId);
      const apiKeyFieldName = `${platform}Key` as keyof typeof apiKeys;
      const apiKey = apiKeys?.[apiKeyFieldName] as string | undefined;
      
      // If API key exists, try to fetch live data
      if (apiKey) {
        try {
          // Import dynamically to avoid circular dependencies
          const { SocialMediaApiServiceFactory } = await import('./services/apiServices');
          const apiService = SocialMediaApiServiceFactory.getService(platform);
          
          // Fetch real-time data from the platform's API
          const realTimeStats = await apiService.getPlatformStats(userId, apiKey, days);
          
          // Cache the result (in a real app, we might use Redis or another caching solution)
          const key = `${userId}:${platform}:${days}`;
          this.socialStats.set(key, realTimeStats);
          
          return realTimeStats;
        } catch (error) {
          console.error(`Error fetching ${platform} data:`, error);
          // Fall back to cached data if API call fails
        }
      }
      
      // Fall back to sample data if no API key or API call failed
      const key = `${userId}:${platform}:${days}`;
      return this.socialStats.get(key);
    } catch (error) {
      console.error(`Error in getPlatformStats for ${platform}:`, error);
      return undefined;
    }
  }

  async getAllPlatformStats(userId: number, days: number): Promise<ExtendedSocialStats[]> {
    // Get user's API keys to determine which platforms they have connected
    const apiKeys = await this.getApiKeys(userId);
    const stats: ExtendedSocialStats[] = [];
    
    // Define all available platforms
    const platforms: Platform[] = ['youtube', 'instagram', 'twitter', 'facebook'];
    
    // Process each platform (connected or not)
    for (const platform of platforms) {
      try {
        // Check if user has connected this platform
        const apiKeyFieldName = `${platform}Key` as keyof typeof apiKeys;
        const hasConnected = apiKeys && !!apiKeys[apiKeyFieldName];
        
        // If connected or we have sample data, include the platform stats
        const platformStats = await this.getPlatformStats(userId, platform, days);
        if (platformStats) {
          // Add a flag indicating whether this is connected or sample data
          const statsWithConnectionInfo = {
            ...platformStats,
            isConnected: hasConnected
          };
          stats.push(statsWithConnectionInfo);
        }
      } catch (error) {
        console.error(`Error getting stats for ${platform}:`, error);
        // Skip this platform if there's an error
      }
    }
    
    return stats;
  }

  async getPosts(userId: number, platform: Platform | 'all', days: number, page: number, limit: number): Promise<{posts: SocialPost[], total: number}> {
    const allPosts: SocialPost[] = [];
    
    // Get user's API keys to determine which platforms they have connected
    const apiKeys = await this.getApiKeys(userId);
    
    // Determine which platforms to include
    let platforms: Platform[];
    if (platform === 'all') {
      // Include all platforms
      platforms = ['youtube', 'instagram', 'twitter', 'facebook'];
    } else {
      // Include only the specified platform
      platforms = [platform];
    }
    
    // Gather posts from each platform
    for (const p of platforms) {
      try {
        // Try to get real-time or cached data for this platform
        const stats = await this.getPlatformStats(userId, p, days);
        
        if (stats?.posts) {
          // Add a flag to indicate if this post comes from a connected platform
          const apiKeyFieldName = `${p}Key` as keyof typeof apiKeys;
          const isConnected = apiKeys && !!apiKeys[apiKeyFieldName];
          
          const platformPosts = stats.posts.map(post => ({
            ...post,
            isConnected
          }));
          
          allPosts.push(...platformPosts);
        }
      } catch (error) {
        console.error(`Error getting posts for ${p}:`, error);
        // Skip this platform if there's an error
      }
    }
    
    // Sort by datePosted (newest first)
    allPosts.sort((a, b) => new Date(b.datePosted).getTime() - new Date(a.datePosted).getTime());
    
    // Paginate results
    const startIndex = (page - 1) * limit;
    const endIndex = startIndex + limit;
    
    return {
      posts: allPosts.slice(startIndex, endIndex),
      total: allPosts.length
    };
  }

  // Initialize with sample data - this would be replaced with actual API integration
  private initializeSampleData() {
    const sampleData: { [key: string]: SocialStats } = {
      // YouTube data
      '1:youtube:7': {
        platform: 'youtube',
        followers: 78200,
        followersGrowth: 1.2,
        views: 1200000,
        viewsGrowth: 3.5,
        engagement: 25600,
        engagementGrowth: 4.7,
        lastUpdated: new Date().toISOString(),
        posts: [
          {
            id: 'yt1',
            platform: 'youtube',
            title: 'How to Increase Your Social Media Engagement in 2023',
            thumbnailUrl: 'https://via.placeholder.com/56x40',
            views: 24800,
            likes: 1200,
            comments: 156,
            shares: 86,
            datePosted: '2023-06-12T00:00:00Z',
            postUrl: 'https://youtube.com/watch?v=example1'
          },
          {
            id: 'yt2',
            platform: 'youtube',
            title: '10 Social Media Trends for 2023',
            thumbnailUrl: 'https://via.placeholder.com/56x40',
            views: 18500,
            likes: 950,
            comments: 120,
            shares: 65,
            datePosted: '2023-06-10T00:00:00Z',
            postUrl: 'https://youtube.com/watch?v=example2'
          }
        ]
      },
      // Instagram data
      '1:instagram:7': {
        platform: 'instagram',
        followers: 45800,
        followersGrowth: 2.4,
        views: 230000,
        viewsGrowth: 5.6,
        engagement: 18900,
        engagementGrowth: 3.2,
        lastUpdated: new Date().toISOString(),
        posts: [
          {
            id: 'ig1',
            platform: 'instagram',
            title: 'New product launch! Check out our summer collection #fashion #style',
            thumbnailUrl: 'https://via.placeholder.com/56x40',
            views: 8400,
            likes: 945,
            comments: 42,
            shares: 0,
            datePosted: '2023-06-10T00:00:00Z',
            postUrl: 'https://instagram.com/p/example1'
          },
          {
            id: 'ig2',
            platform: 'instagram',
            title: 'Behind the scenes at our latest photoshoot #behindthescenes',
            thumbnailUrl: 'https://via.placeholder.com/56x40',
            views: 6200,
            likes: 720,
            comments: 38,
            shares: 0,
            datePosted: '2023-06-08T00:00:00Z',
            postUrl: 'https://instagram.com/p/example2'
          }
        ]
      },
      // Twitter data
      '1:twitter:7': {
        platform: 'twitter',
        followers: 22100,
        followersGrowth: 1.8,
        views: 238000,
        viewsGrowth: -2.1,
        engagement: 5600,
        engagementGrowth: 0.8,
        lastUpdated: new Date().toISOString(),
        posts: [
          {
            id: 'tw1',
            platform: 'twitter',
            title: 'We\'re excited to announce our partnership with @techcompany to bring you even better social analytics! #announcement',
            thumbnailUrl: undefined,
            views: 12300,
            likes: 248,
            comments: 32,
            shares: 68,
            datePosted: '2023-06-08T00:00:00Z',
            postUrl: 'https://twitter.com/username/status/example1'
          },
          {
            id: 'tw2',
            platform: 'twitter',
            title: 'What\'s your favorite social media platform? Let us know in the comments below! #poll',
            thumbnailUrl: undefined,
            views: 8900,
            likes: 180,
            comments: 124,
            shares: 23,
            datePosted: '2023-06-07T00:00:00Z',
            postUrl: 'https://twitter.com/username/status/example2'
          }
        ]
      },
      // Facebook data
      '1:facebook:7': {
        platform: 'facebook',
        followers: 15400,
        followersGrowth: 0.9,
        views: 42800,
        viewsGrowth: 3.8,
        engagement: 6100,
        engagementGrowth: 2.1,
        lastUpdated: new Date().toISOString(),
        posts: [
          {
            id: 'fb1',
            platform: 'facebook',
            title: 'Join us for our upcoming webinar on "Social Media Trends for 2023"! Register now.',
            thumbnailUrl: 'https://via.placeholder.com/56x40',
            views: 5600,
            likes: 124,
            comments: 36,
            shares: 18,
            datePosted: '2023-06-06T00:00:00Z',
            postUrl: 'https://facebook.com/posts/example1'
          },
          {
            id: 'fb2',
            platform: 'facebook',
            title: 'Check out our latest blog post on maximizing your social media ROI!',
            thumbnailUrl: 'https://via.placeholder.com/56x40',
            views: 4200,
            likes: 98,
            comments: 28,
            shares: 15,
            datePosted: '2023-06-05T00:00:00Z',
            postUrl: 'https://facebook.com/posts/example2'
          }
        ]
      }
    };
    
    // Also add 30-day data
    const thirtyDayData = JSON.parse(JSON.stringify(sampleData));
    Object.keys(thirtyDayData).forEach(key => {
      const newKey = key.replace(':7', ':30');
      const stats = thirtyDayData[key];
      
      // Scale up the numbers for 30-day period
      stats.followers *= 1;
      stats.views *= 4.5;
      stats.engagement *= 4.2;
      
      // Add more posts
      const morePosts = [...stats.posts];
      for (let i = 0; i < 6; i++) {
        const post = JSON.parse(JSON.stringify(stats.posts[i % stats.posts.length]));
        post.id = `${post.id}-${i+3}`;
        post.views = Math.floor(post.views * 0.8);
        post.likes = Math.floor(post.likes * 0.7);
        post.comments = Math.floor(post.comments * 0.75);
        post.shares = Math.floor(post.shares * 0.7);
        
        // Adjust date to be older
        const postDate = new Date(post.datePosted);
        postDate.setDate(postDate.getDate() - (i + 3) * 2);
        post.datePosted = postDate.toISOString();
        
        morePosts.push(post);
      }
      stats.posts = morePosts;
      
      this.socialStats.set(newKey, stats);
    });
    
    // Add sample data to the map
    Object.entries(sampleData).forEach(([key, value]) => {
      this.socialStats.set(key, value);
    });
  }
}

export const storage = new MemStorage();
