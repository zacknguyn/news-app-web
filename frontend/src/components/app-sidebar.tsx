import { useAuth } from "../context/AuthContext";
import { useNavigate, useLocation } from "react-router-dom";
import {
  Sidebar,
  SidebarContent,
  SidebarFooter,
  SidebarGroup,
  SidebarGroupContent,
  SidebarGroupLabel,
  SidebarHeader,
  SidebarMenu,
  SidebarMenuButton,
  SidebarMenuItem,
  useSidebar,
} from "./ui/sidebar";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuGroup,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "./ui/dropdown-menu";
import { Avatar, AvatarFallback, AvatarImage } from "./ui/avatar";
import {
  Bell,
  FileText,
  Archive,
  Radio,
  Users,
  MessageSquare,
  Settings,
  CreditCard,
  User,
  LogOut,
  ChevronDown,
} from "lucide-react";

const navigationItems = [
  {
    title: "Home",
    icon: FileText,
    path: "/home",
    description: "Latest news posts",
  },
  {
    title: "Archive",
    icon: Archive,
    path: "/archive",
    description: "Archived articles",
  },
  {
    title: "Sources",
    icon: Radio,
    path: "/sources",
    description: "News sources",
  },
  {
    title: "Network",
    icon: Users,
    path: "/network",
    description: "Your network",
  },
  {
    title: "Community",
    icon: MessageSquare,
    path: "/community",
    description: "Community discussions",
  },
];

export function AppSidebar() {
  const { user, logout } = useAuth();
  const navigate = useNavigate();
  const location = useLocation();
  const { isMobile } = useSidebar();

  const handleLogout = () => {
    logout();
    navigate("/login", { replace: true });
  };

  const handleNavigation = (path: string) => {
    navigate(path);
  };

  if (!user) {
    return null;
  }

  return (
    <Sidebar
      variant="sidebar"
      collapsible="icon"
      className="border-r border-gray-200"
    >
      <SidebarHeader>
        <SidebarMenu>
          <SidebarMenuItem>
            <SidebarMenuButton
              size="lg"
              className="hover:bg-transparent focus:bg-transparent cursor-default"
            >
              <div className="flex aspect-square size-8 items-center justify-center rounded-lg bg-blue-600 text-white font-bold text-sm">
                T
              </div>
              <div className="grid flex-1 text-left text-sm leading-tight">
                <span className="truncate text-lg font-semibold text-gray-900 leading-none">
                  TOURANE
                </span>
                <span className="truncate text-xs text-blue-600 font-medium">
                  NEWS
                </span>
              </div>
            </SidebarMenuButton>
          </SidebarMenuItem>
        </SidebarMenu>
      </SidebarHeader>

      <SidebarContent>
        <SidebarGroup>
          <SidebarGroupLabel>Navigation</SidebarGroupLabel>
          <SidebarGroupContent>
            <SidebarMenu>
              {navigationItems.map((item) => {
                const isActive = location.pathname === item.path;
                return (
                  <SidebarMenuItem key={item.title}>
                    <SidebarMenuButton
                      asChild
                      isActive={isActive}
                      tooltip={item.title}
                      className={
                        isActive
                          ? "bg-gray-600 text-blue-700 hover:bg-blue-50 hover:text-blue-700 font-medium"
                          : "text-gray-700"
                      }
                    >
                      <button onClick={() => handleNavigation(item.path)}>
                        <item.icon />
                        <span>{item.title}</span>
                      </button>
                    </SidebarMenuButton>
                  </SidebarMenuItem>
                );
              })}
            </SidebarMenu>
          </SidebarGroupContent>
        </SidebarGroup>

        <SidebarGroup>
          <SidebarGroupLabel>Quick Actions</SidebarGroupLabel>
          <SidebarGroupContent>
            <SidebarMenu>
              <SidebarMenuItem>
                <SidebarMenuButton
                  asChild
                  tooltip="Notifications"
                  className="text-gray-700"
                >
                  <button>
                    <div className="relative flex items-center justify-center">
                      <Bell className="size-4" />
                      <div className="absolute -top-1 -right-1 h-2 w-2 bg-red-500 rounded-full" />
                    </div>
                    <span>Notifications</span>
                  </button>
                </SidebarMenuButton>
              </SidebarMenuItem>
            </SidebarMenu>
          </SidebarGroupContent>
        </SidebarGroup>
      </SidebarContent>

      <SidebarFooter>
        <SidebarMenu>
          <SidebarMenuItem>
            <DropdownMenu>
              <DropdownMenuTrigger asChild>
                <SidebarMenuButton
                  size="lg"
                  className="data-[state=open]:bg-sidebar-accent data-[state=open]:text-sidebar-accent-foreground"
                >
                  <Avatar className="h-8 w-8 rounded-lg">
                    <AvatarImage
                      src="https://github.com/shadcn.png"
                      alt={user?.firstName || "User"}
                    />
                    <AvatarFallback className="bg-blue-600 text-white text-xs font-semibold rounded-lg">
                      {user?.firstName?.charAt(0)?.toUpperCase() || "U"}
                    </AvatarFallback>
                  </Avatar>
                  <div className="grid flex-1 text-left text-sm leading-tight">
                    <span className="truncate font-medium text-gray-900">
                      {user?.firstName || "User"}
                    </span>
                    <span className="truncate text-xs text-gray-500">
                      {user?.email || "user@example.com"}
                    </span>
                  </div>
                  <ChevronDown className="ml-auto size-4 text-gray-400" />
                </SidebarMenuButton>
              </DropdownMenuTrigger>
              <DropdownMenuContent
                className="w-[--radix-dropdown-menu-trigger-width] min-w-56 rounded-lg"
                side={isMobile ? "bottom" : "right"}
                align="end"
                sideOffset={4}
              >
                <div className="flex items-center gap-3 p-2">
                  <Avatar className="h-8 w-8 rounded-lg">
                    <AvatarImage
                      src="https://github.com/shadcn.png"
                      alt={user?.firstName || "User"}
                    />
                    <AvatarFallback className="bg-blue-600 text-white font-semibold rounded-lg">
                      {user?.firstName?.charAt(0)?.toUpperCase() || "U"}
                    </AvatarFallback>
                  </Avatar>
                  <div className="grid flex-1 text-left text-sm leading-tight">
                    <span className="truncate font-medium text-gray-900">
                      {user?.firstName || "User"}
                    </span>
                    <span className="truncate text-xs text-gray-500">
                      {user?.email || "user@example.com"}
                    </span>
                  </div>
                </div>
                <DropdownMenuSeparator />
                <DropdownMenuGroup>
                  <DropdownMenuItem className="cursor-pointer">
                    <User className="mr-2 h-4 w-4" />
                    Profile
                  </DropdownMenuItem>
                  <DropdownMenuItem className="cursor-pointer">
                    <CreditCard className="mr-2 h-4 w-4" />
                    Billing
                  </DropdownMenuItem>
                  <DropdownMenuItem className="cursor-pointer">
                    <Settings className="mr-2 h-4 w-4" />
                    Settings
                  </DropdownMenuItem>
                </DropdownMenuGroup>
                <DropdownMenuSeparator />
                <DropdownMenuItem
                  onClick={handleLogout}
                  className="cursor-pointer text-red-600 focus:text-red-600 focus:bg-red-50"
                >
                  <LogOut className="mr-2 h-4 w-4" />
                  Log out
                </DropdownMenuItem>
              </DropdownMenuContent>
            </DropdownMenu>
          </SidebarMenuItem>
        </SidebarMenu>
      </SidebarFooter>
    </Sidebar>
  );
}
