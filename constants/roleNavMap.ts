import { adminNavLinks, clientNavLinks, landlordNavLinks } from "./nav-links"

export const roleNavMap: Record<string, any[]> = {
  CLIENT: clientNavLinks,
  LANDLORD: landlordNavLinks,
  ADMIN: adminNavLinks,
}
