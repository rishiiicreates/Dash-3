import { Route, Switch } from "wouter";
import { useState } from "react";
import Login from "@/pages/Login";
import Dashboard from "@/pages/Dashboard";
import NotFound from "@/pages/not-found";
import PostsPage from "@/pages/PostsPage";
import Analytics from "@/pages/Analytics";
import Connections from "@/pages/Connections";
import Settings from "@/pages/Settings";
import { useAuth } from "@/hooks/useAuth";
import Layout from "@/components/layout/Layout";
import { useEffect } from "react";
import { useLocation } from "wouter";
import { DateRangeOption } from "@/lib/dateUtils";

function App() {
  const { isInitializing, isAuthenticated, user } = useAuth();
  const [location, setLocation] = useLocation();
  const [dateRange, setDateRange] = useState<DateRangeOption>("7d");

  useEffect(() => {
    // Redirect to login if not authenticated
    if (!isInitializing && !isAuthenticated && location !== "/login") {
      setLocation("/login");
    }

    // Redirect to dashboard if authenticated and on login page
    if (!isInitializing && isAuthenticated && location === "/login") {
      setLocation("/");
    }
  }, [isInitializing, isAuthenticated, location, setLocation]);

  // Show loading state while initializing auth
  if (isInitializing) {
    return (
      <div className="flex items-center justify-center min-h-screen bg-gray-50">
        <div className="animate-spin rounded-full h-12 w-12 border-t-2 border-b-2 border-primary"></div>
      </div>
    );
  }

  return (
    <Switch>
      <Route path="/login" component={Login} />
      
      {/* Protected routes */}
      {isAuthenticated && (
        <Route path="/">
          <Layout dateRange={dateRange} setDateRange={setDateRange}>
            <Dashboard dateRange={dateRange} setDateRange={setDateRange} />
          </Layout>
        </Route>
      )}
      
      {isAuthenticated && (
        <Route path="/posts">
          <Layout dateRange={dateRange} setDateRange={setDateRange}>
            <PostsPage dateRange={dateRange} setDateRange={setDateRange} />
          </Layout>
        </Route>
      )}
      
      {isAuthenticated && (
        <Route path="/analytics">
          <Layout dateRange={dateRange} setDateRange={setDateRange}>
            <Analytics dateRange={dateRange} setDateRange={setDateRange} />
          </Layout>
        </Route>
      )}
      
      {isAuthenticated && (
        <Route path="/connections">
          <Layout dateRange={dateRange} setDateRange={setDateRange}>
            <Connections />
          </Layout>
        </Route>
      )}
      
      {isAuthenticated && (
        <Route path="/settings">
          <Layout dateRange={dateRange} setDateRange={setDateRange}>
            <Settings />
          </Layout>
        </Route>
      )}
      
      <Route component={NotFound} />
    </Switch>
  );
}

export default App;
