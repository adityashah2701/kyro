import { Button } from "@/components/ui/button";
import { SettingsCard } from "../settings-card";
import { Users, Mail, Plus } from "lucide-react";
import { Input } from "@/components/ui/input";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";

export function TeamTab() {
  return (
    <div className="flex flex-col gap-8 animate-in fade-in-50 duration-500">
      <SettingsCard
        title="Project Members"
        description="Manage who has access to this project and their roles."
      >
        <div className="flex items-center gap-2 w-full mb-6">
          <Input
            placeholder="Email address..."
            className="flex-1 bg-background/50 h-10 shadow-sm"
            disabled
          />
          <Select disabled defaultValue="member">
            <SelectTrigger className="w-[130px] bg-background/50 h-10">
              <SelectValue placeholder="Role" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="owner">Owner</SelectItem>
              <SelectItem value="admin">Admin</SelectItem>
              <SelectItem value="member">Member</SelectItem>
              <SelectItem value="viewer">Viewer</SelectItem>
            </SelectContent>
          </Select>
          <Button disabled className="h-10">
            Invite
          </Button>
        </div>

        <div className="flex flex-col border rounded-lg overflow-hidden bg-background/50">
          <div className="flex items-center justify-between p-4 border-b">
            <div className="flex items-center gap-3">
              <div className="h-8 w-8 rounded-full bg-primary/10 flex items-center justify-center text-primary text-xs font-semibold">
                ME
              </div>
              <div className="flex flex-col">
                <span className="text-sm font-medium">You</span>
                <span className="text-xs text-muted-foreground">
                  you@example.com
                </span>
              </div>
            </div>
            <div className="flex items-center gap-4">
              <span className="text-sm text-muted-foreground capitalize">
                Owner
              </span>
            </div>
          </div>
        </div>
      </SettingsCard>
    </div>
  );
}
