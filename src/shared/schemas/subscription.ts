import { z } from 'zod'

// Subscription types
export const SubscriptionTypeSchema = z.enum(['dashboard', 'tab', 'test'])

export type SubscriptionType = z.infer<typeof SubscriptionTypeSchema>

// Base subscription
const BaseSubscriptionSchema = z.object({
  id: z.string(),
  createdAt: z.string(),
  dashboardName: z.string(),
})

// Dashboard subscription
export const DashboardSubscriptionSchema = BaseSubscriptionSchema.extend({
  type: z.literal('dashboard'),
})

export type DashboardSubscription = z.infer<typeof DashboardSubscriptionSchema>

// Tab subscription
export const TabSubscriptionSchema = BaseSubscriptionSchema.extend({
  type: z.literal('tab'),
  tabName: z.string(),
})

export type TabSubscription = z.infer<typeof TabSubscriptionSchema>

// Test subscription
export const TestSubscriptionSchema = BaseSubscriptionSchema.extend({
  type: z.literal('test'),
  tabName: z.string(),
  testName: z.string(),
})

export type TestSubscription = z.infer<typeof TestSubscriptionSchema>

// Union of all subscription types
export const SubscriptionSchema = z.discriminatedUnion('type', [
  DashboardSubscriptionSchema,
  TabSubscriptionSchema,
  TestSubscriptionSchema,
])

export type Subscription = z.infer<typeof SubscriptionSchema>

// Subscriptions storage schema
export const SubscriptionsStorageSchema = z.object({
  version: z.literal(1),
  subscriptions: z.array(SubscriptionSchema),
  exportedAt: z.string().optional(),
})

export type SubscriptionsStorage = z.infer<typeof SubscriptionsStorageSchema>

// Notification settings
export const NotificationSettingsSchema = z.object({
  enabled: z.boolean(),
  pollIntervalSeconds: z.number().min(30).max(3600),
  quietHoursStart: z.string().optional(), // HH:mm format
  quietHoursEnd: z.string().optional(),
  browserNotifications: z.boolean(),
})

export type NotificationSettings = z.infer<typeof NotificationSettingsSchema>

// Default notification settings
export const defaultNotificationSettings: NotificationSettings = {
  enabled: true,
  pollIntervalSeconds: 60,
  browserNotifications: true,
}

// Subscription target types (without id and createdAt)
export type DashboardSubscriptionTarget = {
  type: 'dashboard'
  dashboardName: string
}

export type TabSubscriptionTarget = {
  type: 'tab'
  dashboardName: string
  tabName: string
}

export type TestSubscriptionTarget = {
  type: 'test'
  dashboardName: string
  tabName: string
  testName: string
}

export type SubscriptionTarget =
  | DashboardSubscriptionTarget
  | TabSubscriptionTarget
  | TestSubscriptionTarget

// Helper to generate subscription ID
export function generateSubscriptionId(subscription: SubscriptionTarget): string {
  switch (subscription.type) {
    case 'dashboard':
      return `dashboard:${subscription.dashboardName}`
    case 'tab':
      return `tab:${subscription.dashboardName}:${subscription.tabName}`
    case 'test':
      return `test:${subscription.dashboardName}:${subscription.tabName}:${subscription.testName}`
  }
}
