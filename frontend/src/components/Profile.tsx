import { useState, useEffect, useCallback } from "react";
import {
  User, Mail, Settings, Bell, Shield, HelpCircle,
  LogOut, Zap, Lock, Eye, EyeOff, CheckCircle, AlertCircle, RefreshCw
} from "lucide-react";
import { Button } from "./ui/button";
import { Card, CardContent } from "./ui/card";
import {
  Dialog, DialogContent, DialogDescription,
  DialogHeader, DialogTitle, DialogTrigger
} from "./ui/dialog";
import { Separator } from "./ui/separator";
import { useAuth } from "../context/AuthContext";
import { useNavigate } from "react-router-dom";
import { api } from "../lib/api";

interface TierInfo {
  tier: string;
  documents_uploaded: number;
  monthly_limit: number | null;
  remaining: number | null;
  documents_processed: number;
  cycle_info?: { cycle_start: string; cycle_end: string; days_remaining: number };
}

// ─── Small inline alert ────────────────────────────────────────────────────────
function InlineAlert({ type, msg }: { type: "success" | "error"; msg: string }) {
  return (
    <div
      className={`flex items-start gap-2 rounded-lg px-4 py-3 text-sm ${
        type === "success"
          ? "bg-emerald-50 border border-emerald-200 text-emerald-800"
          : "bg-red-50 border border-red-200 text-red-800"
      }`}
    >
      {type === "success" ? (
        <CheckCircle className="h-4 w-4 flex-shrink-0 mt-0.5" />
      ) : (
        <AlertCircle className="h-4 w-4 flex-shrink-0 mt-0.5" />
      )}
      <span>{msg}</span>
    </div>
  );
}

// ─── Password input with show/hide toggle ──────────────────────────────────────
function PasswordInput({
  id, placeholder, value, onChange, disabled,
}: {
  id: string; placeholder: string; value: string;
  onChange: (v: string) => void; disabled?: boolean;
}) {
  const [show, setShow] = useState(false);
  return (
    <div className="relative">
      <Lock className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-slate-400" />
      <input
        id={id}
        type={show ? "text" : "password"}
        placeholder={placeholder}
        value={value}
        onChange={e => onChange(e.target.value)}
        disabled={disabled}
        className="w-full pl-9 pr-10 py-2.5 border rounded-lg text-sm focus:ring-2 focus:ring-blue-500 focus:border-blue-500 outline-none disabled:opacity-50 transition-all"
      />
      <button
        type="button"
        onClick={() => setShow(s => !s)}
        className="absolute right-3 top-1/2 -translate-y-1/2 text-slate-400 hover:text-slate-600 transition-colors"
      >
        {show ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
      </button>
    </div>
  );
}

// ─── Edit Profile Dialog ───────────────────────────────────────────────────────
function EditProfileDialog({
  open, onOpenChange, currentName, onSaved,
}: {
  open: boolean; onOpenChange: (v: boolean) => void;
  currentName: string; onSaved: (name: string) => void;
}) {
  const [name, setName] = useState(currentName);
  const [currentPw, setCurrentPw] = useState("");
  const [newPw, setNewPw] = useState("");
  const [confirmPw, setConfirmPw] = useState("");
  const [saving, setSaving] = useState(false);
  const [alert, setAlert] = useState<{ type: "success" | "error"; msg: string } | null>(null);

  // Reset form when dialog opens
  useEffect(() => {
    if (open) {
      setName(currentName);
      setCurrentPw(""); setNewPw(""); setConfirmPw("");
      setAlert(null);
    }
  }, [open, currentName]);

  // Client-side password validation
  function validatePw(): string | null {
    if (!newPw && !currentPw) return null; // no password change requested
    if (!currentPw) return "Enter your current password to change it.";
    if (newPw.length < 8) return "New password must be at least 8 characters.";
    if (newPw !== confirmPw) return "Passwords do not match.";
    return null;
  }

  async function handleSave() {
    setAlert(null);
    const pwError = validatePw();
    if (pwError) { setAlert({ type: "error", msg: pwError }); return; }
    if (!name.trim()) { setAlert({ type: "error", msg: "Name cannot be empty." }); return; }

    setSaving(true);
    try {
      const payload: Parameters<typeof api.updateProfile>[0] = { name: name.trim() };
      if (newPw) {
        payload.current_password = currentPw;
        payload.new_password = newPw;
        payload.confirm_password = confirmPw;
      }
      await api.updateProfile(payload);
      setAlert({ type: "success", msg: "Profile updated successfully!" });
      onSaved(name.trim());
      // Close after short delay so user sees success message
      setTimeout(() => onOpenChange(false), 1200);
    } catch (err: any) {
      setAlert({ type: "error", msg: err.message || "Failed to update profile." });
    } finally {
      setSaving(false);
    }
  }

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-md">
        <DialogHeader>
          <DialogTitle className="text-xl">Edit Profile</DialogTitle>
          <DialogDescription>Update your name or change your password.</DialogDescription>
        </DialogHeader>

        <div className="space-y-5 pt-1">
          {/* Name */}
          <div className="space-y-1.5">
            <label htmlFor="edit-name" className="text-sm font-medium text-slate-700">Full Name</label>
            <div className="relative">
              <User className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-slate-400" />
              <input
                id="edit-name"
                type="text"
                placeholder="Your full name"
                value={name}
                onChange={e => setName(e.target.value)}
                disabled={saving}
                className="w-full pl-9 pr-4 py-2.5 border rounded-lg text-sm focus:ring-2 focus:ring-blue-500 focus:border-blue-500 outline-none disabled:opacity-50 transition-all"
              />
            </div>
          </div>

          <Separator />

          {/* Password change */}
          <div className="space-y-3">
            <p className="text-sm font-medium text-slate-700 flex items-center gap-1.5">
              <Lock className="h-3.5 w-3.5" /> Change Password
              <span className="text-slate-400 font-normal text-xs">(optional)</span>
            </p>
            <PasswordInput
              id="current-pw" placeholder="Current password"
              value={currentPw} onChange={setCurrentPw} disabled={saving}
            />
            <PasswordInput
              id="new-pw" placeholder="New password (min 8 chars)"
              value={newPw} onChange={setNewPw} disabled={saving}
            />
            <PasswordInput
              id="confirm-pw" placeholder="Confirm new password"
              value={confirmPw} onChange={setConfirmPw} disabled={saving}
            />
          </div>

          {/* Alert */}
          {alert && <InlineAlert type={alert.type} msg={alert.msg} />}

          {/* Actions */}
          <div className="flex gap-3 pt-1">
            <Button
              variant="outline" className="flex-1"
              onClick={() => onOpenChange(false)} disabled={saving}
            >
              Cancel
            </Button>
            <Button
              className="flex-1 bg-blue-600 hover:bg-blue-700"
              onClick={handleSave} disabled={saving}
            >
              {saving ? (
                <><RefreshCw className="h-4 w-4 mr-2 animate-spin" /> Saving…</>
              ) : "Save Changes"}
            </Button>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
}

// ─── Privacy & Security Dialog ─────────────────────────────────────────────────
function PrivacyDialog({
  open, onOpenChange,
}: {
  open: boolean; onOpenChange: (v: boolean) => void;
}) {
  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-md">
        <DialogHeader>
          <DialogTitle>Privacy & Security</DialogTitle>
          <DialogDescription>Our commitment to your data privacy and compliance.</DialogDescription>
        </DialogHeader>
        <div className="space-y-4 pt-2">
          <div>
            <h4 className="font-semibold text-sm mb-1 text-slate-800">Data Privacy</h4>
            <p className="text-sm text-slate-600 leading-relaxed">
              Compliant with the Digital Personal Data Protection Act (DPDPA) 2023. We practice data minimization.
            </p>
          </div>
          <Separator />
          <div>
            <h4 className="font-semibold text-sm mb-1 text-slate-800">Processing Logic</h4>
            <p className="text-sm text-slate-600 leading-relaxed">
              Legal documents are processed in-memory for analysis and are never stored on our servers. Your data stays in your browser's local storage.
            </p>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
}

export function Profile() {
  const [settingsOpen, setSettingsOpen] = useState(false);
  const [editOpen, setEditOpen] = useState(false);
  const [privacyOpen, setPrivacyOpen] = useState(false);
  const [tierInfo, setTierInfo] = useState<TierInfo | null>(null);
  const [loading, setLoading] = useState(true);
  const { user, refreshUser, logout } = useAuth();
  const navigate = useNavigate();

  const [displayName, setDisplayName] = useState(user?.name || "Anonymous User");

  useEffect(() => {
    setDisplayName(user?.name || "Anonymous User");
  }, [user?.name]);

  const fetchTierInfo = useCallback(async () => {
    try {
      const token = localStorage.getItem("access_token");
      if (!token) return;
      const data = await api.getUserTier();
      setTierInfo(data);
    } catch (error) {
      console.error("Error fetching tier info:", error);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    fetchTierInfo();
  }, [fetchTierInfo]);

  useEffect(() => {
    const onFocus = () => fetchTierInfo();
    window.addEventListener("focus", onFocus);
    return () => window.removeEventListener("focus", onFocus);
  }, [fetchTierInfo]);

  const handleLogout = () => { logout(); navigate("/"); };
  const handleNavigateToPricing = () => navigate("/");

  const initials = displayName.substring(0, 2).toUpperCase();

  // Progress values
  const uploaded = tierInfo?.documents_uploaded ?? 0;
  const limit = tierInfo?.monthly_limit ?? 5;
  const remaining = tierInfo?.remaining ?? 0;
  const progressPct = tierInfo?.monthly_limit
    ? Math.min((uploaded / limit) * 100, 100) : 100;
  const progressColor =
    progressPct >= 100 ? "from-red-500 to-rose-600" :
    progressPct >= 80  ? "from-amber-400 to-orange-500" :
                         "from-blue-500 to-indigo-600";

  const daysRemaining = tierInfo?.cycle_info?.days_remaining ?? null;

  return (
    <div className="pt-20 min-h-screen bg-gradient-to-br from-slate-50 to-slate-100 pb-12">
      {/* Header */}
      <div className="bg-gradient-to-r from-slate-800 via-slate-700 to-gray-800 text-white">
        <div className="max-w-7xl mx-auto px-6 py-12">
          <div className="flex items-center justify-between max-w-5xl mx-auto">
            <div>
              <h1 className="text-4xl font-bold mb-1">Profile</h1>
              <p className="text-slate-300">Manage your account and preferences</p>
            </div>
            <Dialog open={settingsOpen} onOpenChange={setSettingsOpen}>
              <DialogTrigger asChild>
                <Button variant="outline" className="bg-white/10 border-white/20 text-white hover:bg-white/20">
                  <Settings className="h-5 w-5 mr-2" /> Settings
                </Button>
              </DialogTrigger>
              <DialogContent className="max-w-md">
                <DialogHeader>
                  <DialogTitle>Settings</DialogTitle>
                  <DialogDescription>Manage your account preferences.</DialogDescription>
                </DialogHeader>
                <div className="space-y-1">
                  <Button
                    variant="ghost" className="w-full justify-start" size="sm"
                    onClick={() => { setSettingsOpen(false); setEditOpen(true); }}
                  >
                    <User className="h-4 w-4 mr-3" /> Account Settings
                  </Button>
                  <Button variant="ghost" className="w-full justify-start" size="sm">
                    <Bell className="h-4 w-4 mr-3" /> Notifications
                  </Button>
                  <Button 
                    variant="ghost" className="w-full justify-start" size="sm"
                    onClick={() => { setSettingsOpen(false); setPrivacyOpen(true); }}
                  >
                    <Shield className="h-4 w-4 mr-3" /> Privacy &amp; Security
                  </Button>
                  <Separator className="my-2" />
                  <Button
                    variant="ghost" className="w-full justify-start text-red-600" size="sm"
                    onClick={handleLogout}
                  >
                    <LogOut className="h-4 w-4 mr-3" /> Sign Out
                  </Button>
                </div>
              </DialogContent>
            </Dialog>
          </div>
        </div>
      </div>

      {/* Main card */}
      <div className="max-w-3xl mx-auto px-6 mt-10">
        <Card className="shadow-xl border-0 bg-white rounded-2xl overflow-hidden">
          <CardContent className="pt-0">
            {/* Top gradient strip */}
            <div className="h-2 bg-gradient-to-r from-blue-500 via-indigo-500 to-purple-500 rounded-t-2xl" />

            <div className="flex flex-col items-center text-center pt-6 px-6 pb-6">
              {/* Avatar */}
              <div className="w-28 h-28 bg-gradient-to-br from-blue-500 to-indigo-600 rounded-full flex items-center justify-center mb-5 shadow-lg ring-4 ring-white">
                <span className="text-white text-4xl font-bold">{initials}</span>
              </div>

              {/* Name & email */}
              <div className="space-y-2 w-full max-w-md mb-6">
                <div className="flex items-center justify-center gap-2 text-xl font-bold text-slate-800">
                  <User className="h-5 w-5 text-slate-400" />
                  <span>{displayName}</span>
                </div>
                <div className="flex items-center justify-center gap-2 text-slate-500 text-sm">
                  <Mail className="h-4 w-4" />
                  <span>{user?.email || "No email available"}</span>
                </div>
              </div>

              <Separator />

              {/* Tier + Usage */}
              {loading ? (
                <div className="flex items-center gap-2 py-10 text-slate-400">
                  <RefreshCw className="h-4 w-4 animate-spin" />
                  <span className="text-sm">Loading subscription info…</span>
                </div>
              ) : tierInfo ? (
                <div className="space-y-5 w-full mt-6">
                  {/* Plan badge */}
                  <div className="flex justify-center">
                    <span
                      className={`inline-flex items-center gap-2 px-6 py-2 rounded-full text-sm font-bold shadow-sm ${
                        tierInfo.tier === "premium"
                          ? "bg-gradient-to-r from-amber-100 to-amber-200 text-amber-900 border-2 border-amber-300"
                          : "bg-gradient-to-r from-slate-100 to-slate-200 text-slate-800 border-2 border-slate-300"
                      }`}
                    >
                      {tierInfo.tier === "premium" && <Zap className="w-4 h-4" />}
                      {tierInfo.tier.toUpperCase()} PLAN
                    </span>
                  </div>

                  {/* Upload progress card */}
                  <div className="bg-gradient-to-br from-blue-50 to-indigo-50 rounded-2xl p-5 border border-blue-100">
                    <div className="flex items-center justify-between mb-3">
                      <span className="text-sm font-semibold text-slate-700">Monthly Upload Progress</span>
                      <span className="text-base font-bold text-slate-900">
                        {uploaded}
                        {tierInfo.monthly_limit ? `/${tierInfo.monthly_limit}` : ""}
                      </span>
                    </div>

                    {tierInfo.monthly_limit ? (
                      <>
                        <div className="w-full bg-slate-200 rounded-full h-3.5 overflow-hidden mb-2">
                          <div
                            className={`bg-gradient-to-r ${progressColor} h-3.5 rounded-full transition-all duration-500`}
                            style={{ width: `${progressPct}%` }}
                          />
                        </div>
                        <div className="flex items-center justify-between text-xs text-slate-500">
                          <span>
                            {remaining} {remaining === 1 ? "upload" : "uploads"} remaining
                          </span>
                          {daysRemaining !== null && (
                            <span className="font-medium text-indigo-600">
                              Resets in {daysRemaining} day{daysRemaining !== 1 ? "s" : ""}
                            </span>
                          )}
                        </div>

                        {/* Limit reached warning */}
                        {remaining === 0 && (
                          <div className="mt-3 flex items-start gap-2 bg-red-50 border border-red-200 rounded-lg px-3 py-2.5 text-xs text-red-700">
                            <AlertCircle className="h-4 w-4 flex-shrink-0 mt-0.5 text-red-500" />
                            <span>Upload limit reached. Upgrade to Premium for unlimited uploads.</span>
                          </div>
                        )}
                      </>
                    ) : (
                      <>
                        <div className="w-full bg-emerald-100 rounded-full h-3.5 overflow-hidden mb-2">
                          <div className="bg-gradient-to-r from-emerald-400 to-green-500 h-3.5 rounded-full" style={{ width: "100%" }} />
                        </div>
                        <p className="text-xs text-emerald-700 font-semibold">
                          Unlimited uploads — Premium member
                        </p>
                      </>
                    )}
                  </div>

                  {/* Total processed card */}
                  <div className="bg-gradient-to-br from-purple-50 to-pink-50 rounded-2xl p-5 border border-purple-100">
                    <div className="flex items-center justify-between">
                      <span className="text-sm font-semibold text-slate-700">Total Documents Processed</span>
                      <span className="text-4xl font-black text-purple-600">{tierInfo.documents_processed}</span>
                    </div>
                    <p className="text-xs text-slate-500 mt-1">Lifetime documents analyzed</p>
                  </div>
                </div>
              ) : (
                <p className="text-slate-500 py-8 text-sm">Unable to load subscription info.</p>
              )}

              {/* CTA buttons */}
              <div className="pt-6 space-y-2 w-full max-w-md">
                <Button variant="default" className="w-full bg-blue-600 hover:bg-blue-700" onClick={handleNavigateToPricing}>
                  {tierInfo?.tier === "premium" ? "Manage Subscription" : "View Plans & Upgrade"}
                </Button>
                <Button variant="outline" className="w-full" onClick={() => setEditOpen(true)}>
                  <Settings className="h-4 w-4 mr-2" /> Edit Profile
                </Button>
              </div>

              <p className="text-xs text-slate-400 mt-4">Active Member</p>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Privacy Dialog */}
      <PrivacyDialog open={privacyOpen} onOpenChange={setPrivacyOpen} />

      {/* Edit Profile Dialog */}
      <EditProfileDialog
        open={editOpen}
        onOpenChange={setEditOpen}
        currentName={displayName}
        onSaved={(newName) => {
          setDisplayName(newName);
          // Sync the global AuthContext so navbar name updates immediately
          refreshUser();
        }}
      />
    </div>
  );
}