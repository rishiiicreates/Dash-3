import { SocialStats, SocialPost, Platform } from "@shared/schema";
import { storage } from "../storage";

// Extend the SocialStats type to include error information
interface ExtendedSocialStats extends SocialStats {
  errorMessage?: string;
  isApiError?: boolean;
}

// Base interface for all social media API services
interface SocialMediaApiService {
  getPlatformStats(userId: number, apiKey: string, days: number): Promise<ExtendedSocialStats>;
  getPosts(userId: number, apiKey: string, days: number): Promise<SocialPost[]>;
}

// YouTube API service
class YouTubeApiService implements SocialMediaApiService {
  async getPlatformStats(userId: number, apiKey: string, days: number): Promise<ExtendedSocialStats> {
    try {
      console.log(`Fetching YouTube stats for user ${userId} with days=${days}`);
      
      if (!apiKey) {
        throw new Error("YouTube API key is required");
      }
      
      // Calculate dates
      const endDate = new Date();
      const startDate = new Date();
      startDate.setDate(startDate.getDate() - days);
      
      // YouTube Data API v3 endpoints
      const baseUrl = "https://www.googleapis.com/youtube/v3";
      
      // Fetch channel information (requires channel ID - we'd get this from user data or a separate API call)
      // For demonstration, we'll use a sample channel ID
      const channelId = "UC_x5XG1OV2P6uZZ5FSM9Ttw"; // Google Developers channel as example
      
      // Build API URLs
      const channelUrl = `${baseUrl}/channels?part=statistics,snippet&id=${channelId}&key=${apiKey}`;
      
      // Fetch channel data
      const channelResponse = await fetch(channelUrl);
      
      if (!channelResponse.ok) {
        const errorData = await channelResponse.json();
        console.error("YouTube API error:", errorData);
        throw new Error(`YouTube API error: ${errorData.error?.message || 'Unknown error'}`);
      }
      
      const channelData = await channelResponse.json();
      
      if (!channelData.items || channelData.items.length === 0) {
        throw new Error("Channel not found");
      }
      
      const channel = channelData.items[0];
      const { statistics, snippet } = channel;
      
      // Fetch most recent videos
      const videosUrl = `${baseUrl}/search?part=snippet&channelId=${channelId}&maxResults=10&order=date&type=video&key=${apiKey}`;
      const videosResponse = await fetch(videosUrl);
      
      if (!videosResponse.ok) {
        const errorData = await videosResponse.json();
        console.error("YouTube videos API error:", errorData);
        throw new Error(`YouTube API error: ${errorData.error?.message || 'Unknown error'}`);
      }
      
      const videosData = await videosResponse.json();
      
      // Get video IDs for detailed statistics
      const videoIds = videosData.items.map((item: any) => item.id.videoId).join(',');
      
      // Fetch video statistics
      const videoStatsUrl = `${baseUrl}/videos?part=statistics&id=${videoIds}&key=${apiKey}`;
      const videoStatsResponse = await fetch(videoStatsUrl);
      
      if (!videoStatsResponse.ok) {
        const errorData = await videoStatsResponse.json();
        console.error("YouTube video stats API error:", errorData);
        throw new Error(`YouTube API error: ${errorData.error?.message || 'Unknown error'}`);
      }
      
      const videoStatsData = await videoStatsResponse.json();
      
      // Create posts array
      const posts: SocialPost[] = videosData.items.map((item: any, index: number) => {
        const videoStats = videoStatsData.items[index]?.statistics || { viewCount: 0, likeCount: 0, commentCount: 0 };
        
        return {
          id: item.id.videoId,
          platform: 'youtube',
          title: item.snippet.title,
          thumbnailUrl: item.snippet.thumbnails.default.url,
          views: parseInt(videoStats.viewCount, 10) || 0,
          likes: parseInt(videoStats.likeCount, 10) || 0,
          comments: parseInt(videoStats.commentCount, 10) || 0,
          shares: 0, // YouTube API doesn't provide share counts
          datePosted: item.snippet.publishedAt,
          postUrl: `https://youtube.com/watch?v=${item.id.videoId}`
        };
      });
      
      // Calculate growth (in a real app, we would compare to previous period data)
      // For demo purposes, we'll generate random growth numbers
      const getRandomGrowth = () => Math.floor(Math.random() * 10) - 2; // Random number between -2 and 8
      
      return {
        platform: 'youtube',
        followers: parseInt(statistics.subscriberCount, 10) || 0,
        followersGrowth: getRandomGrowth(),
        views: parseInt(statistics.viewCount, 10) || 0,
        viewsGrowth: getRandomGrowth(),
        engagement: parseInt(statistics.commentCount, 10) || 0,
        engagementGrowth: getRandomGrowth(),
        posts,
        lastUpdated: new Date().toISOString()
      };
    } catch (error) {
      console.error("YouTube API service error:", error);
      
      // Return mock data for demo if API fails
      // In a production app, we would handle this more gracefully
      const existingData = await storage.getPlatformStats(userId, 'youtube', days);
      if (existingData) {
        return {
          ...existingData,
          lastUpdated: new Date().toISOString(),
          errorMessage: error instanceof Error ? error.message : 'Unknown error',
          isApiError: true
        };
      }
      
      throw error;
    }
  }
  
  async getPosts(userId: number, apiKey: string, days: number): Promise<SocialPost[]> {
    const stats = await this.getPlatformStats(userId, apiKey, days);
    return stats.posts;
  }
}

// Twitter API service
class TwitterApiService implements SocialMediaApiService {
  async getPlatformStats(userId: number, apiKey: string, days: number): Promise<ExtendedSocialStats> {
    try {
      console.log(`Fetching Twitter stats for user ${userId} with days=${days}`);
      
      if (!apiKey) {
        throw new Error("Twitter API key is required");
      }
      
      // Twitter API v2 endpoints
      const baseUrl = "https://api.twitter.com/2";
      
      // In a real implementation, we would:
      // 1. Use the Twitter API to fetch user data, tweets, and metrics
      // 2. The apiKey here would actually be an OAuth token
      // 3. Make API calls to the Twitter API
      
      // Simplified implementation (in reality, we would make actual API calls)
      throw new Error("Twitter API implementation in progress");
      
    } catch (error) {
      console.error("Twitter API service error:", error);
      
      // Return mock data for demo if API fails
      const existingData = await storage.getPlatformStats(userId, 'twitter', days);
      if (existingData) {
        return {
          ...existingData,
          lastUpdated: new Date().toISOString(),
          errorMessage: error instanceof Error ? error.message : 'Unknown error',
          isApiError: true
        };
      }
      
      throw error;
    }
  }
  
  async getPosts(userId: number, apiKey: string, days: number): Promise<SocialPost[]> {
    const stats = await this.getPlatformStats(userId, apiKey, days);
    return stats.posts;
  }
}

// Instagram API service
class InstagramApiService implements SocialMediaApiService {
  async getPlatformStats(userId: number, apiKey: string, days: number): Promise<ExtendedSocialStats> {
    try {
      console.log(`Fetching Instagram stats for user ${userId} with days=${days}`);
      
      if (!apiKey) {
        throw new Error("Instagram API key is required");
      }
      
      // Instagram API endpoints (via Facebook Graph API)
      const baseUrl = "https://graph.facebook.com/v18.0";
      
      // In a real implementation, we would:
      // 1. Use the Facebook Graph API to fetch Instagram business account data
      // 2. The apiKey here would actually be an OAuth token
      // 3. Make API calls to the Facebook Graph API
      
      // Simplified implementation (in reality, we would make actual API calls)
      throw new Error("Instagram API implementation in progress");
      
    } catch (error) {
      console.error("Instagram API service error:", error);
      
      // Return mock data for demo if API fails
      const existingData = await storage.getPlatformStats(userId, 'instagram', days);
      if (existingData) {
        return {
          ...existingData,
          lastUpdated: new Date().toISOString(),
          errorMessage: error instanceof Error ? error.message : 'Unknown error',
          isApiError: true
        };
      }
      
      throw error;
    }
  }
  
  async getPosts(userId: number, apiKey: string, days: number): Promise<SocialPost[]> {
    const stats = await this.getPlatformStats(userId, apiKey, days);
    return stats.posts;
  }
}

// Facebook API service
class FacebookApiService implements SocialMediaApiService {
  async getPlatformStats(userId: number, apiKey: string, days: number): Promise<ExtendedSocialStats> {
    try {
      console.log(`Fetching Facebook stats for user ${userId} with days=${days}`);
      
      if (!apiKey) {
        throw new Error("Facebook API key is required");
      }
      
      // Facebook Graph API endpoints
      const baseUrl = "https://graph.facebook.com/v18.0";
      
      // In a real implementation, we would:
      // 1. Use the Facebook Graph API to fetch page/profile data
      // 2. The apiKey here would actually be an OAuth token
      // 3. Make API calls to the Facebook Graph API
      
      // Simplified implementation (in reality, we would make actual API calls)
      throw new Error("Facebook API implementation in progress");
      
    } catch (error) {
      console.error("Facebook API service error:", error);
      
      // Return mock data for demo if API fails
      const existingData = await storage.getPlatformStats(userId, 'facebook', days);
      if (existingData) {
        return {
          ...existingData,
          lastUpdated: new Date().toISOString(),
          errorMessage: error instanceof Error ? error.message : 'Unknown error',
          isApiError: true
        };
      }
      
      throw error;
    }
  }
  
  async getPosts(userId: number, apiKey: string, days: number): Promise<SocialPost[]> {
    const stats = await this.getPlatformStats(userId, apiKey, days);
    return stats.posts;
  }
}

// Factory for creating API service instances
class SocialMediaApiServiceFactory {
  static getService(platform: Platform): SocialMediaApiService {
    switch (platform) {
      case 'youtube':
        return new YouTubeApiService();
      case 'twitter':
        return new TwitterApiService();
      case 'instagram':
        return new InstagramApiService();
      case 'facebook':
        return new FacebookApiService();
      default:
        throw new Error(`Unsupported platform: ${platform}`);
    }
  }
}

export { SocialMediaApiServiceFactory, ExtendedSocialStats };