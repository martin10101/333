import { createClient } from '@base44/sdk';
// import { getAccessToken } from '@base44/sdk/utils/auth-utils';

// Create a client with authentication required
export const base44 = createClient({
  appId: "68d94e316d8680ff9f8d8c97", 
  requiresAuth: true // Ensure authentication is required for all operations
});
