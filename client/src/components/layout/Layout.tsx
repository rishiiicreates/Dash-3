import { useState } from "react";
import Header from "@/components/layout/Header";
import Sidebar from "@/components/layout/Sidebar";
import { DateRangeOption } from "@/lib/dateUtils";

interface LayoutProps {
  children: React.ReactNode;
  dateRange: DateRangeOption;
  setDateRange: (range: DateRangeOption) => void;
}

export default function Layout({ children, dateRange, setDateRange }: LayoutProps) {
  const [sidebarVisible, setSidebarVisible] = useState(false);

  const toggleSidebar = () => {
    setSidebarVisible(!sidebarVisible);
  };

  return (
    <div className="min-h-screen flex flex-col">
      <Header 
        toggleSidebar={toggleSidebar} 
        dateRange={dateRange}
        setDateRange={setDateRange}
      />
      
      <div className="flex flex-1 overflow-hidden">
        <Sidebar isVisible={sidebarVisible} />
        
        <main className="flex-1 overflow-y-auto p-4 lg:p-6 bg-gray-50">
          {children}
        </main>
      </div>
    </div>
  );
}
