"use client";

import * as React from "react";
import { type Icon } from "@tabler/icons-react";

import {
  SidebarGroup,
  SidebarGroupContent,
  SidebarMenu,
  SidebarMenuButton,
  SidebarMenuItem,
} from "@/components/ui/sidebar";
import { usePathname } from "next/navigation";
import { cn } from "@/lib/utils";
import { Badge } from "./ui/badge";

export function NavSecondary({
  items,
  ...props
}: {
  items: {
    title: string;
    url: string;
    icon: Icon;
    comingSoon?: boolean;
  }[];
} & React.ComponentPropsWithoutRef<typeof SidebarGroup>) {
  const pathname = usePathname();

  return (
    <SidebarGroup {...props}>
      <SidebarGroupContent>
        <SidebarMenu>
          {items.map((item) => {
            const isActive =
              pathname === item.url || pathname.startsWith(`${item.url}/`);
            return (
              <SidebarMenuItem key={item.title}>
                {item.comingSoon ? (
                  <SidebarMenuButton
                    className={cn(
                      isActive &&
                        "bg-primary text-primary-foreground hover:bg-primary/90 hover:text-primary-foreground",
                      item.comingSoon && "opacity-50 cursor-not-allowed",
                    )}
                  >
                    <item.icon />
                    <span>{item.title}</span>{" "}
                    <Badge variant="secondary" className="ml-auto">
                      Soon
                    </Badge>
                  </SidebarMenuButton>
                ) : (
                  <SidebarMenuButton
                    className={cn(
                      isActive &&
                        "bg-primary text-primary-foreground hover:bg-primary/90 hover:text-primary-foreground",
                      item.comingSoon && "opacity-50 cursor-not-allowed",
                    )}
                    asChild
                  >
                    <a href={item.url}>
                      <item.icon />
                      <span>{item.title}</span>
                    </a>
                  </SidebarMenuButton>
                )}
              </SidebarMenuItem>
            );
          })}
        </SidebarMenu>
      </SidebarGroupContent>
    </SidebarGroup>
  );
}
