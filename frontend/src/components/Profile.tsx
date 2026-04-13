import { useState } from "react";
import { User, Mail, Settings, Bell, Shield, HelpCircle, LogOut } from "lucide-react";
import { Button } from "./ui/button";
import { Card, CardContent } from "./ui/card";
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle, DialogTrigger } from "./ui/dialog";
import { Separator } from "./ui/separator";
import { useAuth } from "../context/AuthContext";
import { useNavigate } from "react-router-dom";

export function Profile() {
  const [settingsOpen, setSettingsOpen] = useState(false);
  const { user, logout } = useAuth();
  const navigate = useNavigate();

  const handleLogout = () => {
    logout();
    navigate('/');
  };

  const name = user?.name || "Anonymous User";
  const initials = name.substring(0, 2).toUpperCase();

  return (
    <div className="pt-20 min-h-screen bg-background pb-12">
      {/* Header Section */}
      <div className="bg-gradient-to-r from-slate-700 to-gray-800 text-white">
        <div className="max-w-7xl mx-auto px-6 py-12">
          <div className="flex items-center justify-between max-w-5xl mx-auto">
            <div>
              <h1 className="text-4xl font-bold mb-2">Profile</h1>
              <p className="text-lg text-slate-200">Manage your account and preferences</p>
            </div>
            <Dialog open={settingsOpen} onOpenChange={setSettingsOpen}>
              <DialogTrigger asChild>
                <Button variant="outline" className="bg-white/10 border-white/20 text-white hover:bg-white/20">
                  <Settings className="h-5 w-5 mr-2" />
                  Settings
                </Button>
              </DialogTrigger>
              <DialogContent className="max-w-md">
                <DialogHeader>
                  <DialogTitle>Settings</DialogTitle>
                  <DialogDescription>
                    Manage your account preferences and settings.
                  </DialogDescription>
                </DialogHeader>
                <div className="space-y-1">
                  <Button variant="ghost" className="w-full justify-start" size="sm">
                    <User className="h-4 w-4 mr-3" />
                    Account Settings
                  </Button>
                  <Button variant="ghost" className="w-full justify-start" size="sm">
                    <Bell className="h-4 w-4 mr-3" />
                    Notifications
                  </Button>
                  <Button variant="ghost" className="w-full justify-start" size="sm">
                    <Shield className="h-4 w-4 mr-3" />
                    Privacy & Security
                  </Button>
                  <Button variant="ghost" className="w-full justify-start" size="sm">
                    <HelpCircle className="h-4 w-4 mr-3" />
                    Help & Support
                  </Button>
                  <Separator className="my-2" />
                  <Button variant="ghost" className="w-full justify-start text-red-600" size="sm" onClick={handleLogout}>
                    <LogOut className="h-4 w-4 mr-3" />
                    Sign Out
                  </Button>
                </div>
              </DialogContent>
            </Dialog>
          </div>
        </div>
      </div>

      {/* Main Content - User Information */}
      <div className="max-w-3xl mx-auto px-6 mt-12">
        <Card>
          <CardContent className="pt-6">
            <div className="flex flex-col items-center text-center">
              {/* Display Picture / Avatar */}
              <div className="w-32 h-32 bg-gradient-to-br from-blue-500 to-indigo-600 rounded-full flex items-center justify-center mb-6 shadow-lg">
                <span className="text-white text-4xl font-bold">{initials}</span>
              </div>

              {/* User Information */}
              <div className="space-y-4 w-full max-w-md">
                <div className="flex items-center justify-center gap-3 text-xl">
                  <User className="h-5 w-5 text-muted-foreground" />
                  <span className="font-semibold">{name}</span>
                </div>

                <div className="flex items-center justify-center gap-3 text-muted-foreground">
                  <Mail className="h-5 w-5" />
                  <span>{user?.email || "No email available"}</span>
                </div>

                <Separator className="my-6" />

                <div className="text-sm text-muted-foreground">
                  Active Member
                </div>

                <div className="pt-4">
                  <Button variant="outline" className="w-full" onClick={() => setSettingsOpen(true)}>
                    <Settings className="h-4 w-4 mr-2" />
                    Edit Profile
                  </Button>
                </div>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}