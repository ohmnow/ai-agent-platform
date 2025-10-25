import { mutation, query } from "./_generated/server";
import { ConvexError, v } from "convex/values";
import { UserRole } from "../hooks/auth/useUserRole";

/**
 * Create or update a user in the database when they sign up with Clerk
 */
export const createOrUpdateUser = mutation({
  args: {
    clerkId: v.string(),
    email: v.string(),
    firstName: v.string(),
    lastName: v.string(),
    imageUrl: v.optional(v.string()),
    role: v.optional(v.union(
      v.literal("customer"),
      v.literal("property_manager"),
      v.literal("service_provider"),
      v.literal("company_admin")
    )),
  },
  handler: async (ctx, args) => {
    // Check if user already exists
    const existingUser = await ctx.db
      .query("users")
      .withIndex("by_clerk_id", (q) => q.eq("clerk_user_id", args.clerkId))
      .unique();

    if (existingUser) {
      // Update user if they exist
      return await ctx.db.patch(existingUser._id, {
        email: args.email,
        first_name: args.firstName,
        last_name: args.lastName,
        profile_image_url: args.imageUrl,
      });
    }

    // Default role is customer if not specified
    const role = args.role || "customer";

    // Create new user
    const userId = await ctx.db.insert("users", {
      clerk_user_id: args.clerkId,
      email: args.email,
      first_name: args.firstName,
      last_name: args.lastName,
      profile_image_url: args.imageUrl,
      role,
    });

    // If role is customer, create a customer record as well
    if (role === "customer") {
      await ctx.db.insert("customers", {
        user_id: userId,
        customer_type: "individual",
      });
    } else if (role === "property_manager") {
      await ctx.db.insert("customers", {
        user_id: userId,
        customer_type: "property_manager",
      });
    } else if (role === "service_provider") {
      await ctx.db.insert("service_providers", {
        user_id: userId,
        skills: [],
        certifications: [],
        availability: {},
        status: "available",
      });
    }

    return userId;
  },
});

/**
 * Get a user by their Clerk ID
 */
export const getUserByClerkId = query({
  args: { clerkId: v.string() },
  handler: async (ctx, args) => {
    const user = await ctx.db
      .query("users")
      .withIndex("by_clerk_id", (q) => q.eq("clerk_user_id", args.clerkId))
      .unique();

    return user;
  },
});

/**
 * Update a user's role
 */
export const updateUserRole = mutation({
  args: {
    userId: v.id("users"),
    role: v.union(
      v.literal("customer"),
      v.literal("property_manager"),
      v.literal("service_provider"),
      v.literal("company_admin")
    ),
  },
  handler: async (ctx, args) => {
    const user = await ctx.db.get(args.userId);
    if (!user) {
      throw new ConvexError("User not found");
    }

    // Update the user's role
    return await ctx.db.patch(args.userId, {
      role: args.role,
    });
  },
}); 