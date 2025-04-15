import type { Express, Request, Response, NextFunction } from "express";
import { createServer, type Server } from "http";
import { storage } from "./storage";
import { z } from "zod";
import { insertApiKeySchema, insertSubscriptionSchema, insertUserSchema } from "@shared/schema";
import { razorpayService } from "./services/razorpay";

export async function registerRoutes(app: Express): Promise<Server> {
  // Get user profile
  app.get('/api/user', async (req: Request, res: Response) => {
    // In a real app, this would use the session/auth token
    const userId = Number(req.query.userId) || 1;
    
    const user = await storage.getUser(userId);
    if (!user) {
      return res.status(404).json({ message: 'User not found' });
    }
    
    // Don't return sensitive information
    const { password, ...userProfile } = user;
    res.json(userProfile);
  });

  // Auth check endpoint (mock)
  app.get('/api/auth/check', async (req: Request, res: Response) => {
    // In a real app, this would verify the session/token
    const firebaseUid = req.query.firebaseUid as string;
    
    if (!firebaseUid) {
      return res.status(401).json({ authenticated: false });
    }
    
    const user = await storage.getUserByFirebaseUid(firebaseUid);
    if (!user) {
      return res.status(401).json({ authenticated: false });
    }
    
    // Don't return sensitive information
    const { password, ...userProfile } = user;
    res.json({ authenticated: true, user: userProfile });
  });

  // Create or update user
  app.post('/api/user', async (req: Request, res: Response) => {
    try {
      const userData = req.body;
      
      // Validate with Zod
      const validatedData = insertUserSchema.parse(userData);
      
      // Check if user already exists
      const existingUser = await storage.getUserByFirebaseUid(validatedData.firebaseUid);
      
      if (existingUser) {
        // Update existing user
        const updatedUser = await storage.updateUser(existingUser.id, {
          ...validatedData,
          lastLogin: new Date()
        });
        
        if (!updatedUser) {
          return res.status(404).json({ message: 'Failed to update user' });
        }
        
        const { password, ...userProfile } = updatedUser;
        return res.json(userProfile);
      }
      
      // Create new user
      const newUser = await storage.createUser(validatedData);
      const { password, ...userProfile } = newUser;
      
      res.status(201).json(userProfile);
    } catch (error) {
      if (error instanceof z.ZodError) {
        return res.status(400).json({ message: 'Invalid user data', errors: error.errors });
      }
      res.status(500).json({ message: 'Failed to create user' });
    }
  });

  // Save API keys
  app.post('/api/apikeys', async (req: Request, res: Response) => {
    try {
      const apiKeyData = req.body;
      
      // Validate with Zod
      const validatedData = insertApiKeySchema.parse(apiKeyData);
      
      // Check if API keys already exist for this user
      const existingApiKeys = await storage.getApiKeys(validatedData.userId);
      
      if (existingApiKeys) {
        // Update existing API keys
        const updatedApiKeys = await storage.updateApiKeys(
          validatedData.userId,
          validatedData
        );
        
        if (!updatedApiKeys) {
          return res.status(404).json({ message: 'Failed to update API keys' });
        }
        
        return res.json(updatedApiKeys);
      }
      
      // Create new API keys
      const newApiKeys = await storage.saveApiKeys(validatedData);
      
      // Update user to not show first login screen anymore
      await storage.updateUser(validatedData.userId, { isFirstLogin: false });
      
      res.status(201).json(newApiKeys);
    } catch (error) {
      if (error instanceof z.ZodError) {
        return res.status(400).json({ message: 'Invalid API key data', errors: error.errors });
      }
      res.status(500).json({ message: 'Failed to save API keys' });
    }
  });

  // Get API keys for a user
  app.get('/api/apikeys', async (req: Request, res: Response) => {
    const userId = Number(req.query.userId);
    
    if (!userId) {
      return res.status(400).json({ message: 'User ID is required' });
    }
    
    const apiKeys = await storage.getApiKeys(userId);
    
    if (!apiKeys) {
      return res.status(404).json({ message: 'API keys not found' });
    }
    
    res.json(apiKeys);
  });

  // Get platform stats
  app.get('/api/stats', async (req: Request, res: Response) => {
    const userId = Number(req.query.userId) || 1;
    const days = Number(req.query.days) || 7;
    const platform = req.query.platform as string;
    
    // Check if user is on free plan and trying to access data older than 7 days
    const user = await storage.getUser(userId);
    
    if (!user) {
      return res.status(404).json({ message: 'User not found' });
    }
    
    // Free users can only access 7 days of data
    if (!user.isPro && days > 7) {
      return res.status(403).json({ 
        message: 'Free users can only access 7 days of data',
        upgrade: true
      });
    }
    
    if (platform && platform !== 'all') {
      // Get stats for specific platform
      const stats = await storage.getPlatformStats(userId, platform as any, days);
      
      if (!stats) {
        return res.status(404).json({ message: `No stats found for ${platform}` });
      }
      
      res.json(stats);
    } else {
      // Get stats for all platforms
      const allStats = await storage.getAllPlatformStats(userId, days);
      res.json(allStats);
    }
  });

  // Get posts
  app.get('/api/posts', async (req: Request, res: Response) => {
    const userId = Number(req.query.userId) || 1;
    const days = Number(req.query.days) || 7;
    const platform = (req.query.platform as string) || 'all';
    const page = Number(req.query.page) || 1;
    const limit = Number(req.query.limit) || 10;
    
    // Check if user is on free plan and trying to access data older than 7 days
    const user = await storage.getUser(userId);
    
    if (!user) {
      return res.status(404).json({ message: 'User not found' });
    }
    
    // Free users can only access 7 days of data
    if (!user.isPro && days > 7) {
      return res.status(403).json({ 
        message: 'Free users can only access 7 days of data',
        upgrade: true
      });
    }
    
    const { posts, total } = await storage.getPosts(userId, platform as any, days, page, limit);
    
    res.json({
      posts,
      pagination: {
        page,
        limit,
        total,
        totalPages: Math.ceil(total / limit)
      }
    });
  });

  // Create Razorpay order
  app.post('/api/orders', async (req: Request, res: Response) => {
    try {
      const { plan } = req.body;
      
      if (!plan) {
        return res.status(400).json({ message: 'Plan is required' });
      }
      
      // Determine amount based on plan
      let amount;
      if (plan === 'monthly') {
        amount = 9.99; // $9.99 for monthly
      } else if (plan === 'annual') {
        amount = 89.99; // $89.99 for annual
      } else {
        return res.status(400).json({ message: 'Invalid plan type' });
      }
      
      // Create an order in Razorpay
      const order = await razorpayService.createOrder({
        amount: razorpayService.calculateAmount(amount),
        currency: 'USD',
        receipt: `order_rcpt_${Date.now()}`,
        notes: {
          plan: plan
        }
      });
      
      res.json({
        id: order.id,
        amount: order.amount,
        currency: order.currency
      });
    } catch (error) {
      console.error('Order creation error:', error);
      res.status(500).json({ 
        message: 'Failed to create order',
        error: error instanceof Error ? error.message : 'Unknown error'
      });
    }
  });

  // Verify payment and create subscription
  app.post('/api/subscription', async (req: Request, res: Response) => {
    try {
      const { userId, plan, paymentId, orderId, signature } = req.body;
      
      if (!userId || !plan || !paymentId || !orderId) {
        return res.status(400).json({ message: 'Missing required fields' });
      }
      
      // Verify payment signature if provided
      if (signature) {
        const isValid = razorpayService.verifyPaymentSignature({
          order_id: orderId,
          payment_id: paymentId,
          signature
        });
        
        if (!isValid) {
          return res.status(400).json({ message: 'Invalid payment signature' });
        }
      }
      
      // Calculate subscription dates based on plan
      const startDate = new Date();
      const endDate = new Date();
      
      if (plan === 'monthly') {
        endDate.setMonth(endDate.getMonth() + 1);
      } else if (plan === 'annual') {
        endDate.setFullYear(endDate.getFullYear() + 1);
      } else {
        return res.status(400).json({ message: 'Invalid plan type' });
      }
      
      // Create subscription
      const subscription = await storage.createSubscription({
        userId,
        plan,
        paymentId,
        startDate,
        endDate,
        status: 'active'
      });
      
      // Update user to pro
      await storage.updateUser(userId, { isPro: true });
      
      res.status(201).json(subscription);
    } catch (error) {
      console.error('Subscription creation error:', error);
      res.status(500).json({ 
        message: 'Failed to create subscription',
        error: error instanceof Error ? error.message : 'Unknown error'
      });
    }
  });

  // Get a user's subscription
  app.get('/api/subscription', async (req: Request, res: Response) => {
    const userId = Number(req.query.userId);
    
    if (!userId) {
      return res.status(400).json({ message: 'User ID is required' });
    }
    
    const subscription = await storage.getSubscription(userId);
    
    if (!subscription) {
      return res.status(404).json({ message: 'No active subscription found' });
    }
    
    res.json(subscription);
  });

  const httpServer = createServer(app);
  return httpServer;
}
