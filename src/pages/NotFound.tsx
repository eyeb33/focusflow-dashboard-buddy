
import { useLocation } from "react-router-dom";
import { useEffect } from "react";
import { Button } from "@/components/ui/button";
import { Link } from "react-router-dom";

const NotFound = () => {
  const location = useLocation();

  useEffect(() => {
    console.error(
      "404 Error: User attempted to access non-existent route:",
      location.pathname
    );
  }, [location.pathname]);

  return (
    <div className="min-h-screen flex items-center justify-center bg-background">
      <div className="text-center px-4">
        <div className="mb-8">
          <div className="inline-flex items-center justify-center w-20 h-20 rounded-full bg-muted mb-4">
            <span className="text-4xl font-bold">404</span>
          </div>
          <h1 className="text-3xl font-bold mb-2">Page not found</h1>
          <p className="text-muted-foreground mb-8 max-w-md">
            The page you're looking for doesn't exist or has been moved. Let's get you back on track.
          </p>
        </div>
        <div className="flex flex-col sm:flex-row gap-4 justify-center">
          <Button asChild className="bg-pomodoro-work hover:bg-pomodoro-work/90">
            <Link to="/">Return to Timer</Link>
          </Button>
          <Button variant="outline" asChild>
            <Link to="/dashboard">View Dashboard</Link>
          </Button>
        </div>
      </div>
    </div>
  );
};

export default NotFound;
