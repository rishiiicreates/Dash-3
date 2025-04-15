import { useState, useEffect } from "react";
import { useLocation } from "wouter";
import { useAuth } from "@/hooks/useAuth";
import { usePlatformData } from "@/hooks/usePlatformData";
import { Platform, SocialStats } from "@shared/schema";
import { Chart } from "@/components/ui/chart";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { DateRangeOption, formatDateRange, getDateRangeFromOption } from "@/lib/dateUtils";
import { getPlatformIcon, formatNumber } from "@/lib/utils";

interface AnalyticsProps {
  dateRange: DateRangeOption;
  setDateRange: (range: DateRangeOption) => void;
}

export default function Analytics({ dateRange, setDateRange }: AnalyticsProps) {
  const { user } = useAuth();
  const [location] = useLocation();
  const [selectedPlatform, setSelectedPlatform] = useState<Platform | 'all'>('all');
  const [activeTab, setActiveTab] = useState("overview");
  
  // Extract platform from URL if present
  useEffect(() => {
    const params = new URLSearchParams(location.split('?')[1]);
    const platformParam = params.get('platform');
    if (platformParam && ['youtube', 'instagram', 'twitter', 'facebook', 'all'].includes(platformParam)) {
      setSelectedPlatform(platformParam as Platform | 'all');
    }
  }, [location]);
  
  // Fetch platform data
  const { 
    data: platformData, 
    isLoading, 
    isError 
  } = usePlatformData({ 
    userId: user?.id, 
    platform: selectedPlatform, 
    dateRange 
  });
  
  // Prepare chart data
  const prepareFollowersChartData = (stats: SocialStats | SocialStats[]) => {
    if (Array.isArray(stats)) {
      // Combined data for all platforms
      return [
        { name: 'YouTube', value: stats.find(s => s.platform === 'youtube')?.followers || 0, color: '#FF0000' },
        { name: 'Instagram', value: stats.find(s => s.platform === 'instagram')?.followers || 0, color: '#E1306C' },
        { name: 'Twitter', value: stats.find(s => s.platform === 'twitter')?.followers || 0, color: '#1DA1F2' },
        { name: 'Facebook', value: stats.find(s => s.platform === 'facebook')?.followers || 0, color: '#4267B2' }
      ];
    } else {
      // Data for a single platform - use posts data for timeline
      return stats.posts.slice(0, 7).map((post, index) => ({
        name: index.toString(),
        value: stats.followers - (index * Math.floor(stats.followers * 0.01)), // Mock trend data
      })).reverse();
    }
  };
  
  const prepareEngagementChartData = (stats: SocialStats | SocialStats[]) => {
    if (Array.isArray(stats)) {
      // Combined data for all platforms
      return [
        { name: 'YouTube', value: stats.find(s => s.platform === 'youtube')?.engagement || 0, color: '#FF0000' },
        { name: 'Instagram', value: stats.find(s => s.platform === 'instagram')?.engagement || 0, color: '#E1306C' },
        { name: 'Twitter', value: stats.find(s => s.platform === 'twitter')?.engagement || 0, color: '#1DA1F2' },
        { name: 'Facebook', value: stats.find(s => s.platform === 'facebook')?.engagement || 0, color: '#4267B2' }
      ];
    } else {
      // Data for a single platform - use posts data for timeline
      return stats.posts.slice(0, 7).map((post) => ({
        name: formatDateToShort(post.datePosted),
        value: post.likes + post.comments + (post.shares || 0),
      })).reverse();
    }
  };
  
  const prepareViewsChartData = (stats: SocialStats | SocialStats[]) => {
    if (Array.isArray(stats)) {
      // Combined data for all platforms
      return [
        { name: 'YouTube', value: stats.find(s => s.platform === 'youtube')?.views || 0, color: '#FF0000' },
        { name: 'Instagram', value: stats.find(s => s.platform === 'instagram')?.views || 0, color: '#E1306C' },
        { name: 'Twitter', value: stats.find(s => s.platform === 'twitter')?.views || 0, color: '#1DA1F2' },
        { name: 'Facebook', value: stats.find(s => s.platform === 'facebook')?.views || 0, color: '#4267B2' }
      ];
    } else {
      // Data for a single platform - use posts data for timeline
      return stats.posts.slice(0, 7).map((post) => ({
        name: formatDateToShort(post.datePosted),
        value: post.views,
      })).reverse();
    }
  };
  
  // Helper function to format date
  const formatDateToShort = (dateString: string) => {
    const date = new Date(dateString);
    return date.toLocaleDateString('en-US', { month: 'short', day: 'numeric' });
  };
  
  return (
    <>
      {/* Page header */}
      <div className="flex flex-col lg:flex-row lg:items-center justify-between mb-6">
        <h1 className="text-2xl font-semibold text-gray-800">Analytics</h1>
        
        <div className="flex mt-4 lg:mt-0 gap-4">
          <Select
            value={selectedPlatform}
            onValueChange={(value) => setSelectedPlatform(value as Platform | 'all')}
          >
            <SelectTrigger className="w-[160px]">
              <SelectValue placeholder="All Platforms" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="all">All Platforms</SelectItem>
              <SelectItem value="youtube">YouTube</SelectItem>
              <SelectItem value="instagram">Instagram</SelectItem>
              <SelectItem value="twitter">Twitter/X</SelectItem>
              <SelectItem value="facebook">Facebook</SelectItem>
            </SelectContent>
          </Select>
          
          <Select
            value={dateRange}
            onValueChange={(value) => setDateRange(value as DateRangeOption)}
          >
            <SelectTrigger className="w-[160px]">
              <SelectValue placeholder="Last 7 days" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="7d">Last 7 days</SelectItem>
              <SelectItem value="30d">Last 30 days</SelectItem>
              <SelectItem value="custom">Custom Range</SelectItem>
            </SelectContent>
          </Select>
          
          <Button variant="outline" size="sm">
            <i className="ri-download-line mr-1.5"></i>
            Export
          </Button>
        </div>
      </div>
      
      {/* Date range display */}
      <div className="mb-6">
        <Card>
          <CardContent className="p-4">
            <p className="text-sm text-gray-500">
              Showing data for: <span className="font-medium">{formatDateRange(getDateRangeFromOption(dateRange))}</span>
            </p>
          </CardContent>
        </Card>
      </div>
      
      {/* Analytics tabs */}
      <Tabs defaultValue="overview" value={activeTab} onValueChange={setActiveTab} className="mb-6">
        <TabsList className="grid w-full grid-cols-4 lg:w-[400px]">
          <TabsTrigger value="overview">Overview</TabsTrigger>
          <TabsTrigger value="followers">Followers</TabsTrigger>
          <TabsTrigger value="engagement">Engagement</TabsTrigger>
          <TabsTrigger value="views">Views</TabsTrigger>
        </TabsList>
      </Tabs>
      
      {isLoading ? (
        // Loading state
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          {[...Array(2)].map((_, i) => (
            <Card key={i} className="animate-pulse">
              <CardHeader>
                <div className="h-5 bg-gray-200 rounded w-1/3 mb-2"></div>
              </CardHeader>
              <CardContent>
                <div className="h-[300px] bg-gray-100 rounded"></div>
              </CardContent>
            </Card>
          ))}
        </div>
      ) : isError ? (
        // Error state
        <Card>
          <CardContent className="p-8 text-center">
            <div className="text-red-500 mb-4">
              <i className="ri-error-warning-line text-4xl"></i>
            </div>
            <h3 className="text-lg font-medium mb-2">Failed to load analytics data</h3>
            <p className="text-gray-500 mb-4">
              There was an error fetching your analytics. Please try again or contact support if the issue persists.
            </p>
            <Button>Retry</Button>
          </CardContent>
        </Card>
      ) : (
        // Content based on selected tab
        <>
          {activeTab === "overview" && (
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
              {/* Followers overview */}
              <Card>
                <CardHeader>
                  <CardTitle className="flex items-center">
                    <i className="ri-user-add-line text-lg mr-2 text-primary"></i>
                    Followers Overview
                  </CardTitle>
                </CardHeader>
                <CardContent>
                  {Array.isArray(platformData) ? (
                    <Chart
                      data={prepareFollowersChartData(platformData)}
                      type="pie"
                      dataKey="value"
                      xAxisKey="name"
                      height={300}
                      colors={['#FF0000', '#E1306C', '#1DA1F2', '#4267B2']}
                    />
                  ) : (
                    <Chart
                      data={prepareFollowersChartData(platformData)}
                      type="line"
                      dataKey="value"
                      xAxisKey="name"
                      height={300}
                      platform={selectedPlatform as Platform}
                    />
                  )}
                  
                  <div className="mt-4 grid grid-cols-2 gap-2">
                    {Array.isArray(platformData) ? (
                      platformData.map((stat) => (
                        <div key={stat.platform} className="flex items-center">
                          <i className={`${getPlatformIcon(stat.platform)} text-lg mr-2 platform-icon-${stat.platform}`}></i>
                          <div>
                            <p className="text-sm font-medium">{stat.platform.charAt(0).toUpperCase() + stat.platform.slice(1)}</p>
                            <p className="text-sm text-gray-500">{formatNumber(stat.followers)} followers</p>
                          </div>
                        </div>
                      ))
                    ) : (
                      <div className="col-span-2">
                        <div className="flex items-center">
                          <i className={`${getPlatformIcon(platformData.platform)} text-lg mr-2 platform-icon-${platformData.platform}`}></i>
                          <div>
                            <p className="text-sm font-medium">{platformData.platform.charAt(0).toUpperCase() + platformData.platform.slice(1)}</p>
                            <p className="text-sm text-gray-500">{formatNumber(platformData.followers)} followers</p>
                          </div>
                        </div>
                      </div>
                    )}
                  </div>
                </CardContent>
              </Card>
              
              {/* Engagement overview */}
              <Card>
                <CardHeader>
                  <CardTitle className="flex items-center">
                    <i className="ri-heart-line text-lg mr-2 text-secondary"></i>
                    Engagement Overview
                  </CardTitle>
                </CardHeader>
                <CardContent>
                  {Array.isArray(platformData) ? (
                    <Chart
                      data={prepareEngagementChartData(platformData)}
                      type="bar"
                      dataKey="value"
                      xAxisKey="name"
                      height={300}
                      colors={['#FF0000', '#E1306C', '#1DA1F2', '#4267B2']}
                    />
                  ) : (
                    <Chart
                      data={prepareEngagementChartData(platformData)}
                      type="bar"
                      dataKey="value"
                      xAxisKey="name"
                      height={300}
                      platform={selectedPlatform as Platform}
                    />
                  )}
                  
                  <div className="mt-4 grid grid-cols-2 gap-2">
                    {Array.isArray(platformData) ? (
                      platformData.map((stat) => (
                        <div key={stat.platform} className="flex items-center">
                          <i className={`${getPlatformIcon(stat.platform)} text-lg mr-2 platform-icon-${stat.platform}`}></i>
                          <div>
                            <p className="text-sm font-medium">{stat.platform.charAt(0).toUpperCase() + stat.platform.slice(1)}</p>
                            <p className="text-sm text-gray-500">{formatNumber(stat.engagement)} engagements</p>
                          </div>
                        </div>
                      ))
                    ) : (
                      <div className="col-span-2">
                        <div className="flex items-center">
                          <i className={`${getPlatformIcon(platformData.platform)} text-lg mr-2 platform-icon-${platformData.platform}`}></i>
                          <div>
                            <p className="text-sm font-medium">{platformData.platform.charAt(0).toUpperCase() + platformData.platform.slice(1)}</p>
                            <p className="text-sm text-gray-500">{formatNumber(platformData.engagement)} engagements</p>
                          </div>
                        </div>
                      </div>
                    )}
                  </div>
                </CardContent>
              </Card>
              
              {/* Views overview */}
              <Card>
                <CardHeader>
                  <CardTitle className="flex items-center">
                    <i className="ri-eye-line text-lg mr-2 text-green-500"></i>
                    Views Overview
                  </CardTitle>
                </CardHeader>
                <CardContent>
                  {Array.isArray(platformData) ? (
                    <Chart
                      data={prepareViewsChartData(platformData)}
                      type="bar"
                      dataKey="value"
                      xAxisKey="name"
                      height={300}
                      colors={['#FF0000', '#E1306C', '#1DA1F2', '#4267B2']}
                    />
                  ) : (
                    <Chart
                      data={prepareViewsChartData(platformData)}
                      type="area"
                      dataKey="value"
                      xAxisKey="name"
                      height={300}
                      platform={selectedPlatform as Platform}
                    />
                  )}
                  
                  <div className="mt-4 grid grid-cols-2 gap-2">
                    {Array.isArray(platformData) ? (
                      platformData.map((stat) => (
                        <div key={stat.platform} className="flex items-center">
                          <i className={`${getPlatformIcon(stat.platform)} text-lg mr-2 platform-icon-${stat.platform}`}></i>
                          <div>
                            <p className="text-sm font-medium">{stat.platform.charAt(0).toUpperCase() + stat.platform.slice(1)}</p>
                            <p className="text-sm text-gray-500">{formatNumber(stat.views)} views</p>
                          </div>
                        </div>
                      ))
                    ) : (
                      <div className="col-span-2">
                        <div className="flex items-center">
                          <i className={`${getPlatformIcon(platformData.platform)} text-lg mr-2 platform-icon-${platformData.platform}`}></i>
                          <div>
                            <p className="text-sm font-medium">{platformData.platform.charAt(0).toUpperCase() + platformData.platform.slice(1)}</p>
                            <p className="text-sm text-gray-500">{formatNumber(platformData.views)} views</p>
                          </div>
                        </div>
                      </div>
                    )}
                  </div>
                </CardContent>
              </Card>
              
              {/* Performance by platform */}
              <Card>
                <CardHeader>
                  <CardTitle className="flex items-center">
                    <i className="ri-bar-chart-line text-lg mr-2 text-blue-500"></i>
                    Performance by Platform
                  </CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="space-y-4">
                    {Array.isArray(platformData) ? (
                      platformData.map((stat) => (
                        <div key={stat.platform} className="flex items-center justify-between">
                          <div className="flex items-center">
                            <i className={`${getPlatformIcon(stat.platform)} text-lg mr-2 platform-icon-${stat.platform}`}></i>
                            <span className="text-sm font-medium capitalize">{stat.platform}</span>
                          </div>
                          <div className="flex space-x-4 text-sm text-gray-500">
                            <div>
                              <span className="block text-xs text-gray-400">Followers</span>
                              <span className="font-medium">{formatNumber(stat.followers)}</span>
                            </div>
                            <div>
                              <span className="block text-xs text-gray-400">Engagement</span>
                              <span className="font-medium">{formatNumber(stat.engagement)}</span>
                            </div>
                            <div>
                              <span className="block text-xs text-gray-400">Views</span>
                              <span className="font-medium">{formatNumber(stat.views)}</span>
                            </div>
                          </div>
                        </div>
                      ))
                    ) : (
                      <div className="flex items-center justify-between">
                        <div className="flex items-center">
                          <i className={`${getPlatformIcon(platformData.platform)} text-lg mr-2 platform-icon-${platformData.platform}`}></i>
                          <span className="text-sm font-medium capitalize">{platformData.platform}</span>
                        </div>
                        <div className="flex space-x-4 text-sm text-gray-500">
                          <div>
                            <span className="block text-xs text-gray-400">Followers</span>
                            <span className="font-medium">{formatNumber(platformData.followers)}</span>
                          </div>
                          <div>
                            <span className="block text-xs text-gray-400">Engagement</span>
                            <span className="font-medium">{formatNumber(platformData.engagement)}</span>
                          </div>
                          <div>
                            <span className="block text-xs text-gray-400">Views</span>
                            <span className="font-medium">{formatNumber(platformData.views)}</span>
                          </div>
                        </div>
                      </div>
                    )}
                  </div>
                </CardContent>
              </Card>
            </div>
          )}
          
          {activeTab === "followers" && (
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center">
                  <i className="ri-user-add-line text-lg mr-2 text-primary"></i>
                  Followers Analytics
                </CardTitle>
              </CardHeader>
              <CardContent>
                <div className="h-[400px]">
                  {Array.isArray(platformData) ? (
                    <Chart
                      data={prepareFollowersChartData(platformData)}
                      type="pie"
                      dataKey="value"
                      xAxisKey="name"
                      height="100%"
                      colors={['#FF0000', '#E1306C', '#1DA1F2', '#4267B2']}
                    />
                  ) : (
                    <Chart
                      data={prepareFollowersChartData(platformData)}
                      type="line"
                      dataKey="value"
                      xAxisKey="name"
                      height="100%"
                      platform={selectedPlatform as Platform}
                    />
                  )}
                </div>
                
                <div className="mt-6 grid grid-cols-2 md:grid-cols-4 gap-4">
                  {Array.isArray(platformData) ? (
                    platformData.map((stat) => (
                      <Card key={stat.platform}>
                        <CardContent className="p-4">
                          <div className="flex items-center mb-2">
                            <i className={`${getPlatformIcon(stat.platform)} platform-icon-${stat.platform} mr-2`}></i>
                            <h3 className="font-medium capitalize">{stat.platform}</h3>
                          </div>
                          <div className="text-2xl font-bold">{formatNumber(stat.followers)}</div>
                          <div className="flex items-center mt-1 text-success">
                            <i className="ri-arrow-up-line text-xs mr-1"></i>
                            <span className="text-xs">+{(stat.followersGrowth).toFixed(1)}%</span>
                          </div>
                        </CardContent>
                      </Card>
                    ))
                  ) : (
                    <Card className="col-span-2 md:col-span-4">
                      <CardContent className="p-4">
                        <div className="flex items-center mb-2">
                          <i className={`${getPlatformIcon(platformData.platform)} platform-icon-${platformData.platform} mr-2`}></i>
                          <h3 className="font-medium capitalize">{platformData.platform}</h3>
                        </div>
                        <div className="text-2xl font-bold">{formatNumber(platformData.followers)}</div>
                        <div className="flex items-center mt-1 text-success">
                          <i className="ri-arrow-up-line text-xs mr-1"></i>
                          <span className="text-xs">+{(platformData.followersGrowth).toFixed(1)}%</span>
                        </div>
                      </CardContent>
                    </Card>
                  )}
                </div>
              </CardContent>
            </Card>
          )}
          
          {activeTab === "engagement" && (
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center">
                  <i className="ri-heart-line text-lg mr-2 text-secondary"></i>
                  Engagement Analytics
                </CardTitle>
              </CardHeader>
              <CardContent>
                <div className="h-[400px]">
                  {Array.isArray(platformData) ? (
                    <Chart
                      data={prepareEngagementChartData(platformData)}
                      type="bar"
                      dataKey="value"
                      xAxisKey="name"
                      height="100%"
                      colors={['#FF0000', '#E1306C', '#1DA1F2', '#4267B2']}
                    />
                  ) : (
                    <Chart
                      data={prepareEngagementChartData(platformData)}
                      type="bar"
                      dataKey="value"
                      xAxisKey="name"
                      height="100%"
                      platform={selectedPlatform as Platform}
                    />
                  )}
                </div>
                
                <div className="mt-6 grid grid-cols-2 md:grid-cols-4 gap-4">
                  {Array.isArray(platformData) ? (
                    platformData.map((stat) => (
                      <Card key={stat.platform}>
                        <CardContent className="p-4">
                          <div className="flex items-center mb-2">
                            <i className={`${getPlatformIcon(stat.platform)} platform-icon-${stat.platform} mr-2`}></i>
                            <h3 className="font-medium capitalize">{stat.platform}</h3>
                          </div>
                          <div className="text-2xl font-bold">{formatNumber(stat.engagement)}</div>
                          <div className="flex items-center mt-1 text-success">
                            <i className="ri-arrow-up-line text-xs mr-1"></i>
                            <span className="text-xs">+{(stat.engagementGrowth).toFixed(1)}%</span>
                          </div>
                        </CardContent>
                      </Card>
                    ))
                  ) : (
                    <Card className="col-span-2 md:col-span-4">
                      <CardContent className="p-4">
                        <div className="flex items-center mb-2">
                          <i className={`${getPlatformIcon(platformData.platform)} platform-icon-${platformData.platform} mr-2`}></i>
                          <h3 className="font-medium capitalize">{platformData.platform}</h3>
                        </div>
                        <div className="text-2xl font-bold">{formatNumber(platformData.engagement)}</div>
                        <div className="flex items-center mt-1 text-success">
                          <i className="ri-arrow-up-line text-xs mr-1"></i>
                          <span className="text-xs">+{(platformData.engagementGrowth).toFixed(1)}%</span>
                        </div>
                      </CardContent>
                    </Card>
                  )}
                </div>
              </CardContent>
            </Card>
          )}
          
          {activeTab === "views" && (
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center">
                  <i className="ri-eye-line text-lg mr-2 text-green-500"></i>
                  Views Analytics
                </CardTitle>
              </CardHeader>
              <CardContent>
                <div className="h-[400px]">
                  {Array.isArray(platformData) ? (
                    <Chart
                      data={prepareViewsChartData(platformData)}
                      type="bar"
                      dataKey="value"
                      xAxisKey="name"
                      height="100%"
                      colors={['#FF0000', '#E1306C', '#1DA1F2', '#4267B2']}
                    />
                  ) : (
                    <Chart
                      data={prepareViewsChartData(platformData)}
                      type="area"
                      dataKey="value"
                      xAxisKey="name"
                      height="100%"
                      platform={selectedPlatform as Platform}
                    />
                  )}
                </div>
                
                <div className="mt-6 grid grid-cols-2 md:grid-cols-4 gap-4">
                  {Array.isArray(platformData) ? (
                    platformData.map((stat) => (
                      <Card key={stat.platform}>
                        <CardContent className="p-4">
                          <div className="flex items-center mb-2">
                            <i className={`${getPlatformIcon(stat.platform)} platform-icon-${stat.platform} mr-2`}></i>
                            <h3 className="font-medium capitalize">{stat.platform}</h3>
                          </div>
                          <div className="text-2xl font-bold">{formatNumber(stat.views)}</div>
                          <div className={`flex items-center mt-1 ${stat.viewsGrowth >= 0 ? 'text-success' : 'text-error'}`}>
                            <i className={`${stat.viewsGrowth >= 0 ? 'ri-arrow-up-line' : 'ri-arrow-down-line'} text-xs mr-1`}></i>
                            <span className="text-xs">{Math.abs(stat.viewsGrowth).toFixed(1)}%</span>
                          </div>
                        </CardContent>
                      </Card>
                    ))
                  ) : (
                    <Card className="col-span-2 md:col-span-4">
                      <CardContent className="p-4">
                        <div className="flex items-center mb-2">
                          <i className={`${getPlatformIcon(platformData.platform)} platform-icon-${platformData.platform} mr-2`}></i>
                          <h3 className="font-medium capitalize">{platformData.platform}</h3>
                        </div>
                        <div className="text-2xl font-bold">{formatNumber(platformData.views)}</div>
                        <div className={`flex items-center mt-1 ${platformData.viewsGrowth >= 0 ? 'text-success' : 'text-error'}`}>
                          <i className={`${platformData.viewsGrowth >= 0 ? 'ri-arrow-up-line' : 'ri-arrow-down-line'} text-xs mr-1`}></i>
                          <span className="text-xs">{Math.abs(platformData.viewsGrowth).toFixed(1)}%</span>
                        </div>
                      </CardContent>
                    </Card>
                  )}
                </div>
              </CardContent>
            </Card>
          )}
        </>
      )}
    </>
  );
}
