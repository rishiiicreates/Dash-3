import { useQuery } from "@tanstack/react-query";
import { SocialStats, Platform } from "@shared/schema";
import { DateRangeOption } from "@/lib/dateUtils";
import { useToast } from "@/hooks/use-toast";

interface UsePlatformDataOptions {
  userId?: number;
  platform?: Platform | 'all';
  dateRange: DateRangeOption;
  enabled?: boolean;
}

export function usePlatformData({
  userId = 1,
  platform = 'all',
  dateRange,
  enabled = true
}: UsePlatformDataOptions) {
  const { toast } = useToast();
  
  const fetchStats = async () => {
    const days = dateRange === '30d' ? 30 : 7;
    const url = platform === 'all' 
      ? `/api/stats?userId=${userId}&days=${days}` 
      : `/api/stats?userId=${userId}&days=${days}&platform=${platform}`;
    
    const res = await fetch(url);
    
    if (res.status === 403) {
      // Free plan limitation
      const data = await res.json();
      if (data.upgrade) {
        toast({
          title: "Free Plan Limitation",
          description: "Free users can only access data from the last 7 days. Upgrade to access more data.",
          variant: "default"
        });
      }
      throw new Error(data.message);
    }
    
    if (!res.ok) {
      const error = await res.json();
      throw new Error(error.message || "Failed to fetch platform data");
    }
    
    return platform === 'all'
      ? (res.json() as Promise<SocialStats[]>)
      : (res.json() as Promise<SocialStats>);
  };
  
  return useQuery({
    queryKey: ['/api/stats', userId, platform, dateRange],
    queryFn: fetchStats,
    enabled,
    retry: false,
    refetchOnWindowFocus: false
  });
}
