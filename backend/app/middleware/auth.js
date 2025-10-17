import { clerkClient, requireAuth } from '@clerk/express';

// Middleware to verify Clerk authentication
export const verifyAuth = requireAuth();

// Middleware to get user info from Clerk
export const getUserInfo = async (req, res, next) => {
  try {
    if (req.auth && req.auth.userId) {
      const user = await clerkClient.users.getUser(req.auth.userId);
      req.user = {
        id: user.id,
        email: user.emailAddresses[0]?.emailAddress,
        firstName: user.firstName,
        lastName: user.lastName
      };
    }
    next();
  } catch (error) {
    console.error('Error fetching user info:', error);
    next();
  }
};

// Optional auth - doesn't require authentication but adds user info if present
export const optionalAuth = async (req, res, next) => {
  try {
    if (req.auth && req.auth.userId) {
      const user = await clerkClient.users.getUser(req.auth.userId);
      req.user = {
        id: user.id,
        email: user.emailAddresses[0]?.emailAddress,
        firstName: user.firstName,
        lastName: user.lastName
      };
    }
    next();
  } catch (error) {
    console.error('Error in optional auth:', error);
    next();
  }
};
