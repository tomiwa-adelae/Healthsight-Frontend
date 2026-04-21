import { User } from "@/store/useAuth"
import { adminNavLinks, clientNavLinks } from "@/constants/nav-links"
import { roleNavMap } from "@/constants/roleNavMap"

export function getNavByRole(user?: User | null) {
  if (!user) return clientNavLinks

  const role = user.role
  const position = user.adminPosition
  const modules = user.adminModules ?? []

  if (role === "ADMIN") {
    if (position === "SUPER_ADMIN") return adminNavLinks

    if (position === "ADMIN") {
      return adminNavLinks.filter((item) => !(item as any).superAdminOnly)
    }

    // MODERATOR: dashboard + items in their module list
    return adminNavLinks.filter((item: any) => {
      if (item.superAdminOnly) return false
      if (item.slug === "/admin/dashboard") return true
      if (!item.module) return false
      return modules.includes(item.module)
    })
  }

  return roleNavMap[role] ?? clientNavLinks
}
