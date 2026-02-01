import NextAuth from "next-auth";
import GitHub from "next-auth/providers/github";
import { createAdminClient } from "./supabase/server";

// Get allowed users from environment
const ALLOWED_USERS = (process.env.ALLOWED_GITHUB_USERS || "")
  .split(",")
  .map((u) => u.trim().toLowerCase())
  .filter(Boolean);

// Log login attempt to Supabase
async function logLoginAttempt(
  githubUsername: string,
  githubId: string | null,
  allowed: boolean,
  request?: Request
) {
  try {
    const supabase = createAdminClient();
    
    // Try to get IP and user agent from request if available
    let ipAddress: string | null = null;
    let userAgent: string | null = null;
    
    if (request) {
      ipAddress = request.headers.get("x-forwarded-for")?.split(",")[0] || 
                  request.headers.get("x-real-ip") || 
                  null;
      userAgent = request.headers.get("user-agent");
    }

    await supabase.from("login_attempts").insert({
      github_username: githubUsername,
      github_id: githubId,
      environment: process.env.VERCEL_ENV || process.env.NODE_ENV || "development",
      allowed,
      ip_address: ipAddress,
      user_agent: userAgent,
    });
  } catch (error) {
    console.error("Failed to log login attempt:", error);
  }
}

export const { handlers, signIn, signOut, auth } = NextAuth({
  providers: [
    GitHub({
      clientId: process.env.GITHUB_CLIENT_ID!,
      clientSecret: process.env.GITHUB_CLIENT_SECRET!,
    }),
  ],
  callbacks: {
    async signIn({ account, profile }) {
      // Get GitHub username from profile
      const githubUsername = (profile as { login?: string })?.login?.toLowerCase();
      const githubId = account?.providerAccountId || null;

      if (!githubUsername) {
        console.error("No GitHub username found in profile");
        await logLoginAttempt("unknown", githubId, false);
        return false;
      }

      // Check if user is in allowlist
      const isAllowed = ALLOWED_USERS.length === 0 || ALLOWED_USERS.includes(githubUsername);

      // Log the attempt
      await logLoginAttempt(githubUsername, githubId, isAllowed);

      if (!isAllowed) {
        console.log(`Access denied for GitHub user: ${githubUsername}`);
        return "/login?error=AccessDenied";
      }

      return true;
    },
    async jwt({ token, user, account, profile }) {
      if (user) {
        token.id = user.id;
      }
      if (profile) {
        token.githubUsername = (profile as { login?: string }).login;
      }
      if (account) {
        token.githubId = account.providerAccountId;
      }
      return token;
    },
    async session({ session, token }) {
      if (token && session.user) {
        session.user.id = token.id as string;
        // Add GitHub info to session
        (session.user as { githubUsername?: string }).githubUsername = token.githubUsername as string;
      }
      return session;
    },
  },
  pages: {
    signIn: "/login",
    error: "/login",
  },
});
