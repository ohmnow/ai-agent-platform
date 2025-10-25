import { defineSchema, defineTable } from "convex/server";
import { v } from "convex/values";

/**
 * Enum for user roles in the application.
 */
const roleEnum = v.union(
  v.literal("customer"),
  v.literal("property_manager"),
  v.literal("service_provider"),
  v.literal("company_admin")
);

/**
 * Status enum for service requests.
 */
const requestStatusEnum = v.union(
  v.literal("pending"),
  v.literal("scheduled"),
  v.literal("in_progress"),
  v.literal("completed"),
  v.literal("cancelled")
);

/**
 * Status enum for subscriptions.
 */
const subscriptionStatusEnum = v.union(
  v.literal("active"),
  v.literal("paused"),
  v.literal("cancelled")
);

export default defineSchema({
  // User table to store user information and link with Clerk
  users: defineTable({
    clerk_user_id: v.string(),
    role: roleEnum,
    email: v.string(),
    first_name: v.string(),
    last_name: v.string(),
    profile_image_url: v.optional(v.string()),
  })
    .index("by_clerk_id", ["clerk_user_id"])
    .index("by_email", ["email"]),

  // Customer table to store customer-specific information
  customers: defineTable({
    user_id: v.id("users"),
    customer_type: v.union(v.literal("individual"), v.literal("property_manager")),
    address: v.optional(
      v.object({
        street: v.string(),
        city: v.string(),
        state: v.string(),
        zip: v.string(),
        country: v.string(),
      })
    ),
    subscription_id: v.optional(v.id("subscription_plans")),
    subscription_status: v.optional(subscriptionStatusEnum),
    payment_method_id: v.optional(v.string()),
    preferences: v.optional(v.any()),
  }).index("by_user_id", ["user_id"]),

  // Property organizations (for property managers)
  property_organizations: defineTable({
    name: v.string(),
    description: v.optional(v.string()),
    owner_id: v.id("users"),
    members: v.array(v.id("users")),
  }).index("by_owner", ["owner_id"]),

  // Individual properties
  properties: defineTable({
    organization_id: v.optional(v.id("property_organizations")),
    owner_id: v.id("users"),
    name: v.string(),
    property_type: v.union(
      v.literal("residential"),
      v.literal("commercial"),
      v.literal("mixed")
    ),
    address: v.object({
      street: v.string(),
      city: v.string(),
      state: v.string(),
      zip: v.string(),
      country: v.string(),
    }),
    budget: v.optional(v.number()),
    payment_method_id: v.optional(v.string()),
    subscription_id: v.optional(v.id("subscription_plans")),
    managers: v.array(v.id("users")),
    status: v.union(v.literal("active"), v.literal("inactive")),
  })
    .index("by_owner", ["owner_id"])
    .index("by_organization", ["organization_id"]),

  // Subscription plans offered
  subscription_plans: defineTable({
    name: v.string(),
    description: v.string(),
    price: v.number(),
    billing_frequency: v.union(
      v.literal("monthly"),
      v.literal("quarterly"),
      v.literal("yearly")
    ),
    features: v.array(v.string()),
    service_credits: v.number(),
    is_active: v.boolean(),
  }),

  // Service providers
  service_providers: defineTable({
    user_id: v.id("users"),
    skills: v.array(v.string()),
    certifications: v.array(v.string()),
    availability: v.any(), // Complex object for availability
    rating: v.optional(v.number()),
    review_count: v.optional(v.number()),
    status: v.union(
      v.literal("available"),
      v.literal("busy"),
      v.literal("unavailable")
    ),
    location: v.optional(
      v.object({
        latitude: v.number(),
        longitude: v.number(),
      })
    ),
  }).index("by_user_id", ["user_id"]),

  // Service requests
  service_requests: defineTable({
    customer_id: v.id("users"),
    property_id: v.optional(v.id("properties")),
    organization_id: v.optional(v.id("property_organizations")),
    service_type: v.string(),
    description: v.string(),
    images: v.array(v.string()), // Array of image URLs
    urgency: v.union(
      v.literal("low"),
      v.literal("medium"),
      v.literal("high"),
      v.literal("emergency")
    ),
    status: requestStatusEnum,
    scheduled_time: v.optional(v.number()), // Unix timestamp
    estimated_duration: v.optional(v.number()), // Minutes
    location: v.object({
      address: v.string(),
      coordinates: v.optional(
        v.object({
          latitude: v.number(),
          longitude: v.number(),
        })
      ),
    }),
    provider_id: v.optional(v.id("users")),
    budget_code: v.optional(v.string()),
    approval_required: v.boolean(),
    approved_by: v.optional(v.id("users")),
    approved_at: v.optional(v.number()), // Unix timestamp
  })
    .index("by_customer", ["customer_id"])
    .index("by_property", ["property_id"])
    .index("by_organization", ["organization_id"])
    .index("by_provider", ["provider_id"])
    .index("by_status", ["status"]),
}); 