"use client";

import { signOut } from "next-auth/react";
import { Button } from "@/components/ui/button";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { LogOut, User } from "lucide-react";

interface UserMenuProps {
  user: {
    name?: string | null;
    email?: string | null;
    image?: string | null;
  };
}

export function UserMenu({ user }: UserMenuProps) {
  return (
    <DropdownMenu>
      <DropdownMenuTrigger asChild>
        <Button variant="ghost" size="icon" className="rounded-full">
          {user.image ? (
            <img
              src={user.image}
              alt={user.name || "User"}
              className="w-8 h-8 rounded-full"
            />
          ) : (
            <User className="h-5 w-5" />
          )}
        </Button>
      </DropdownMenuTrigger>
      <DropdownMenuContent align="end" className="bg-zinc-900 border-zinc-800">
        <div className="px-2 py-1.5 text-sm">
          <p className="text-zinc-100 font-medium">{user.name}</p>
          <p className="text-zinc-400 text-xs">{user.email}</p>
        </div>
        <DropdownMenuItem
          onClick={() => signOut({ callbackUrl: "/login" })}
          className="text-red-400 focus:text-red-400"
        >
          <LogOut className="mr-2 h-4 w-4" />
          Sign out
        </DropdownMenuItem>
      </DropdownMenuContent>
    </DropdownMenu>
  );
}
