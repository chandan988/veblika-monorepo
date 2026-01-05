"use client";

import * as React from "react";
import {
  AudioWaveform,
  BookOpen,
  Bot,
  Building2,
  ChartLine,
  Command,
  CreditCard,
  Frame,
  GalleryVerticalEnd,
  Key,
  LayoutPanelTop,
  Map,
  MessageCircle,
  Microscope,
  PackageSearch,
  PieChart,
  Settings2,
  SquareTerminal,
  User,
  Users,
} from "lucide-react";

import { NavMain } from "@/components/nav-main";
import { NavProjects } from "@/components/nav-projects";
import { NavUser } from "@/components/nav-user";
import { TeamSwitcher } from "@/components/team-switcher";
import {
  Sidebar,
  SidebarContent,
  SidebarFooter,
  SidebarHeader,
  SidebarRail,
} from "@/components/ui/sidebar";
import { Separator } from "@radix-ui/react-separator";
import { useAuthSession } from "@/hooks/use-auth-session";
import { authClient } from "@/lib/auth.client";
import { useRouter } from "next/navigation";

// This is sample data.
const data = {
  teams: [
    {
      name: "Acme Inc",
      logo: GalleryVerticalEnd,
      plan: "Enterprise",
    },
    {
      name: "Acme Corp.",
      logo: AudioWaveform,
      plan: "Startup",
    },
    {
      name: "Evil Corp.",
      logo: Command,
      plan: "Free",
    },
  ],
  normal_link: [
    {
      name: "Dashboard",
      url: "/dashboard",
      icon: LayoutPanelTop,
    },
    {
      name: "Integrations",
      url: "/integrations",
      icon: Map,
    },
  ],
  navMain: [
    {
      title: "Playground",
      url: "#",
      icon: SquareTerminal,
      isActive: true,
      items: [
        {
          title: "History",
          url: "#",
        },
        {
          title: "Starred",
          url: "#",
        },
        {
          title: "Settings",
          url: "#",
        },
      ],
    },
    {
      title: "Models",
      url: "#",
      icon: Bot,
      items: [
        {
          title: "Genesis",
          url: "#",
        },
        {
          title: "Explorer",
          url: "#",
        },
        {
          title: "Quantum",
          url: "#",
        },
      ],
    },
    {
      title: "Documentation",
      url: "#",
      icon: BookOpen,
      items: [
        {
          title: "Introduction",
          url: "#",
        },
        {
          title: "Get Started",
          url: "#",
        },
        {
          title: "Tutorials",
          url: "#",
        },
        {
          title: "Changelog",
          url: "#",
        },
      ],
    },
    {
      title: "Settings",
      url: "#",
      icon: Settings2,
      items: [
        {
          title: "General",
          url: "#",
        },
        {
          title: "Team",
          url: "#",
        },
        {
          title: "Billing",
          url: "#",
        },
        {
          title: "Limits",
          url: "#",
        },
      ],
    },
  ],
  social_media: [
    {
      name: "Post ",
      url: "/social_media/post",
      icon: Microscope,
    },
    {
      name: "Analytics",
      url: "/social_media/analytics",
      icon: ChartLine,
    },
    {
      name: "Engage",
      url: "/social_media/engage",
      icon: MessageCircle,
    },
    {
      name: "Analyze",
      url: "/social_media/analyze",
      icon: PackageSearch,
    },
  ],
  settings: [
    {
      name: "Profile",
      url: "/settings/profile",
      icon: User,
    },
    {
      name: "Team",
      url: "/settings/team",
      icon: Users,
    },
    {
      name: "Billing",
      url: "/settings/billing",
      icon: CreditCard,
    },
    {
      name: "Organizations",
      url: "/settings/organization",
      icon: Building2,
    },
    {
      name: "Manage",
      url: "/settings/credentials",
      icon: Key,
    },
  ],
};

export function AppSidebar({ ...props }: React.ComponentProps<typeof Sidebar>) {
  const { user, isLoading } = useAuthSession();
  const router = useRouter();

  const handleLogout = async () => {
    try {
      await authClient.signOut();
      router.push("/login");
    } catch (error) {
      console.error("Error logging out:", error);
    }
  };

  // Get user data with fallbacks
  const userData = {
    avatar: user?.image || "https://i.pinimg.com/736x/4a/94/7f/4a947f329636ebfb8505fb16ca5ae25c.jpg",
    name: user?.name || "User",
    email: user?.email || "",
  };

  return (
    <Sidebar collapsible="icon" {...props}>
      <SidebarHeader>
        <TeamSwitcher />
      </SidebarHeader>
      <SidebarContent>
        {/* <NavMain items={data.navMain} /> */}
        <NavProjects projects={data.normal_link} />
        <NavProjects heading="Social Media" projects={data.social_media} />
        <NavProjects heading="Settings" projects={data.settings} />
      </SidebarContent>
      <SidebarFooter>
        {!isLoading && (
          <NavUser
            user={userData}
            onLogout={handleLogout}
          />
        )}
      </SidebarFooter>
      <SidebarRail />
    </Sidebar>
  );
}
