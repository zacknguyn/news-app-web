import React from "react";
import { useAuth } from "../context/AuthContext";
import { useNavigate } from "react-router-dom";
import { ButtonGroup } from "./ui/button-group";
import { Button } from "./ui/button";
import { Bell } from "lucide-react";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuGroup,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "./ui/dropdown-menu";
import { Avatar, AvatarFallback, AvatarImage } from "./ui/avatar";

const Header: React.FC = () => {
  const { user, logout } = useAuth();
  const navigate = useNavigate();

  const handleLogout = () => {
    logout();
    navigate("/login", { replace: true });
  };

  return (
    <header className="bg-white shadow-sm border-b border-gray-200">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex justify-between items-center h-16">
          {/* Logo */}
          <div className="flex items-center gap-2">
            <span className="text-2xl font-mono font-medium text-blue-700">
              TOURANE NEWS
            </span>
          </div>

          {user && (
            <>
              <div className="flex items-center gap-4">
                <ButtonGroup className="hover:border-none">
                  <Button variant="ghost">Posts</Button>
                  <Button variant="ghost">Archive</Button>
                  <Button variant="ghost">Sources</Button>
                  <Button variant="ghost">Network</Button>
                  <Button variant="ghost">Community</Button>
                </ButtonGroup>
              </div>

              <div className="flex items-center gap-4">
                <div className="flex items-center gap-3">
                  <Button variant="ghost">
                    <Bell />
                  </Button>
                  <DropdownMenu>
                    <DropdownMenuTrigger asChild>
                      <Button
                        variant="ghost"
                        size="icon"
                        className="rounded-none"
                      >
                        <Avatar>
                          <AvatarImage
                            src="https://github.com/shadcn.png"
                            alt="shadcn"
                            className="rounded-none"
                          />
                          <AvatarFallback>CN</AvatarFallback>
                        </Avatar>
                      </Button>
                    </DropdownMenuTrigger>
                    <DropdownMenuContent className="w-32">
                      <DropdownMenuGroup>
                        <DropdownMenuItem>Profile</DropdownMenuItem>
                        <DropdownMenuItem>Billing</DropdownMenuItem>
                        <DropdownMenuItem>Settings</DropdownMenuItem>
                      </DropdownMenuGroup>
                      <DropdownMenuSeparator />
                      <DropdownMenuGroup>
                        <DropdownMenuItem
                          variant="destructive"
                          onClick={handleLogout}
                        >
                          Log out
                        </DropdownMenuItem>
                      </DropdownMenuGroup>
                    </DropdownMenuContent>
                  </DropdownMenu>
                </div>
              </div>
            </>
          )}
        </div>
      </div>
    </header>
  );
};

export default Header;
