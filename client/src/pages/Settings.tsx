import { useState, useEffect } from "react";
import { useAuth } from "@/hooks/useAuth";
import { apiRequest } from "@/lib/queryClient";
import { queryClient } from "@/lib/queryClient";
import { useToast } from "@/hooks/use-toast";
import { z } from "zod";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Form, FormControl, FormField, FormItem, FormLabel, FormMessage } from "@/components/ui/form";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Switch } from "@/components/ui/switch";
import { Label } from "@/components/ui/label";
import UpgradeModal from "@/components/payment/UpgradeModal";

// Profile form schema
const profileSchema = z.object({
  username: z.string().min(3, { message: "Username must be at least 3 characters" }),
  email: z.string().email({ message: "Please enter a valid email address" }).optional(),
  avatarUrl: z.string().url({ message: "Please enter a valid URL" }).optional().or(z.literal('')),
});

type ProfileFormValues = z.infer<typeof profileSchema>;

export default function Settings() {
  const { user, refreshUser, signOut } = useAuth();
  const { toast } = useToast();
  const [isLoading, setIsLoading] = useState(false);
  const [upgradeModalOpen, setUpgradeModalOpen] = useState(false);
  
  // Profile form
  const form = useForm<ProfileFormValues>({
    resolver: zodResolver(profileSchema),
    defaultValues: {
      username: user?.username || '',
      email: user?.email || '',
      avatarUrl: user?.avatarUrl || '',
    },
  });
  
  // Update form values when user data changes
  useEffect(() => {
    if (user) {
      form.reset({
        username: user.username || '',
        email: user.email || '',
        avatarUrl: user.avatarUrl || '',
      });
    }
  }, [user, form]);
  
  // Handle profile form submission
  const onSubmit = async (values: ProfileFormValues) => {
    if (!user?.id) return;
    
    setIsLoading(true);
    try {
      await apiRequest('POST', '/api/user', {
        ...values,
        id: user.id,
        firebaseUid: user.firebaseUid,
      });
      
      await refreshUser();
      
      toast({
        title: "Profile Updated",
        description: "Your profile has been updated successfully.",
      });
    } catch (error) {
      toast({
        title: "Error",
        description: "Failed to update profile. Please try again.",
        variant: "destructive",
      });
    } finally {
      setIsLoading(false);
    }
  };
  
  // Handle sign out
  const handleSignOut = async () => {
    try {
      await signOut();
      toast({
        title: "Signed Out",
        description: "You have been signed out successfully.",
      });
    } catch (error) {
      toast({
        title: "Error",
        description: "Failed to sign out. Please try again.",
        variant: "destructive",
      });
    }
  };
  
  return (
    <>
      {/* Page header */}
      <div className="flex items-center justify-between mb-6">
        <h1 className="text-2xl font-semibold text-gray-800">Settings</h1>
      </div>
      
      {/* Settings tabs */}
      <Tabs defaultValue="profile" className="mb-6">
        <TabsList>
          <TabsTrigger value="profile">Profile</TabsTrigger>
          <TabsTrigger value="subscription">Subscription</TabsTrigger>
          <TabsTrigger value="notifications">Notifications</TabsTrigger>
          <TabsTrigger value="security">Security</TabsTrigger>
        </TabsList>
        
        {/* Profile tab */}
        <TabsContent value="profile" className="mt-6">
          <Card>
            <CardHeader>
              <CardTitle>Profile Information</CardTitle>
              <CardDescription>
                Update your account details and profile settings
              </CardDescription>
            </CardHeader>
            <CardContent>
              <Form {...form}>
                <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-6">
                  <FormField
                    control={form.control}
                    name="username"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>Username</FormLabel>
                        <FormControl>
                          <Input placeholder="johndoe" {...field} />
                        </FormControl>
                        <FormMessage />
                      </FormItem>
                    )}
                  />
                  
                  <FormField
                    control={form.control}
                    name="email"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>Email</FormLabel>
                        <FormControl>
                          <Input placeholder="hello@example.com" {...field} disabled />
                        </FormControl>
                        <FormMessage />
                        <p className="text-sm text-gray-500">
                          Email cannot be changed. It is linked to your authentication.
                        </p>
                      </FormItem>
                    )}
                  />
                  
                  <FormField
                    control={form.control}
                    name="avatarUrl"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>Profile Picture URL</FormLabel>
                        <FormControl>
                          <Input placeholder="https://example.com/avatar.jpg" {...field} />
                        </FormControl>
                        <FormMessage />
                      </FormItem>
                    )}
                  />
                  
                  <div className="flex items-center gap-4">
                    <Button type="submit" disabled={isLoading}>
                      {isLoading ? (
                        <>
                          <div className="h-4 w-4 mr-2 rounded-full border-2 border-t-transparent animate-spin"></div>
                          Updating...
                        </>
                      ) : (
                        'Save Changes'
                      )}
                    </Button>
                    
                    <Button type="button" variant="outline" onClick={() => form.reset()}>
                      Cancel
                    </Button>
                  </div>
                </form>
              </Form>
            </CardContent>
          </Card>
          
          <Card className="mt-6">
            <CardHeader>
              <CardTitle>Account Actions</CardTitle>
              <CardDescription>
                Manage your account access and data
              </CardDescription>
            </CardHeader>
            <CardContent>
              <div className="space-y-4">
                <Button variant="outline" onClick={handleSignOut} className="w-full sm:w-auto">
                  Sign Out
                </Button>
                
                <Button variant="destructive" className="w-full sm:w-auto">
                  Delete Account
                </Button>
              </div>
            </CardContent>
          </Card>
        </TabsContent>
        
        {/* Subscription tab */}
        <TabsContent value="subscription" className="mt-6">
          <Card>
            <CardHeader>
              <CardTitle>Subscription Plan</CardTitle>
              <CardDescription>
                Manage your subscription and billing settings
              </CardDescription>
            </CardHeader>
            <CardContent>
              <div className="mb-6">
                <h3 className="text-lg font-medium mb-2">Current Plan</h3>
                <div className="bg-gray-50 p-4 rounded-lg border border-gray-200">
                  <div className="flex justify-between items-center">
                    <div>
                      <p className="font-medium">{user?.isPro ? 'Pro Plan' : 'Free Plan'}</p>
                      <p className="text-sm text-gray-500 mt-1">
                        {user?.isPro 
                          ? 'Full access to all features and historical data' 
                          : 'Limited to last 7 days of data'}
                      </p>
                    </div>
                    
                    {!user?.isPro && (
                      <Button onClick={() => setUpgradeModalOpen(true)}>
                        Upgrade to Pro
                      </Button>
                    )}
                  </div>
                </div>
              </div>
              
              {user?.isPro && (
                <div className="border-t border-gray-200 pt-6">
                  <h3 className="text-lg font-medium mb-2">Billing History</h3>
                  <div className="bg-gray-50 p-4 rounded-lg border border-gray-200">
                    <p className="text-sm text-gray-500">
                      Your last payment of $9.99 was processed on {new Date().toLocaleDateString()}.
                    </p>
                    <Button variant="outline" className="mt-4">
                      View Invoices
                    </Button>
                  </div>
                </div>
              )}
              
              {user?.isPro && (
                <div className="border-t border-gray-200 pt-6 mt-6">
                  <h3 className="text-lg font-medium mb-2">Cancel Subscription</h3>
                  <p className="text-sm text-gray-500 mb-4">
                    You can cancel your subscription at any time. You'll continue to have access to Pro features until the end of your billing period.
                  </p>
                  <Button variant="outline" className="text-red-600 border-red-200 hover:bg-red-50">
                    Cancel Subscription
                  </Button>
                </div>
              )}
            </CardContent>
          </Card>
        </TabsContent>
        
        {/* Notifications tab */}
        <TabsContent value="notifications" className="mt-6">
          <Card>
            <CardHeader>
              <CardTitle>Notification Preferences</CardTitle>
              <CardDescription>
                Manage how and when you receive notifications
              </CardDescription>
            </CardHeader>
            <CardContent>
              <div className="space-y-6">
                <div className="space-y-3">
                  <h3 className="font-medium">Email Notifications</h3>
                  
                  <div className="flex items-center justify-between">
                    <div className="space-y-0.5">
                      <Label htmlFor="email-analytics">Analytics Summaries</Label>
                      <p className="text-sm text-gray-500">Receive weekly summaries of your analytics</p>
                    </div>
                    <Switch id="email-analytics" defaultChecked />
                  </div>
                  
                  <div className="flex items-center justify-between">
                    <div className="space-y-0.5">
                      <Label htmlFor="email-performance">Performance Alerts</Label>
                      <p className="text-sm text-gray-500">Get notified when posts perform exceptionally well</p>
                    </div>
                    <Switch id="email-performance" defaultChecked />
                  </div>
                  
                  <div className="flex items-center justify-between">
                    <div className="space-y-0.5">
                      <Label htmlFor="email-product">Product Updates</Label>
                      <p className="text-sm text-gray-500">Receive updates about new features and improvements</p>
                    </div>
                    <Switch id="email-product" />
                  </div>
                </div>
                
                <div className="space-y-3 pt-6 border-t border-gray-200">
                  <h3 className="font-medium">System Notifications</h3>
                  
                  <div className="flex items-center justify-between">
                    <div className="space-y-0.5">
                      <Label htmlFor="browser-notifications">Browser Notifications</Label>
                      <p className="text-sm text-gray-500">Show notifications in your browser</p>
                    </div>
                    <Switch id="browser-notifications" defaultChecked />
                  </div>
                </div>
                
                <Button className="mt-6">Save Preferences</Button>
              </div>
            </CardContent>
          </Card>
        </TabsContent>
        
        {/* Security tab */}
        <TabsContent value="security" className="mt-6">
          <Card>
            <CardHeader>
              <CardTitle>Security Settings</CardTitle>
              <CardDescription>
                Manage your password and security preferences
              </CardDescription>
            </CardHeader>
            <CardContent>
              <div className="space-y-6">
                <div>
                  <h3 className="text-lg font-medium mb-2">Change Password</h3>
                  <div className="space-y-4">
                    <div className="grid gap-2">
                      <Label htmlFor="current-password">Current Password</Label>
                      <Input id="current-password" type="password" />
                    </div>
                    <div className="grid gap-2">
                      <Label htmlFor="new-password">New Password</Label>
                      <Input id="new-password" type="password" />
                    </div>
                    <div className="grid gap-2">
                      <Label htmlFor="confirm-password">Confirm New Password</Label>
                      <Input id="confirm-password" type="password" />
                    </div>
                    <Button>Update Password</Button>
                  </div>
                </div>
                
                <div className="pt-6 border-t border-gray-200">
                  <h3 className="text-lg font-medium mb-2">Two-Factor Authentication</h3>
                  <p className="text-sm text-gray-500 mb-4">
                    Add an extra layer of security to your account by enabling two-factor authentication.
                  </p>
                  <Button variant="outline">Enable 2FA</Button>
                </div>
                
                <div className="pt-6 border-t border-gray-200">
                  <h3 className="text-lg font-medium mb-2">Session Management</h3>
                  <p className="text-sm text-gray-500 mb-4">
                    Manage and revoke access from devices where you're currently logged in.
                  </p>
                  <div className="bg-gray-50 p-4 rounded-lg border border-gray-200 mb-4">
                    <div className="flex justify-between items-center">
                      <div>
                        <p className="font-medium">Current Session</p>
                        <p className="text-sm text-gray-500">Chrome on Windows • {new Date().toLocaleDateString()}</p>
                      </div>
                      <span className="text-xs bg-green-100 text-green-800 px-2 py-1 rounded-full">
                        Active
                      </span>
                    </div>
                  </div>
                  <Button variant="outline" className="text-red-600 border-red-200 hover:bg-red-50">
                    Sign Out All Other Devices
                  </Button>
                </div>
              </div>
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>
      
      {/* Upgrade modal */}
      <UpgradeModal
        isOpen={upgradeModalOpen}
        onClose={() => setUpgradeModalOpen(false)}
      />
    </>
  );
}
