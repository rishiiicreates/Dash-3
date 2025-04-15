import { useState, useEffect } from "react";
import { useQuery } from "@tanstack/react-query";
import { SocialPost, Platform } from "@shared/schema";
import { getPlatformIcon, getEngagementIcon, formatDateToLocal, truncateText, downloadCSV } from "@/lib/utils";
import { useToast } from "@/hooks/use-toast";
import { Button } from "@/components/ui/button";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { DateRangeOption } from "@/lib/dateUtils";

interface PostPerformanceProps {
  dateRange: DateRangeOption;
  userId?: number;
}

export default function PostPerformance({ dateRange, userId = 1 }: PostPerformanceProps) {
  const [platform, setPlatform] = useState<Platform | 'all'>('all');
  const [page, setPage] = useState(1);
  const [limit] = useState(10);
  const { toast } = useToast();
  
  // Reset to page 1 when platform or date range changes
  useEffect(() => {
    setPage(1);
  }, [platform, dateRange]);
  
  // Fetch posts based on filters
  const { data, isLoading, isError } = useQuery({
    queryKey: ['/api/posts', userId, dateRange, platform, page, limit],
    queryFn: async () => {
      const days = dateRange === '30d' ? 30 : 7;
      const res = await fetch(`/api/posts?userId=${userId}&days=${days}&platform=${platform}&page=${page}&limit=${limit}`);
      
      if (!res.ok) {
        const error = await res.json();
        throw new Error(error.message || 'Failed to fetch posts');
      }
      
      return res.json();
    }
  });
  
  const handleExport = () => {
    if (!data?.posts || data.posts.length === 0) {
      return toast({
        title: "Export Failed",
        description: "No data available to export",
        variant: "destructive"
      });
    }
    
    // Format data for CSV
    const exportData = data.posts.map((post: SocialPost) => ({
      platform: post.platform,
      title: post.title,
      views: post.views,
      likes: post.likes,
      comments: post.comments,
      shares: post.shares,
      datePosted: formatDateToLocal(post.datePosted),
      url: post.postUrl
    }));
    
    downloadCSV(exportData, `post-performance-${platform}-${dateRange}`);
    
    toast({
      title: "Export Successful",
      description: "Your data has been exported as CSV"
    });
  };
  
  // Function to render platform-specific engagement metrics
  const renderEngagementMetrics = (post: SocialPost) => {
    const metrics = [];
    
    if (post.likes) {
      const icon = post.platform === 'instagram' || post.platform === 'twitter' 
        ? 'ri-heart-line' 
        : 'ri-thumb-up-line';
      
      metrics.push(
        <div key="likes" className="flex items-center">
          <i className={`${icon} mr-1`}></i> {post.likes.toLocaleString()}
        </div>
      );
    }
    
    if (post.comments) {
      metrics.push(
        <div key="comments" className="flex items-center">
          <i className="ri-chat-1-line mr-1"></i> {post.comments.toLocaleString()}
        </div>
      );
    }
    
    if (post.shares) {
      const icon = post.platform === 'twitter' 
        ? 'ri-repeat-line' 
        : 'ri-share-forward-line';
      
      metrics.push(
        <div key="shares" className="flex items-center">
          <i className={`${icon} mr-1`}></i> {post.shares.toLocaleString()}
        </div>
      );
    }
    
    return (
      <div className="flex space-x-3 text-sm text-gray-500">
        {metrics}
      </div>
    );
  };
  
  // Get pagination info
  const pagination = data?.pagination || { page: 1, limit: 10, total: 0, totalPages: 1 };
  
  return (
    <div className="bg-white rounded-lg shadow-sm mb-6">
      <div className="p-5 border-b border-gray-100">
        <div className="flex justify-between items-center mb-2">
          <h2 className="text-lg font-semibold">Recent Posts Performance</h2>
          
          <div className="flex space-x-2">
            <Select
              value={platform}
              onValueChange={(value) => setPlatform(value as Platform | 'all')}
            >
              <SelectTrigger className="w-[140px] h-9">
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
            
            <Button variant="outline" size="sm" onClick={handleExport}>
              <i className="ri-download-line mr-1.5"></i>
              Export
            </Button>
          </div>
        </div>
      </div>
      
      <div className="overflow-x-auto">
        <table className="min-w-full divide-y divide-gray-200">
          <thead className="bg-gray-50">
            <tr>
              <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                Platform
              </th>
              <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                Post
              </th>
              <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                Performance
              </th>
              <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                Engagement
              </th>
              <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                Date
              </th>
              <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                Actions
              </th>
            </tr>
          </thead>
          <tbody className="bg-white divide-y divide-gray-200">
            {isLoading ? (
              <tr>
                <td colSpan={6} className="py-10 text-center">
                  <div className="flex justify-center">
                    <div className="animate-spin rounded-full h-6 w-6 border-t-2 border-b-2 border-primary"></div>
                  </div>
                </td>
              </tr>
            ) : isError ? (
              <tr>
                <td colSpan={6} className="py-10 text-center text-red-500">
                  Error loading posts. Please try again.
                </td>
              </tr>
            ) : data?.posts?.length === 0 ? (
              <tr>
                <td colSpan={6} className="py-10 text-center text-gray-500">
                  No posts found for the selected filters.
                </td>
              </tr>
            ) : (
              data?.posts?.map((post: SocialPost) => (
                <tr key={post.id}>
                  <td className="px-6 py-4 whitespace-nowrap">
                    <div className="flex items-center">
                      <i className={`${getPlatformIcon(post.platform)} text-lg text-${post.platform}`}></i>
                    </div>
                  </td>
                  <td className="px-6 py-4">
                    <div className="flex items-center">
                      {post.thumbnailUrl && (
                        <div className="h-10 w-14 bg-gray-200 rounded overflow-hidden mr-3">
                          <img
                            src={post.thumbnailUrl}
                            alt="Post thumbnail"
                            className="h-full w-full object-cover"
                          />
                        </div>
                      )}
                      <div className="max-w-xs truncate">
                        <div className="text-sm font-medium text-gray-900 truncate">
                          {truncateText(post.title, 70)}
                        </div>
                      </div>
                    </div>
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap">
                    <div className="text-sm text-gray-900">
                      {post.views?.toLocaleString()} views
                    </div>
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap">
                    {renderEngagementMetrics(post)}
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                    {formatDateToLocal(post.datePosted)}
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap text-right text-sm font-medium">
                    <a 
                      href={post.postUrl} 
                      target="_blank" 
                      rel="noopener noreferrer"
                      className="text-primary hover:text-primary-dark"
                    >
                      View
                    </a>
                  </td>
                </tr>
              ))
            )}
          </tbody>
        </table>
      </div>
      
      {data?.posts?.length > 0 && (
        <div className="px-5 py-4 border-t border-gray-200 sm:flex sm:items-center sm:justify-between">
          <div className="text-sm text-gray-500">
            Showing <span className="font-medium">{(pagination.page - 1) * pagination.limit + 1}</span> to{" "}
            <span className="font-medium">
              {Math.min(pagination.page * pagination.limit, pagination.total)}
            </span>{" "}
            of <span className="font-medium">{pagination.total}</span> posts
          </div>
          <div className="flex-1 flex justify-between sm:justify-end mt-3 sm:mt-0">
            <Button
              variant="outline"
              size="sm"
              onClick={() => setPage(page - 1)}
              disabled={page === 1}
              className="mr-3"
            >
              Previous
            </Button>
            <Button
              variant="outline"
              size="sm"
              onClick={() => setPage(page + 1)}
              disabled={page === pagination.totalPages}
            >
              Next
            </Button>
          </div>
        </div>
      )}
    </div>
  );
}
