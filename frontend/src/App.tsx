import { Toaster } from "@/components/ui/toaster";
import { Toaster as Sonner } from "@/components/ui/sonner";
import { TooltipProvider } from "@/components/ui/tooltip";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { BrowserRouter, Routes, Route } from "react-router-dom";
import { ClerkProvider, SignedIn, SignedOut, RedirectToSignIn } from "@clerk/clerk-react";
import Index from "./pages/Index";
import Meeting from "./pages/Meeting";
import NotFound from "./pages/NotFound";

const queryClient = new QueryClient();

const clerkPubKey = import.meta.env.VITE_CLERK_PUBLISHABLE_KEY;

if (!clerkPubKey) {
  console.warn("Missing Clerk Publishable Key. Authentication will not work.");
}

const App = () => (
  <ClerkProvider
    publishableKey={clerkPubKey || ""}
    appearance={{
      elements: {
        userButtonPopoverCard: {
          background: "hsl(240 15% 15%)",
          border: "1px solid hsl(var(--border))",
          boxShadow: "var(--shadow-glow)",
        },
        userButtonPopoverHeader: {
          background: "hsl(240 15% 15%)",
          color: "hsl(var(--foreground))",
          borderBottom: "1px solid hsl(var(--border))",
        },
        userButtonPopoverMain: {
          background: "hsl(240 15% 15%)",
          color: "hsl(var(--foreground))",
        },
        userButtonPopoverActionButton: {
          color: "hsl(var(--foreground))",
          "&:hover": {
            background: "hsl(var(--muted))",
          },
        },
        userButtonPopoverActionButtonText: {
          color: "hsl(var(--foreground))",
        },
        userPreviewSecondaryIdentifier: {
          color: "hsl(0 0% 98%)",
        },
        userButtonPopoverMetadatas: {
          color: "hsl(0 0% 98%)",
        },
        userButtonPopoverFooter: {
          background: "hsl(240 15% 30%)",
          borderTop: "1px solid hsl(var(--border))",
          color: "hsl(0 0% 98%)",
        },
      },
      userButton: {
        menuItems: [
          { 
            label: "History", 
            url: "/history", 
            icon: "/path/to/history-icon.svg" // You might want to add a real icon here
          },
          { 
            label: "Manage Account", 
            url: "/user", // Clerk's default for managing account
            icon: "/path/to/manage-account-icon.svg"
          },
          { 
            label: "Sign Out", 
            url: "/", 
            icon: "/path/to/sign-out-icon.svg"
          },
        ],
      },
    }}
  >
    <QueryClientProvider client={queryClient}>
      <TooltipProvider>
        <Toaster />
        <Sonner />
        <BrowserRouter>
          <Routes>
            <Route path="/" element={<Index />} />
            <Route
              path="/meeting"
              element={
                <>
                  <SignedIn>
                    <Meeting />
                  </SignedIn>
                  <SignedOut>
                    <RedirectToSignIn />
                  </SignedOut>
                </>
              }
            />
            {/* ADD ALL CUSTOM ROUTES ABOVE THE CATCH-ALL "*" ROUTE */}
            <Route path="*" element={<NotFound />} />
          </Routes>
        </BrowserRouter>
      </TooltipProvider>
    </QueryClientProvider>
  </ClerkProvider>
);

export default App;
