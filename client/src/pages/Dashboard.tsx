import { useEffect, useState } from "react";
import { useAuth } from "@/hooks/useAuth";
import { usePlatformData } from "@/hooks/usePlatformData";
import { Button } from "@/components/ui/button";
import MetricsSummary from "@/components/dashboard/MetricsSummary";
import PostPerformance from "@/components/dashboard/PostPerformance";
import PlatformCard from "@/components/dashboard/PlatformCard";
import ApiKeysForm from "@/components/onboarding/ApiKeysForm";
import UpgradeModal from "@/components/payment/UpgradeModal";
import DateRangeSelector from "@/components/dashboard/DateRangeSelector";
import { DateRangeOption } from "@/lib/dateUtils";

interface DashboardProps {
  dateRange: DateRangeOption;
  setDateRange: (range: DateRangeOption) => void;
}

export default function Dashboard({ dateRange, setDateRange }: DashboardProps) {
  const { user } = useAuth();
  const [isRefreshing, setIsRefreshing] = useState(false);
  const [showOnboarding, setShowOnboarding] = useState(false);
  const [showUpgradeModal, setShowUpgradeModal] = useState(false);
  
  // Fetch platform stats
  const { 
    data: platformStats, 
    isLoading, 
    isError, 
    refetch 
  } = usePlatformData({ 
    userId: user?.id, 
    dateRange 
  });
  
  // Show onboarding modal on first login
  useEffect(() => {
    if (user?.isFirstLogin) {
      setShowOnboarding(true);
    }
  }, [user]);
  
  const handleRefresh = async () => {
    setIsRefreshing(true);
    await refetch();
    setIsRefreshing(false);
  };
  
  const handleUpgradeClick = () => {
    setShowUpgradeModal(true);
  };

  return (
    <>
      {/* Free plan banner */}
      {!user?.isPro && (
        <div className="bg-yellow-50 border border-yellow-200 rounded-lg p-3 flex items-center justify-between mb-6">
          <div className="flex items-center">
            <i className="ri-information-line text-yellow-500 mr-2"></i>
            <p className="text-sm text-yellow-700">You're on the free plan. Analytics limited to the last 7 days.</p>
          </div>
          <button 
            className="text-sm font-medium text-primary hover:text-primary-dark"
            onClick={handleUpgradeClick}
          >
            Upgrade
          </button>
        </div>
      )}
      
      <div className="flex flex-col lg:flex-row lg:items-center justify-between mb-6">
        <h1 className="text-2xl font-semibold text-gray-800">Dashboard Overview</h1>
        
        {/* Mobile date range selector */}
        <div className="lg:hidden mt-4">
          <DateRangeSelector dateRange={dateRange} setDateRange={setDateRange} />
        </div>
        
        <div className="flex mt-4 lg:mt-0 space-x-2">
          <Button variant="outline" size="sm" onClick={handleRefresh} disabled={isRefreshing}>
            {isRefreshing ? (
              <>
                <div className="h-4 w-4 mr-1.5 rounded-full border-2 border-t-transparent animate-spin"></div>
                Refreshing...
              </>
            ) : (
              <>
                <i className="ri-refresh-line mr-1.5"></i>
                Refresh
              </>
            )}
          </Button>
          <Button variant="outline" size="sm">
            <i className="ri-download-line mr-1.5"></i>
            Export
          </Button>
        </div>
      </div>
      
      {/* Metrics Summary */}
      <MetricsSummary dateRange={dateRange} userId={user?.id} />
      
      {/* Platform Cards */}
      {isLoading ? (
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 mb-8">
          {[...Array(4)].map((_, i) => (
            <div key={i} className="bg-white rounded-lg shadow-sm overflow-hidden h-[300px] animate-pulse">
              <div className="p-5">
                <div className="flex justify-between items-center mb-4">
                  <div className="flex items-center">
                    <div className="h-6 w-6 bg-gray-200 rounded-full mr-2"></div>
                    <div className="h-4 w-20 bg-gray-200 rounded"></div>
                  </div>
                  <div className="h-5 w-20 bg-gray-200 rounded-full"></div>
                </div>
                <div className="grid grid-cols-2 gap-4 mb-4">
                  <div>
                    <div className="h-3 w-16 bg-gray-200 rounded mb-2"></div>
                    <div className="h-6 w-14 bg-gray-300 rounded mb-1"></div>
                    <div className="h-3 w-20 bg-gray-200 rounded"></div>
                  </div>
                  <div>
                    <div className="h-3 w-16 bg-gray-200 rounded mb-2"></div>
                    <div className="h-6 w-14 bg-gray-300 rounded mb-1"></div>
                    <div className="h-3 w-20 bg-gray-200 rounded"></div>
                  </div>
                </div>
                <div className="bg-gray-100 h-32 rounded-lg"></div>
              </div>
              <div className="border-t border-gray-100 px-5 py-3 flex justify-between">
                <div className="h-4 w-20 bg-gray-200 rounded"></div>
                <div className="h-4 w-32 bg-gray-200 rounded"></div>
              </div>
            </div>
          ))}
        </div>
      ) : isError ? (
        <div className="bg-red-50 border border-red-200 text-red-700 px-4 py-3 rounded-lg mb-8">
          Error loading platform data. Please try again.
        </div>
      ) : (
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 mb-8">
          {Array.isArray(platformStats) && platformStats.map((stats) => (
            <PlatformCard key={stats.platform} stats={stats} />
          ))}
        </div>
      )}
      
      {/* Post Performance */}
      <PostPerformance dateRange={dateRange} userId={user?.id} />
      
      {/* Onboarding Modal */}
      <ApiKeysForm
        isOpen={showOnboarding}
        onClose={() => setShowOnboarding(false)}
      />
      
      {/* Upgrade Modal */}
      <UpgradeModal 
        isOpen={showUpgradeModal}
        onClose={() => setShowUpgradeModal(false)}
      />
    </>
  );
}
