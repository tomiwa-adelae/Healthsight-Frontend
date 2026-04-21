"use client";

import {
  IconCreditCard,
  IconDotsVertical,
  IconLogout,
  IconNotification,
  IconUserCircle,
  IconArrowLeft,
  IconShieldFilled,
} from "@tabler/icons-react";

import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuGroup,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import {
  SidebarMenu,
  SidebarMenuButton,
  SidebarMenuItem,
  useSidebar,
} from "@/components/ui/sidebar";
import { DEFAULT_PROFILE_IMAGE } from "@/constants";
import { useAuth } from "@/store/useAuth";
import { useSignout } from "@/hooks/use-signout";
import { Badge } from "./ui/badge";
import Link from "next/link";
import { usePathname } from "next/navigation";

export function NavUser() {
  const { user } = useAuth();
  const { isMobile } = useSidebar();
  const handleSignout = useSignout();
  const pathname = usePathname();
  const isAdminArea = pathname.startsWith("/a/") || pathname === "/a";

  if (!user) return null;

  return (
    <SidebarMenu>
      <SidebarMenuItem>
        <DropdownMenu>
          <DropdownMenuTrigger asChild>
            <SidebarMenuButton
              size="lg"
              className="data-[state=open]:bg-sidebar-accent data-[state=open]:text-sidebar-accent-foreground"
            >
              <Avatar>
                <AvatarImage
                  src={user?.image || DEFAULT_PROFILE_IMAGE}
                  alt={`${user?.firstName}'s picture` || ""}
                  className="object-cover size-full"
                />
                <AvatarFallback>Ekovibe</AvatarFallback>
              </Avatar>
              <div className="grid flex-1 text-left text-sm leading-tight">
                <span className="truncate font-medium">
                  {user.firstName} {user?.lastName}
                </span>
                <span className="text-muted-foreground truncate text-xs">
                  {user.email}
                </span>
              </div>
              <IconDotsVertical className="ml-auto size-4" />
            </SidebarMenuButton>
          </DropdownMenuTrigger>
          <DropdownMenuContent
            className="w-(--radix-dropdown-menu-trigger-width) min-w-56 rounded-lg"
            side={isMobile ? "bottom" : "right"}
            align="end"
            sideOffset={4}
          >
            <DropdownMenuLabel className="p-0 font-normal">
              <div className="flex items-center gap-2 px-1 py-1.5 text-left text-sm">
                <Avatar>
                  <AvatarImage
                    src={user?.image || DEFAULT_PROFILE_IMAGE}
                    alt={`${user?.firstName}'s picture` || ""}
                    className="object-cover size-full"
                  />
                  <AvatarFallback>Ekovibe</AvatarFallback>
                </Avatar>
                <div className="grid flex-1 text-left text-sm leading-tight">
                  <span className="truncate font-medium">{user.firstName}</span>
                  <span className="text-muted-foreground truncate text-xs">
                    {user.email}
                  </span>
                </div>
              </div>
            </DropdownMenuLabel>
            <DropdownMenuSeparator />
            <DropdownMenuGroup>
              <DropdownMenuItem disabled>
                <IconUserCircle />
                Account{" "}
                <Badge variant="secondary" className="ml-auto">
                  Soon
                </Badge>
              </DropdownMenuItem>
              <DropdownMenuItem disabled>
                <IconCreditCard />
                Billing{" "}
                <Badge variant="secondary" className="ml-auto">
                  Soon
                </Badge>
              </DropdownMenuItem>
              <DropdownMenuItem disabled>
                <IconNotification />
                Notifications{" "}
                <Badge variant="secondary" className="ml-auto">
                  Soon
                </Badge>
              </DropdownMenuItem>
            </DropdownMenuGroup>
            <DropdownMenuSeparator />
            <DropdownMenuItem asChild>
              {isAdminArea ? (
                <Link href="/dashboard">
                  <IconArrowLeft />
                  Member View
                </Link>
              ) : (
                <Link href="/a/dashboard">
                  <IconShieldFilled />
                  Admin Dashboard
                </Link>
              )}
            </DropdownMenuItem>
            <DropdownMenuSeparator />
            <DropdownMenuItem onClick={handleSignout}>
              <IconLogout />
              Log out
            </DropdownMenuItem>
          </DropdownMenuContent>
        </DropdownMenu>
      </SidebarMenuItem>
    </SidebarMenu>
  );
}
