import { useQuery } from "@tanstack/react-query";
import MetricCard from "@/components/dashboard/MetricCard";
import { SocialStats } from "@shared/schema";
import { DateRangeOption } from "@/lib/dateUtils";

interface MetricsSummaryProps {
  dateRange: DateRangeOption;
  userId?: number;
}

export default function MetricsSummary({ dateRange, userId = 1 }: MetricsSummaryProps) {
  // Fetch all platform stats
  const { data: platformStats, isLoading, isError } = useQuery({
    queryKey: ['/api/stats', userId, dateRange],
    queryFn: async () => {
      const days = dateRange === '30d' ? 30 : 7;
      const res = await fetch(`/api/stats?userId=${userId}&days=${days}`);
      
      if (!res.ok) {
        const error = await res.json();
        throw new Error(error.message || 'Failed to fetch stats');
      }
      
      return res.json() as Promise<SocialStats[]>;
    }
  });
  
  // Calculate totals from platform stats
  const calculateTotals = () => {
    if (!platformStats || platformStats.length === 0) {
      return {
        followers: 0,
        followersGrowth: 0,
        engagement: 0,
        engagementGrowth: 0,
        views: 0,
        viewsGrowth: 0,
        ctr: 0,
        ctrGrowth: 0
      };
    }
    
    let totalFollowers = 0;
    let totalFollowersGrowth = 0;
    let totalEngagement = 0;
    let totalEngagementGrowth = 0;
    let totalViews = 0;
    let totalViewsGrowth = 0;
    
    platformStats.forEach(stat => {
      totalFollowers += stat.followers;
      totalFollowersGrowth += stat.followersGrowth * stat.followers; // Weighted average
      totalEngagement += stat.engagement;
      totalEngagementGrowth += stat.engagementGrowth * stat.engagement; // Weighted average
      totalViews += stat.views;
      totalViewsGrowth += stat.viewsGrowth * stat.views; // Weighted average
    });
    
    // Calculate average growth percentages based on weighted averages
    const avgFollowersGrowth = totalFollowers > 0 ? totalFollowersGrowth / totalFollowers : 0;
    const avgEngagementGrowth = totalEngagement > 0 ? totalEngagementGrowth / totalEngagement : 0;
    const avgViewsGrowth = totalViews > 0 ? totalViewsGrowth / totalViews : 0;
    
    // Calculate CTR
    const ctr = totalViews > 0 ? (totalEngagement / totalViews) * 100 : 0;
    // Use a sample CTR growth value
    const ctrGrowth = -0.5;
    
    return {
      followers: totalFollowers,
      followersGrowth: avgFollowersGrowth,
      engagement: totalEngagement,
      engagementGrowth: avgEngagementGrowth,
      views: totalViews,
      viewsGrowth: avgViewsGrowth,
      ctr,
      ctrGrowth
    };
  };
  
  const totals = calculateTotals();
  
  if (isLoading) {
    return (
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4 mb-6">
        {[...Array(4)].map((_, i) => (
          <div key={i} className="bg-white rounded-lg shadow-sm p-5 animate-pulse">
            <div className="flex justify-between">
              <div>
                <div className="h-4 bg-gray-200 rounded w-24 mb-3"></div>
                <div className="h-6 bg-gray-300 rounded w-20 mb-2"></div>
                <div className="h-3 bg-gray-200 rounded w-10"></div>
              </div>
              <div className="h-10 w-10 bg-gray-200 rounded-lg"></div>
            </div>
          </div>
        ))}
      </div>
    );
  }
  
  if (isError) {
    return (
      <div className="bg-red-50 border border-red-200 text-red-700 px-4 py-3 rounded-lg mb-6">
        Error loading metrics. Please try again.
      </div>
    );
  }
  
  return (
    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4 mb-6">
      <MetricCard
        title="Total Followers"
        value={totals.followers}
        growthPercent={totals.followersGrowth}
        icon="ri-user-add-line"
        iconColor="#3B82F6"
      />
      
      <MetricCard
        title="Total Engagement"
        value={totals.engagement}
        growthPercent={totals.engagementGrowth}
        icon="ri-heart-line"
        iconColor="#8B5CF6"
      />
      
      <MetricCard
        title="Total Views"
        value={totals.views}
        growthPercent={totals.viewsGrowth}
        icon="ri-eye-line"
        iconColor="#10B981"
      />
      
      <MetricCard
        title="CTR"
        value={totals.ctr}
        growthPercent={totals.ctrGrowth}
        icon="ri-cursor-line"
        iconColor="#3B82F6"
      />
    </div>
  );
}
