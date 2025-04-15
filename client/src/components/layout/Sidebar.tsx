import { useState } from "react";
import { Link, useLocation } from "wouter";
import UpgradeModal from "@/components/payment/UpgradeModal";
import { useAuth } from "@/hooks/useAuth";

interface SidebarProps {
  isVisible: boolean;
}

export default function Sidebar({ isVisible }: SidebarProps) {
  const [location] = useLocation();
  const { user } = useAuth();
  const [upgradeModalOpen, setUpgradeModalOpen] = useState(false);

  const isActive = (path: string) => {
    return location === path;
  };

  const linkClass = (path: string) => {
    return `flex items-center px-3 py-2 text-sm font-medium rounded-md ${
      isActive(path)
        ? "bg-primary bg-opacity-10 text-primary"
        : "text-gray-600 hover:bg-gray-100"
    }`;
  };

  return (
    <>
      <aside
        className={`bg-white border-r border-gray-200 w-64 flex-shrink-0 flex flex-col h-full 
          ${isVisible ? "block" : "hidden"} lg:block fixed lg:relative inset-y-0 left-0 z-30`}
      >
        <nav className="mt-5 px-2 flex-grow">
          <div className="space-y-1">
            <Link href="/" className={linkClass("/")}>
              <i className="ri-dashboard-line text-lg mr-3"></i>
              Dashboard
            </Link>
            <Link href="/posts" className={linkClass("/posts")}>
              <i className="ri-article-line text-lg mr-3"></i>
              Posts
            </Link>
            <Link href="/analytics" className={linkClass("/analytics")}>
              <i className="ri-pie-chart-line text-lg mr-3"></i>
              Analytics
            </Link>
            <Link href="/connections" className={linkClass("/connections")}>
              <i className="ri-link text-lg mr-3"></i>
              Connections
            </Link>
          </div>

          <div className="mt-8">
            <h3 className="px-3 text-xs font-semibold text-gray-500 uppercase tracking-wider">
              Platforms
            </h3>
            <div className="mt-2 space-y-1">
              <a href="#youtube" className="flex items-center px-3 py-2 text-sm font-medium rounded-md text-gray-600 hover:bg-gray-100">
                <i className="ri-youtube-line text-lg mr-3 text-youtube"></i>
                YouTube
              </a>
              <a href="#instagram" className="flex items-center px-3 py-2 text-sm font-medium rounded-md text-gray-600 hover:bg-gray-100">
                <i className="ri-instagram-line text-lg mr-3 text-instagram"></i>
                Instagram
              </a>
              <a href="#twitter" className="flex items-center px-3 py-2 text-sm font-medium rounded-md text-gray-600 hover:bg-gray-100">
                <i className="ri-twitter-x-line text-lg mr-3 text-twitter"></i>
                Twitter/X
              </a>
              <a href="#facebook" className="flex items-center px-3 py-2 text-sm font-medium rounded-md text-gray-600 hover:bg-gray-100">
                <i className="ri-facebook-circle-line text-lg mr-3 text-facebook"></i>
                Facebook
              </a>
            </div>
          </div>

          <div className="mt-8">
            <h3 className="px-3 text-xs font-semibold text-gray-500 uppercase tracking-wider">
              Settings
            </h3>
            <div className="mt-2 space-y-1">
              <Link href="/settings" className={linkClass("/settings")}>
                <i className="ri-settings-3-line text-lg mr-3"></i>
                Settings
              </Link>
              <a href="#support" className="flex items-center px-3 py-2 text-sm font-medium rounded-md text-gray-600 hover:bg-gray-100">
                <i className="ri-question-line text-lg mr-3"></i>
                Help & Support
              </a>
            </div>
          </div>
        </nav>

        {/* Only show the upgrade promo for free users */}
        {!user?.isPro && (
          <div className="mt-auto mb-5 mx-3 p-4 bg-gradient-to-r from-purple-500 to-primary rounded-lg text-white">
            <h3 className="font-medium text-sm">Get More Insights</h3>
            <p className="text-xs mt-1 text-white text-opacity-90">
              Upgrade to Pro for full analytics history
            </p>
            <button
              className="mt-3 w-full bg-white text-primary text-sm font-medium py-1.5 rounded-md"
              onClick={() => setUpgradeModalOpen(true)}
            >
              Upgrade Now
            </button>
          </div>
        )}
      </aside>

      <UpgradeModal
        isOpen={upgradeModalOpen}
        onClose={() => setUpgradeModalOpen(false)}
      />
    </>
  );
}
