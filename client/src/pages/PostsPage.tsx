import { useState } from "react";
import { useQuery } from "@tanstack/react-query";
import { SocialPost, Platform } from "@shared/schema";
import { useAuth } from "@/hooks/useAuth";
import { getPlatformIcon, formatDateToLocal, truncateText, downloadCSV } from "@/lib/utils";
import { useToast } from "@/hooks/use-toast";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { DateRangeOption, getDaysInRange, getDateRangeFromOption } from "@/lib/dateUtils";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";

interface PostsPageProps {
  dateRange: DateRangeOption;
  setDateRange: (range: DateRangeOption) => void;
}

export default function PostsPage({ dateRange, setDateRange }: PostsPageProps) {
  const { user } = useAuth();
  const [platform, setPlatform] = useState<Platform | 'all'>('all');
  const [searchTerm, setSearchTerm] = useState("");
  const [page, setPage] = useState(1);
  const [limit] = useState(10);
  const { toast } = useToast();
  
  // Get days from current date range
  const days = getDaysInRange(getDateRangeFromOption(dateRange));
  
  // Fetch posts based on filters
  const { data, isLoading, isError } = useQuery({
    queryKey: ['/api/posts', user?.id, days, platform, searchTerm, page, limit],
    queryFn: async () => {
      const res = await fetch(`/api/posts?userId=${user?.id || 1}&days=${days}&platform=${platform}&page=${page}&limit=${limit}`);
      
      if (!res.ok) {
        const error = await res.json();
        throw new Error(error.message || 'Failed to fetch posts');
      }
      
      return res.json();
    }
  });
  
  // Filtered posts based on search term
  const filteredPosts = data?.posts?.filter((post: SocialPost) => 
    post.title.toLowerCase().includes(searchTerm.toLowerCase())
  ) || [];
  
  const handleExport = () => {
    if (!filteredPosts || filteredPosts.length === 0) {
      return toast({
        title: "Export Failed",
        description: "No data available to export",
        variant: "destructive"
      });
    }
    
    // Format data for CSV
    const exportData = filteredPosts.map((post: SocialPost) => ({
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
    <>
      {/* Page header */}
      <div className="flex flex-col lg:flex-row lg:items-center justify-between mb-6">
        <h1 className="text-2xl font-semibold text-gray-800">Posts</h1>
        
        <div className="flex mt-4 lg:mt-0 space-x-2">
          <Button variant="outline" size="sm" onClick={handleExport}>
            <i className="ri-download-line mr-1.5"></i>
            Export
          </Button>
        </div>
      </div>
      
      {/* Post filters */}
      <Card className="mb-6">
        <CardHeader>
          <CardTitle>Filter Posts</CardTitle>
          <CardDescription>
            Find and analyze performance of specific posts
          </CardDescription>
        </CardHeader>
        <CardContent>
          <div className="flex flex-col md:flex-row gap-4">
            <div className="flex-1">
              <Input
                placeholder="Search posts..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="w-full"
              />
            </div>
            <div className="flex gap-2">
              <Select
                value={platform}
                onValueChange={(value) => setPlatform(value as Platform | 'all')}
              >
                <SelectTrigger className="w-[140px]">
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
                <SelectTrigger className="w-[140px]">
                  <SelectValue placeholder="Last 7 days" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="7d">Last 7 days</SelectItem>
                  <SelectItem value="30d">Last 30 days</SelectItem>
                  <SelectItem value="custom">Custom Range</SelectItem>
                </SelectContent>
              </Select>
            </div>
          </div>
        </CardContent>
      </Card>
      
      {/* Post table */}
      <Card>
        <CardHeader>
          <CardTitle>Post Performance</CardTitle>
          <CardDescription>
            Analyze the performance of your posts across all platforms
          </CardDescription>
        </CardHeader>
        <CardContent>
          {isLoading ? (
            <div className="py-10 text-center">
              <div className="flex justify-center">
                <div className="animate-spin rounded-full h-6 w-6 border-t-2 border-b-2 border-primary"></div>
              </div>
            </div>
          ) : isError ? (
            <div className="py-10 text-center text-red-500">
              Error loading posts. Please try again.
            </div>
          ) : filteredPosts.length === 0 ? (
            <div className="py-10 text-center text-gray-500">
              No posts found for the selected filters.
            </div>
          ) : (
            <>
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Platform</TableHead>
                    <TableHead>Post</TableHead>
                    <TableHead>Performance</TableHead>
                    <TableHead>Engagement</TableHead>
                    <TableHead>Date</TableHead>
                    <TableHead className="text-right">Actions</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {filteredPosts.map((post: SocialPost) => (
                    <TableRow key={post.id}>
                      <TableCell>
                        <i className={`${getPlatformIcon(post.platform)} text-lg platform-icon-${post.platform}`}></i>
                      </TableCell>
                      <TableCell>
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
                          <div className="max-w-xs">
                            <div className="text-sm font-medium text-gray-900 truncate">
                              {truncateText(post.title, 60)}
                            </div>
                          </div>
                        </div>
                      </TableCell>
                      <TableCell>
                        <div className="text-sm text-gray-900">
                          {post.views?.toLocaleString()} views
                        </div>
                      </TableCell>
                      <TableCell>
                        {renderEngagementMetrics(post)}
                      </TableCell>
                      <TableCell className="text-sm text-gray-500">
                        {formatDateToLocal(post.datePosted)}
                      </TableCell>
                      <TableCell className="text-right">
                        <a 
                          href={post.postUrl} 
                          target="_blank" 
                          rel="noopener noreferrer"
                          className="text-primary hover:text-primary-dark text-sm font-medium"
                        >
                          View
                        </a>
                      </TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
              
              {/* Pagination */}
              <div className="flex items-center justify-between mt-6">
                <div className="text-sm text-gray-500">
                  Showing <span className="font-medium">{(pagination.page - 1) * pagination.limit + 1}</span> to{" "}
                  <span className="font-medium">
                    {Math.min(pagination.page * pagination.limit, pagination.total)}
                  </span>{" "}
                  of <span className="font-medium">{pagination.total}</span> posts
                </div>
                <div className="flex gap-2">
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={() => setPage(page - 1)}
                    disabled={page === 1}
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
            </>
          )}
        </CardContent>
      </Card>
    </>
  );
}
