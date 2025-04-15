import { Link } from "wouter";
import { Chart } from "@/components/ui/chart";
import { getPlatformIcon, formatNumber, formatDateToLocal } from "@/lib/utils";
import { SocialStats } from "@shared/schema";

interface PlatformCardProps {
  stats: SocialStats;
}

export default function PlatformCard({ stats }: PlatformCardProps) {
  const { platform, followers, followersGrowth, views, viewsGrowth, engagement, lastUpdated } = stats;
  
  // Generate chart data based on posts
  const chartData = stats.posts.slice(0, 7).map((post, index) => ({
    name: index,
    value: post.views,
  })).reverse();

  // Function to get platform-specific CSS class for card border-top
  const getPlatformCardClass = (platform: string) => {
    return `platform-card-${platform}`;
  };

  return (
    <div className={`bg-white rounded-lg shadow-sm overflow-hidden ${getPlatformCardClass(platform)} border-t-4`}>
      <div className="p-5">
        <div className="flex justify-between items-center mb-4">
          <div className="flex items-center">
            <i className={`${getPlatformIcon(platform)} text-xl text-${platform} mr-2`}></i>
            <h3 className="font-semibold capitalize">{platform}</h3>
          </div>
          <span className="text-xs font-medium px-2 py-1 bg-green-100 text-green-800 rounded-full">
            Connected
          </span>
        </div>
        
        <div className="grid grid-cols-2 gap-4 mb-4">
          <div>
            <p className="text-xs text-gray-500">
              {platform === 'facebook' ? 'Page Likes' : 
              platform === 'twitter' ? 'Followers' : 
              platform === 'youtube' ? 'Subscribers' : 'Followers'}
            </p>
            <p className="text-lg font-bold mt-1">{formatNumber(followers)}</p>
            <div className="flex items-center mt-1 text-success">
              <i className="ri-arrow-up-line text-xs"></i>
              <span className="text-xs">{Math.round(followers * followersGrowth / 100)} this week</span>
            </div>
          </div>
          <div>
            <p className="text-xs text-gray-500">
              {platform === 'instagram' ? 'Engagement Rate' : 
              platform === 'twitter' ? 'Impressions' : 
              platform === 'facebook' ? 'Reach' : 'Views'}
            </p>
            <p className="text-lg font-bold mt-1">
              {platform === 'instagram' 
                ? `${(engagement / views * 100).toFixed(1)}%` 
                : formatNumber(views)}
            </p>
            <div className={`flex items-center mt-1 ${viewsGrowth >= 0 ? 'text-success' : 'text-error'}`}>
              <i className={`${viewsGrowth >= 0 ? 'ri-arrow-up-line' : 'ri-arrow-down-line'} text-xs`}></i>
              <span className="text-xs">
                {platform === 'instagram' 
                  ? `${Math.abs(viewsGrowth).toFixed(1)}% this week` 
                  : `${formatNumber(Math.abs(Math.round(views * viewsGrowth / 100)))} this week`}
              </span>
            </div>
          </div>
        </div>
        
        {/* Chart */}
        <div className="bg-gray-50 rounded-lg h-32">
          <Chart 
            data={chartData}
            type="area"
            dataKey="value"
            height="128px"
            platform={platform}
            labels={false}
            grid={false}
            tooltip={false}
          />
        </div>
      </div>
      <div className="border-t border-gray-100 px-5 py-3 flex justify-between">
        <Link href={`/analytics?platform=${platform}`} className="text-sm text-primary font-medium">
          View Details
        </Link>
        <span className="text-xs text-gray-500">
          Last updated: {formatDateToLocal(lastUpdated)}
        </span>
      </div>
    </div>
  );
}
