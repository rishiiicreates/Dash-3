import { useState } from "react";
import { useForm } from "react-hook-form";
import { z } from "zod";
import { zodResolver } from "@hookform/resolvers/zod";
import { apiRequest } from "@/lib/queryClient";
import { useAuth } from "@/hooks/useAuth";
import { useToast } from "@/hooks/use-toast";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Form, FormControl, FormField, FormItem, FormLabel, FormMessage } from "@/components/ui/form";
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle } from "@/components/ui/dialog";

interface ApiKeysFormProps {
  isOpen: boolean;
  onClose: () => void;
}

const apiKeySchema = z.object({
  youtubeKey: z.string().optional(),
  instagramKey: z.string().optional(),
  twitterKey: z.string().optional(),
  facebookKey: z.string().optional(),
});

type ApiKeyFormValues = z.infer<typeof apiKeySchema>;

export default function ApiKeysForm({ isOpen, onClose }: ApiKeysFormProps) {
  const { user } = useAuth();
  const [isSubmitting, setIsSubmitting] = useState(false);
  const { toast } = useToast();
  
  const form = useForm<ApiKeyFormValues>({
    resolver: zodResolver(apiKeySchema),
    defaultValues: {
      youtubeKey: "",
      instagramKey: "",
      twitterKey: "",
      facebookKey: "",
    },
  });
  
  const onSubmit = async (values: ApiKeyFormValues) => {
    if (!user?.id) {
      toast({
        title: "Error",
        description: "User ID not found. Please try logging in again.",
        variant: "destructive",
      });
      return;
    }
    
    setIsSubmitting(true);
    
    try {
      const response = await apiRequest("POST", "/api/apikeys", {
        userId: user.id,
        ...values,
      });
      
      if (response.ok) {
        toast({
          title: "Success",
          description: "Your API keys have been saved.",
        });
        onClose();
      } else {
        const error = await response.json();
        throw new Error(error.message || "Failed to save API keys");
      }
    } catch (error) {
      toast({
        title: "Error",
        description: error instanceof Error ? error.message : "Failed to save API keys",
        variant: "destructive",
      });
    } finally {
      setIsSubmitting(false);
    }
  };
  
  const handleSkip = () => {
    toast({
      title: "Skipped",
      description: "You can connect your accounts later in Settings.",
    });
    onClose();
  };
  
  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className="sm:max-w-[500px]">
        <DialogHeader>
          <DialogTitle className="text-xl">Connect Your Accounts</DialogTitle>
          <DialogDescription>
            To get started with DashMetrics, connect your social media accounts by entering your API keys.
          </DialogDescription>
        </DialogHeader>
        
        <Form {...form}>
          <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-4 mt-4">
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
            
            <p className="text-sm text-gray-500 mt-2">
              Don't have API keys?{" "}
              <a href="#" className="text-primary font-medium">
                Learn how to get them
              </a>
            </p>
            
            <DialogFooter className="mt-6">
              <Button type="button" variant="outline" onClick={handleSkip}>
                Skip for Now
              </Button>
              <Button type="submit" disabled={isSubmitting}>
                {isSubmitting ? (
                  <>
                    <div className="h-4 w-4 mr-2 rounded-full border-2 border-t-transparent animate-spin"></div>
                    Connecting...
                  </>
                ) : (
                  "Connect Accounts"
                )}
              </Button>
            </DialogFooter>
          </form>
        </Form>
      </DialogContent>
    </Dialog>
  );
}
