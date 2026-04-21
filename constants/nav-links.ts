import {
  IconBell,
  IconBookmark,
  IconBuildingSkyscraper,
  IconCalendar,
  IconCircleCheck,
  IconClipboardList,
  IconLayoutDashboard,
  IconShieldCheck,
  IconUsers,
  IconUsersGroup,
  IconHomeDot,
  IconFileText,
  IconCurrencyNaira,
  IconClipboardCheck,
  IconWallet,
  IconPigMoney,
} from "@tabler/icons-react"

// ── Tenant / CLIENT nav ────────────────────────────────────────────────────────

export const clientNavLinks = [
  {
    label: "Dashboard",
    slug: "/dashboard",
    icon: IconLayoutDashboard,
  },
  {
    label: "Saved Listings",
    slug: "/saved",
    icon: IconBookmark,
  },
  {
    label: "My Applications",
    slug: "/applications",
    icon: IconClipboardList,
  },
  {
    label: "My Bookings",
    slug: "/bookings",
    icon: IconCalendar,
  },
  {
    label: "Property Tours",
    slug: "/tours",
    icon: IconHomeDot,
  },
  {
    label: "Agreements",
    slug: "/agreements",
    icon: IconFileText,
  },
  {
    label: "Rental Payments",
    slug: "/rental-payments",
    icon: IconCurrencyNaira,
  },
  {
    label: "FirstKey",
    slug: "/firstkey",
    icon: IconPigMoney,
  },
  {
    label: "Wallet",
    slug: "/wallet",
    icon: IconWallet,
  },
  {
    label: "Notifications",
    slug: "/notifications",
    icon: IconBell,
  },
]

// ── Landlord nav ───────────────────────────────────────────────────────────────

export const landlordNavLinks = [
  {
    label: "Dashboard",
    slug: "/landlord/dashboard",
    icon: IconLayoutDashboard,
  },
  {
    label: "My Listings",
    slug: "/landlord/listings",
    icon: IconBuildingSkyscraper,
  },
  {
    label: "Applications",
    slug: "/landlord/listings/applications",
    icon: IconClipboardList,
  },
  {
    label: "Bookings",
    slug: "/landlord/listings/bookings",
    icon: IconCalendar,
  },
  {
    label: "Property Tours",
    slug: "/landlord/tours",
    icon: IconHomeDot,
  },
  {
    label: "Agreements",
    slug: "/landlord/agreements",
    icon: IconFileText,
  },
  {
    label: "Earnings",
    slug: "/landlord/earnings",
    icon: IconCurrencyNaira,
  },
  {
    label: "Shortlets",
    slug: "/landlord/listings/shortlets",
    icon: IconCircleCheck,
  },
  {
    label: "Leases",
    slug: "/landlord/listings/leases",
    icon: IconShieldCheck,
  },
  {
    label: "Notifications",
    slug: "/landlord/notifications",
    icon: IconBell,
  },
]

// ── Admin nav ──────────────────────────────────────────────────────────────────

export const adminNavLinks = [
  {
    label: "Dashboard",
    slug: "/admin/dashboard",
    icon: IconLayoutDashboard,
  },
  {
    label: "Moderation Queue",
    slug: "/admin/moderation",
    icon: IconCircleCheck,
    module: "moderation",
  },
  {
    label: "All Listings",
    slug: "/admin/listings",
    icon: IconBuildingSkyscraper,
    module: "listings",
  },
  {
    label: "Property Tours",
    slug: "/admin/tours",
    icon: IconHomeDot,
    module: "bookings",
  },
  {
    label: "Screening Applications",
    slug: "/admin/screening-applications",
    icon: IconClipboardCheck,
    module: "bookings",
  },
  {
    label: "Agreements",
    slug: "/admin/agreements",
    icon: IconFileText,
    module: "bookings",
  },
  {
    label: "Users",
    slug: "/admin/users",
    icon: IconUsers,
    module: "users",
  },
  {
    label: "Admin Team",
    slug: "/admin/team",
    icon: IconUsersGroup,
    superAdminOnly: true,
  },
]
