"use client";
import { useRouter } from "next/navigation";
import { useAuth } from "@/contexts/AuthContext";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Factory, LogOut, Plus, Users } from "lucide-react";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { useToast } from "@/hooks/use-toast";
import { useState } from "react";

const DashboardHeader = () => {
  const { role, logout } = useAuth();
  const router = useRouter();
  const { toast } = useToast();
  const [store, setStore] = useState<"nl" | "de" | "uk" | "fr" | "dk">("nl");
  const [isSyncing, setIsSyncing] = useState(false);

  const handleLogout = () => {
    logout();
    router.push("/");
  };

  const handleCreateOrder = () => {
    router.push("/create-order");
  };

  const handleUserManagement = () => {
    router.push("/dashboard/users");
  };

  const handleSync = async () => {
    setIsSyncing(true);

    // Show loading toast that persists until sync completes
    const { id, update, dismiss } = toast({
      title: "Syncing...",
      description: `Fetching store orders  from .${store}`,
      variant: "default",
      className:
        "bg-white dark:bg-gray-800 text-black dark:text-white border-gray-300",
      duration: Infinity, // Prevent auto-dismiss
    });

    try {
      const res = await fetch(`/api/sync?store=${store}`, { method: "POST" });
      const data = await res.json();
      if (!res.ok || !data.ok) throw new Error(data.error || "Sync failed");

      // Update toast to success (green)
      update({
        id,
        title: "✓ Sync completed",
        description: `Store: .${data.store} | Products: ${data.counts.products} | Orders: ${data.counts.orders}`,
        variant: "default",
        className: "bg-green-600 text-white border-green-700",
        duration: 4000, // Auto dismiss success after 4 seconds
      });

      // Auto dismiss after 4 seconds
      setTimeout(() => dismiss(), 4000);
    } catch (e: any) {
      // Update toast to error (red)
      update({
        id,
        title: "✗ Sync failed",
        description: e.message,
        variant: "destructive",
        className: "bg-red-600 text-white border-red-700",
        duration: 4000, // Auto dismiss error after 4 seconds
      });

      // Auto dismiss after 4 seconds
      setTimeout(() => dismiss(), 4000);
    } finally {
      setIsSyncing(false);
    }
  };

  return (
    <header className="bg-card/70 backdrop-blur supports-[backdrop-filter]:bg-card/60 border-b border-border sticky top-0 z-50 shadow-sm">
      <div className="container mx-auto px-4 py-4">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-4">
            <div className="flex items-center gap-3">
              <div className="bg-primary rounded-lg p-2 shadow-elevated">
                <Factory className="h-6 w-6 text-primary-foreground" />
              </div>
              <div>
                <h1 className="text-xl font-bold text-foreground">
                  Flyscreen Manufacturing
                </h1>
                <p className="text-sm text-muted-foreground">
                  Production Dashboard
                </p>
              </div>
            </div>
          </div>

          <div className="flex items-center gap-4">
            <Badge variant="outline" className="text-sm px-4 py-2">
              {role}
            </Badge>

            <div className="hidden md:flex items-center gap-2">
              <Select value={store} onValueChange={(v) => setStore(v as any)}>
                <SelectTrigger className="w-[120px]">
                  <SelectValue placeholder="Store" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="nl">.nl</SelectItem>
                  <SelectItem value="de">.de</SelectItem>
                  <SelectItem value="dk">.dk</SelectItem>
                  <SelectItem value="fr">.fr</SelectItem>
                  <SelectItem value="uk">.uk</SelectItem>
                </SelectContent>
              </Select>
              <Button
                variant="outline"
                className="hover:cursor-pointer"
                onClick={handleSync}
                disabled={isSyncing}
              >
                {isSyncing ? "Syncing..." : "Sync Store"}
              </Button>
            </div>

            {role === "Admin" && (
              <>
                <Button
                  onClick={handleUserManagement}
                  variant="outline"
                  size="sm"
                  className="gap-2 hover:cursor-pointer"
                >
                  <Users className="h-4 w-4" />
                  User Management
                </Button>
                <Button
                  onClick={handleCreateOrder}
                  size="sm"
                  className="gap-2 hover:cursor-pointer"
                >
                  <Plus className="h-4 w-4" />
                  Create Order
                </Button>
              </>
            )}

            <Button
              onClick={handleLogout}
              variant="outline"
              size="sm"
              className="gap-2 hover:cursor-pointer"
            >
              <LogOut className="h-4 w-4 " />
              Logout
            </Button>
          </div>
        </div>
      </div>
    </header>
  );
};

export default DashboardHeader;
