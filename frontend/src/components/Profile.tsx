import { useState, useEffect } from "react";
import { User, Mail, Settings, Bell, Shield, HelpCircle, LogOut, Zap } from "lucide-react";
import { Button } from "./ui/button";
import { Card, CardContent } from "./ui/card";
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle, DialogTrigger } from "./ui/dialog";
import { Separator } from "./ui/separator";
import { useAuth } from "../context/AuthContext";
import { useNavigate } from "react-router-dom";

interface TierInfo {
  tier: string;
  documents_uploaded: number;
  monthly_limit: number | null;
  remaining: number | null;
  documents_processed: number;
}

export function Profile() {
  const [settingsOpen, setSettingsOpen] = useState(false);
  const [tierInfo, setTierInfo] = useState<TierInfo | null>(null);
  const [loading, setLoading] = useState(true);
  const { user, logout } = useAuth();
  const navigate = useNavigate();

  const fetchTierInfo = async () => {
    try {
      const token = localStorage.getItem('access_token');
      if (token) {
        const response = await fetch('http://localhost:8000/api/user/tier', {
          headers: {
            'Authorization': `Bearer ${token}`,
          },
        });
        const data = await response.json();
        setTierInfo(data);
      }
    } catch (error) {
      console.error('Error fetching tier info:', error);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchTierInfo();
    // Refresh every 5 seconds to capture new uploads
    const interval = setInterval(fetchTierInfo, 5000);
    return () => clearInterval(interval);
  }, []);

  // Also refresh when the page gains focus
  useEffect(() => {
    const handleFocus = () => {
      fetchTierInfo();
    };
    window.addEventListener('focus', handleFocus);
    return () => window.removeEventListener('focus', handleFocus);
  }, []);

  const handleLogout = () => {
    logout();
    navigate('/');
  };

  const handleNavigateToPricing = () => {
    navigate('/roadmap');
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

                {/* Subscription Tier Section */}
                {loading ? (
                  <div className="text-center py-8">
                    <p className="text-slate-600">Loading subscription information...</p>
                  </div>
                ) : tierInfo ? (
                  <div className="space-y-4">
                    {/* Plan Badge at Top */}
                    <div className="text-center">
                      <span className={`inline-flex items-center gap-2 px-6 py-2 rounded-full text-lg font-bold ${
                        tierInfo.tier === 'premium'
                          ? 'bg-gradient-to-r from-amber-100 to-amber-200 text-amber-900 border-2 border-amber-300'
                          : 'bg-gradient-to-r from-slate-100 to-slate-200 text-slate-900 border-2 border-slate-300'
                      }`}>
                        {tierInfo.tier === 'premium' && <Zap className="w-5 h-5" />}
                        <span>{tierInfo.tier.toUpperCase()} PLAN</span>
                      </span>
                    </div>

                    {/* Monthly Upload Progress */}
                    <div className="bg-gradient-to-r from-blue-50 to-indigo-50 rounded-lg p-6 border-2 border-blue-200">
                      <div className="mb-4">
                        <div className="flex items-center justify-between mb-2">
                          <span className="text-sm font-semibold text-slate-700">Monthly Upload Progress</span>
                          <span className={`text-lg font-bold ${tierInfo.monthly_limit ? 'text-slate-900' : 'text-green-600'}`}>
                            {tierInfo.documents_uploaded}{tierInfo.monthly_limit ? `/${tierInfo.monthly_limit}` : ''}
                          </span>
                        </div>
                        
                        {tierInfo.monthly_limit ? (
                          <>
                            <div className="w-full bg-slate-300 rounded-full h-4 overflow-hidden">
                              <div 
                                className="bg-gradient-to-r from-blue-500 to-indigo-600 h-4 rounded-full transition-all duration-300"
                                style={{
                                  width: `${Math.min((tierInfo.documents_uploaded / tierInfo.monthly_limit) * 100, 100)}%`
                                }}
                              ></div>
                            </div>
                            <p className="text-xs text-slate-600 mt-2">
                              {tierInfo.remaining} {tierInfo.remaining === 1 ? 'upload' : 'uploads'} remaining this month
                            </p>
                          </>
                        ) : (
                          <>
                            <div className="w-full bg-slate-300 rounded-full h-4 overflow-hidden">
                              <div 
                                className="bg-gradient-to-r from-green-500 to-emerald-600 h-4 rounded-full transition-all"
                                style={{ width: '100%' }}
                              ></div>
                            </div>
                            <p className="text-xs text-green-700 font-semibold mt-2">
                              You have unlimited uploads as a premium member
                            </p>
                          </>
                        )}
                      </div>
                    </div>

                    {/* Total Documents Processed */}
                    <div className="bg-gradient-to-r from-purple-50 to-pink-50 rounded-lg p-6 border-2 border-purple-200">
                      <div className="flex items-center justify-between">
                        <span className="text-sm font-semibold text-slate-700">Total Documents Processed</span>
                        <span className="text-4xl font-bold text-purple-600">{tierInfo.documents_processed}</span>
                      </div>
                      <p className="text-xs text-slate-600 mt-2">
                        Total number of documents analyzed throughout your account lifetime
                      </p>
                    </div>
                  </div>
                ) : (
                  <div className="text-center py-8">
                    <p className="text-slate-600">Unable to load subscription information</p>
                  </div>
                )}

                <div className="text-sm text-muted-foreground">
                  Active Member
                </div>

                <div className="pt-4 space-y-2 w-full">
                  <Button 
                    variant="default" 
                    className="w-full"
                    onClick={handleNavigateToPricing}
                  >
                    {tierInfo?.tier === 'premium' ? 'Manage Subscription' : 'View Plans'}
                  </Button>
                  <Button 
                    variant="outline" 
                    className="w-full" 
                    onClick={() => setSettingsOpen(true)}
                  >
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