import { useLocation } from "react-router-dom";
import { useEffect } from "react";

const NotFound = () => {
  const location = useLocation();

  useEffect(() => {
    console.error(
      "404 Error: User attempted to access non-existent route:",
      location.pathname
    );
  }, [location.pathname]);

  // Check if user tried to access a component file directly
  const attemptedPath = location.pathname;
  const suggestedPath = attemptedPath.replace(/\.tsx?$/, '');
  
  return (
    <div className="min-h-screen flex items-center justify-center bg-background">
      <div className="text-center max-w-md px-6">
        <h1 className="text-4xl font-bold mb-4 text-foreground">404</h1>
        <p className="text-xl text-muted-foreground mb-4">Oops! Page not found</p>
        {attemptedPath.match(/\.tsx?$/) && (
          <p className="text-sm text-muted-foreground mb-4">
            Tip: Try accessing <a href={suggestedPath} className="text-primary hover:underline font-medium">{suggestedPath}</a> instead
          </p>
        )}
        <a href="/" className="text-primary hover:text-primary/80 underline">
          Return to Home
        </a>
      </div>
    </div>
  );
};

export default NotFound;
