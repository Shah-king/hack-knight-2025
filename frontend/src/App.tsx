import { Toaster } from "@/components/ui/toaster";
import { Toaster as Sonner } from "@/components/ui/sonner";
import { TooltipProvider } from "@/components/ui/tooltip";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { BrowserRouter, Routes, Route } from "react-router-dom";
import { ClerkProvider, SignedIn, SignedOut, RedirectToSignIn } from "@clerk/clerk-react";
import { ThemeProvider, useTheme } from "@/hooks/useTheme";
import { useMemo } from "react";
import Index from "./pages/Index";
import Meeting from "./pages/Meeting";
import NotFound from "./pages/NotFound";

const queryClient = new QueryClient();

const clerkPubKey = import.meta.env.VITE_CLERK_PUBLISHABLE_KEY;

if (!clerkPubKey) {
  console.warn("Missing Clerk Publishable Key. Authentication will not work.");
}

// Inner component that uses the theme
function AppContent() {
  const { theme } = useTheme();

  // Memoize the appearance config so it updates when theme changes
  const clerkAppearance = useMemo(() => ({
    variables: {
      colorBackground: theme === 'dark' ? '#0f0f14' : '#ffffff',
      colorInputBackground: theme === 'dark' ? '#1a1a24' : '#ffffff',
      colorText: theme === 'dark' ? '#fafafa' : '#0a0a0f',
      colorTextSecondary: theme === 'dark' ? '#a1a1aa' : '#71717a',
      colorPrimary: '#00d9ff',
      borderRadius: '0.75rem',
    },
    elements: {
      // Root modal/card styling
      rootBox: {
        background: theme === 'dark' ? 'hsl(240 8% 8%)' : 'hsl(0 0% 100%)',
      },
      card: {
        background: theme === 'dark' ? 'hsl(240 8% 8%)' : 'hsl(0 0% 100%)',
        boxShadow: 'var(--shadow-glow)',
        border: `1px solid hsl(var(--border))`,
      },
      modalBackdrop: {
        background: theme === 'dark' ? 'rgba(0, 0, 0, 0.7)' : 'rgba(0, 0, 0, 0.5)',
      },
      modalContent: {
        background: theme === 'dark' ? 'hsl(240 8% 8%)' : 'hsl(0 0% 100%)',
      },
      // Headers
      headerTitle: {
        color: theme === 'dark' ? 'hsl(0 0% 98%)' : 'hsl(222.2 84% 4.9%)',
      },
      headerSubtitle: {
        color: theme === 'dark' ? 'hsl(240 5% 64.9%)' : 'hsl(215.4 16.3% 46.9%)',
      },
      // Social buttons (Apple, Facebook, Google)
      socialButtonsBlockButton: {
        background: theme === 'dark' ? 'hsl(240 5% 15%)' : 'hsl(210 40% 96.1%)',
        color: theme === 'dark' ? 'hsl(0 0% 98%)' : 'hsl(222.2 84% 4.9%)',
        border: `1px solid hsl(var(--border))`,
        '&:hover': {
          background: theme === 'dark' ? 'hsl(240 5% 20%)' : 'hsl(210 40% 90%)',
        },
      },
      socialButtonsIconButton: {
        background: theme === 'dark' ? 'hsl(240 5% 15%)' : 'hsl(210 40% 96.1%)',
        color: theme === 'dark' ? 'hsl(0 0% 98%)' : 'hsl(222.2 84% 4.9%)',
        border: `1px solid hsl(var(--border))`,
      },
      // Divider
      dividerLine: {
        background: theme === 'dark' ? 'hsl(240 5% 15%)' : 'hsl(214.3 31.8% 91.4%)',
      },
      dividerText: {
        color: theme === 'dark' ? 'hsl(240 5% 64.9%)' : 'hsl(215.4 16.3% 46.9%)',
      },
      // Form elements
      formFieldLabel: {
        color: theme === 'dark' ? 'hsl(0 0% 98%)' : 'hsl(222.2 84% 4.9%)',
      },
      formFieldInput: {
        background: theme === 'dark' ? 'hsl(240 5% 15%)' : 'hsl(0 0% 100%)',
        color: theme === 'dark' ? 'hsl(0 0% 98%)' : 'hsl(222.2 84% 4.9%)',
        border: `1px solid hsl(var(--border))`,
        '&:focus': {
          borderColor: 'hsl(var(--primary))',
        },
      },
      formFieldInputShowPasswordButton: {
        color: theme === 'dark' ? 'hsl(240 5% 64.9%)' : 'hsl(215.4 16.3% 46.9%)',
      },
      // Primary button (Continue button)
      formButtonPrimary: {
        background: 'var(--gradient-primary)',
        color: 'white',
        '&:hover': {
          opacity: '0.9',
        },
      },
      formButtonSecondary: {
        background: theme === 'dark' ? 'hsl(240 5% 15%)' : 'hsl(210 40% 96.1%)',
        color: theme === 'dark' ? 'hsl(0 0% 98%)' : 'hsl(222.2 84% 4.9%)',
        border: `1px solid hsl(var(--border))`,
      },
      // Footer links
      footerActionLink: {
        color: 'hsl(var(--primary))',
        '&:hover': {
          opacity: '0.8',
        },
      },
      footerActionText: {
        color: theme === 'dark' ? 'hsl(240 5% 64.9%)' : 'hsl(215.4 16.3% 46.9%)',
      },
      identityPreviewText: {
        color: theme === 'dark' ? 'hsl(0 0% 98%)' : 'hsl(222.2 84% 4.9%)',
      },
      identityPreviewEditButton: {
        color: 'hsl(var(--primary))',
      },
      // User button popover
      userButtonPopoverCard: {
        background: theme === 'dark' ? 'hsl(240 8% 8%)' : 'hsl(0 0% 100%)',
        border: `1px solid hsl(var(--border))`,
        boxShadow: 'var(--shadow-glow)',
      },
      userButtonPopoverHeader: {
        background: theme === 'dark' ? 'hsl(240 8% 8%)' : 'hsl(0 0% 100%)',
        color: theme === 'dark' ? 'hsl(0 0% 98%)' : 'hsl(222.2 84% 4.9%)',
        borderBottom: '1px solid hsl(var(--border))',
      },
      userButtonPopoverMain: {
        background: theme === 'dark' ? 'hsl(240 8% 8%)' : 'hsl(0 0% 100%)',
        color: theme === 'dark' ? 'hsl(0 0% 98%)' : 'hsl(222.2 84% 4.9%)',
      },
      userButtonPopoverActionButton: {
        color: theme === 'dark' ? 'hsl(0 0% 98%)' : 'hsl(222.2 84% 4.9%)',
        '&:hover': {
          background: theme === 'dark' ? 'hsl(240 5% 15%)' : 'hsl(210 40% 96.1%)',
        },
      },
      userButtonPopoverActionButtonText: {
        color: theme === 'dark' ? 'hsl(0 0% 98%)' : 'hsl(222.2 84% 4.9%)',
      },
      userButtonPopoverActionButtonIcon: {
        color: theme === 'dark' ? 'hsl(0 0% 98%)' : 'hsl(222.2 84% 4.9%)',
      },
      userPreviewMainIdentifier: {
        color: theme === 'dark' ? 'hsl(0 0% 98%)' : 'hsl(222.2 84% 4.9%)',
      },
      userPreviewSecondaryIdentifier: {
        color: theme === 'dark' ? 'hsl(240 5% 64.9%)' : 'hsl(215.4 16.3% 46.9%)',
      },
      userButtonPopoverMetadatas: {
        color: theme === 'dark' ? 'hsl(240 5% 64.9%)' : 'hsl(215.4 16.3% 46.9%)',
      },
      userButtonPopoverFooter: {
        background: theme === 'dark' ? 'hsl(240 5% 12%)' : 'hsl(210 40% 96.1%)',
        borderTop: '1px solid hsl(var(--border))',
        color: theme === 'dark' ? 'hsl(240 5% 64.9%)' : 'hsl(215.4 16.3% 46.9%)',
      },
      userButtonPopoverFooterLink: {
        color: theme === 'dark' ? 'hsl(240 5% 64.9%)' : 'hsl(215.4 16.3% 46.9%)',
      },
    },
  }), [theme]); // Re-compute when theme changes

  return (
    <ClerkProvider
      publishableKey={clerkPubKey || ""}
      appearance={clerkAppearance}
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
}

const App = () => (
  <ThemeProvider>
    <AppContent />
  </ThemeProvider>
);

export default App;