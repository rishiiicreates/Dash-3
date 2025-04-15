import { useState, useEffect } from "react";
import { useAuth } from "@/hooks/useAuth";
import { useQuery, useMutation } from "@tanstack/react-query";
import { apiRequest } from "@/lib/queryClient";
import { queryClient } from "@/lib/queryClient";
import { useToast } from "@/hooks/use-toast";
import { z } from "zod";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Form, FormControl, FormField, FormItem, FormLabel, FormMessage } from "@/components/ui/form";
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from "@/components/ui/card";
import { getPlatformIcon } from "@/lib/utils";

// API keys form schema
const apiKeysSchema = z.object({
  youtubeKey: z.string().optional(),
  instagramKey: z.string().optional(),
  twitterKey: z.string().optional(),
  facebookKey: z.string().optional(),
});

type ApiKeysFormValues = z.infer<typeof apiKeysSchema>;

export default function Connections() {
  const { user } = useAuth();
  const { toast } = useToast();
  const [isLoading, setIsLoading] = useState(false);
  
  // Fetch existing API keys
  const { data: apiKeys, isLoading: isLoadingKeys } = useQuery({
    queryKey: ['/api/apikeys', user?.id],
    queryFn: async () => {
      if (!user?.id) return null;
      const res = await fetch(`/api/apikeys?userId=${user.id}`);
      if (!res.ok) {
        if (res.status === 404) {
          return null; // No API keys yet, not an error
        }
        throw new Error('Failed to fetch API keys');
      }
      return res.json();
    },
    enabled: !!user?.id,
  });
  
  // Mutation to save API keys
  const saveApiKeysMutation = useMutation({
    mutationFn: async (data: ApiKeysFormValues) => {
      if (!user?.id) throw new Error('User ID not found');
      const payload = {
        userId: user.id,
        ...data,
      };
      
      return apiRequest('POST', '/api/apikeys', payload);
    },
    onSuccess: () => {
      toast({
        title: 'API Keys Saved',
        description: 'Your social media connections have been updated.',
      });
      
      // Invalidate queries to refetch data
      queryClient.invalidateQueries({ queryKey: ['/api/apikeys'] });
    },
    onError: (error) => {
      toast({
        title: 'Error',
        description: error instanceof Error ? error.message : 'Failed to save API keys',
        variant: 'destructive',
      });
    },
  });
  
  // API keys form
  const form = useForm<ApiKeysFormValues>({
    resolver: zodResolver(apiKeysSchema),
    defaultValues: {
      youtubeKey: apiKeys?.youtubeKey || '',
      instagramKey: apiKeys?.instagramKey || '',
      twitterKey: apiKeys?.twitterKey || '',
      facebookKey: apiKeys?.facebookKey || '',
    },
  });
  
  // Update form when API keys are fetched
  useEffect(() => {
    if (apiKeys) {
      form.reset({
        youtubeKey: apiKeys.youtubeKey || '',
        instagramKey: apiKeys.instagramKey || '',
        twitterKey: apiKeys.twitterKey || '',
        facebookKey: apiKeys.facebookKey || '',
      });
    }
  }, [apiKeys, form]);
  
  // Handle form submission
  const onSubmit = async (values: ApiKeysFormValues) => {
    setIsLoading(true);
    try {
      await saveApiKeysMutation.mutateAsync(values);
    } finally {
      setIsLoading(false);
    }
  };
  
  return (
    <>
      {/* Page header */}
      <div className="flex items-center justify-between mb-6">
        <h1 className="text-2xl font-semibold text-gray-800">Social Media Connections</h1>
      </div>
      
      {/* Connection status cards */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4 mb-8">
        {['youtube', 'instagram', 'twitter', 'facebook'].map((platform) => {
          const isConnected = apiKeys && apiKeys[`${platform}Key`];
          
          return (
            <Card key={platform} className={isConnected ? 'border-green-200' : 'border-gray-200'}>
              <CardContent className="p-6">
                <div className="flex justify-between items-center">
                  <div className="flex items-center">
                    <i className={`${getPlatformIcon(platform)} text-xl platform-icon-${platform} mr-2`}></i>
                    <span className="font-medium capitalize">{platform}</span>
                  </div>
                  <span className={`text-xs font-medium px-2 py-1 rounded-full ${
                    isConnected 
                      ? 'bg-green-100 text-green-800' 
                      : 'bg-gray-100 text-gray-800'
                  }`}>
                    {isConnected ? 'Connected' : 'Not Connected'}
                  </span>
                </div>
                
                {isConnected && (
                  <div className="mt-4 text-sm text-gray-500">
                    <p>API Key: •••••••••{apiKeys[`${platform}Key`].substring(apiKeys[`${platform}Key`].length - 5)}</p>
                    <p className="mt-1">Connected on: {new Date().toLocaleDateString()}</p>
                  </div>
                )}
              </CardContent>
            </Card>
          );
        })}
      </div>
      
      {/* API Keys form */}
      <Card>
        <CardHeader>
          <CardTitle>Manage API Keys</CardTitle>
          <CardDescription>
            Connect your social media accounts by entering your API keys below.
            These keys are securely stored and used to fetch your analytics data.
          </CardDescription>
        </CardHeader>
        <CardContent>
          {isLoadingKeys ? (
            <div className="flex justify-center py-8">
              <div className="animate-spin rounded-full h-8 w-8 border-t-2 border-b-2 border-primary"></div>
            </div>
          ) : (
            <Form {...form}>
              <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-6">
                <div className="space-y-4">
                  <FormField
                    control={form.control}
                    name="youtubeKey"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel className="flex items-center">
                          <i className="ri-youtube-line text-youtube mr-2"></i>
                          YouTube API Key
                        </FormLabel>
                        <FormControl>
                          <Input placeholder="Enter your YouTube API key" {...field} />
                        </FormControl>
                        <FormMessage />
                      </FormItem>
                    )}
                  />
                  
                  <FormField
                    control={form.control}
                    name="instagramKey"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel className="flex items-center">
                          <i className="ri-instagram-line text-instagram mr-2"></i>
                          Instagram API Key
                        </FormLabel>
                        <FormControl>
                          <Input placeholder="Enter your Instagram API key" {...field} />
                        </FormControl>
                        <FormMessage />
                      </FormItem>
                    )}
                  />
                  
                  <FormField
                    control={form.control}
                    name="twitterKey"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel className="flex items-center">
                          <i className="ri-twitter-x-line text-twitter mr-2"></i>
                          Twitter/X API Key
                        </FormLabel>
                        <FormControl>
                          <Input placeholder="Enter your Twitter/X API key" {...field} />
                        </FormControl>
                        <FormMessage />
                      </FormItem>
                    )}
                  />
                  
                  <FormField
                    control={form.control}
                    name="facebookKey"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel className="flex items-center">
                          <i className="ri-facebook-circle-line text-facebook mr-2"></i>
                          Facebook API Key
                        </FormLabel>
                        <FormControl>
                          <Input placeholder="Enter your Facebook API key" {...field} />
                        </FormControl>
                        <FormMessage />
                      </FormItem>
                    )}
                  />
                </div>
                
                <div className="pt-4 text-sm text-gray-500">
                  <p>
                    Don't have API keys?{" "}
                    <a href="#" className="text-primary font-medium">
                      Learn how to get them
                    </a>
                  </p>
                </div>
                
                <Button type="submit" className="w-full" disabled={isLoading || saveApiKeysMutation.isPending}>
                  {(isLoading || saveApiKeysMutation.isPending) ? (
                    <>
                      <div className="h-4 w-4 mr-2 rounded-full border-2 border-t-transparent animate-spin"></div>
                      Saving...
                    </>
                  ) : (
                    'Save API Keys'
                  )}
                </Button>
              </form>
            </Form>
          )}
        </CardContent>
      </Card>
      
      {/* How to get API keys guide */}
      <Card className="mt-8">
        <CardHeader>
          <CardTitle>How to Get API Keys</CardTitle>
          <CardDescription>
            Follow these steps to obtain API keys for each platform
          </CardDescription>
        </CardHeader>
        <CardContent>
          <div className="space-y-6">
            <div>
              <h3 className="text-lg font-medium flex items-center">
                <i className="ri-youtube-line text-youtube mr-2"></i>
                YouTube
              </h3>
              <ol className="mt-2 ml-6 list-decimal text-sm text-gray-600 space-y-1">
                <li>Go to the <a href="https://console.developers.google.com/" target="_blank" rel="noopener noreferrer" className="text-primary">Google Developers Console</a></li>
                <li>Create a new project or select an existing one</li>
                <li>Enable the YouTube Data API v3</li>
                <li>Go to Credentials and create an API key</li>
                <li>Copy the API key and paste it above</li>
              </ol>
            </div>
            
            <div>
              <h3 className="text-lg font-medium flex items-center">
                <i className="ri-instagram-line text-instagram mr-2"></i>
                Instagram
              </h3>
              <ol className="mt-2 ml-6 list-decimal text-sm text-gray-600 space-y-1">
                <li>Go to <a href="https://developers.facebook.com/" target="_blank" rel="noopener noreferrer" className="text-primary">Facebook for Developers</a></li>
                <li>Create a new app or select an existing one</li>
                <li>Add the Instagram Graph API to your app</li>
                <li>Set up the Instagram Basic Display</li>
                <li>Generate an access token and paste it above</li>
              </ol>
            </div>
            
            <div>
              <h3 className="text-lg font-medium flex items-center">
                <i className="ri-twitter-x-line text-twitter mr-2"></i>
                Twitter/X
              </h3>
              <ol className="mt-2 ml-6 list-decimal text-sm text-gray-600 space-y-1">
                <li>Go to the <a href="https://developer.twitter.com/" target="_blank" rel="noopener noreferrer" className="text-primary">Twitter Developer Portal</a></li>
                <li>Create a new project and app</li>
                <li>Apply for Elevated access if needed</li>
                <li>Generate a Bearer token in the "Keys and Tokens" section</li>
                <li>Copy the Bearer token and paste it above</li>
              </ol>
            </div>
            
            <div>
              <h3 className="text-lg font-medium flex items-center">
                <i className="ri-facebook-circle-line text-facebook mr-2"></i>
                Facebook
              </h3>
              <ol className="mt-2 ml-6 list-decimal text-sm text-gray-600 space-y-1">
                <li>Go to <a href="https://developers.facebook.com/" target="_blank" rel="noopener noreferrer" className="text-primary">Facebook for Developers</a></li>
                <li>Create a new app or select an existing one</li>
                <li>Add the Marketing API to your app</li>
                <li>Go to Tools &gt; Graph API Explorer</li>
                <li>Select your app and generate a token with appropriate permissions</li>
                <li>Copy the access token and paste it above</li>
              </ol>
            </div>
          </div>
        </CardContent>
      </Card>
    </>
  );
}
