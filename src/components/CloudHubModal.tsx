import React, { useState } from "react";
import { 
  Cloud, 
  CloudOff, 
  Database, 
  ShieldCheck, 
  User, 
  LogIn, 
  LogOut, 
  RefreshCw, 
  Download, 
  Upload, 
  CheckCircle2, 
  AlertTriangle, 
  X, 
  Sparkles,
  ExternalLink,
  Users,
  FileSpreadsheet,
  Check,
  Mail,
  Lock,
  UserPlus
} from "lucide-react";
import { motion, AnimatePresence } from "motion/react";
import { User as FirebaseUser } from "firebase/auth";
import { ErrorRecord, Employee, ErrorType, SavedCriteria } from "../types";
import firebaseConfig from "../../firebase-applet-config.json";

interface CloudHubModalProps {
  isOpen: boolean;
  onClose: () => void;
  user: FirebaseUser | null;
  records: ErrorRecord[];
  employees: Employee[];
  errorTypes: ErrorType[];
  savedCriteria: SavedCriteria[];
  firebaseConnected: boolean | null;
  onLogin: () => Promise<void>;
  onLoginWithEmailPassword?: (email: string, pass: string) => Promise<void>;
  onRegisterWithEmailPassword?: (email: string, pass: string) => Promise<void>;
  onLogout: () => Promise<void>;
  onSyncLocalToCloud: () => Promise<{ recordsSynced: number; employeesSynced: number }>;
  onOpenWorkspaceHub?: () => void;
  showToast: (msg: string) => void;
}

export function CloudHubModal({
  isOpen,
  onClose,
  user,
  records,
  employees,
  errorTypes,
  savedCriteria,
  firebaseConnected,
  onLogin,
  onLoginWithEmailPassword,
  onRegisterWithEmailPassword,
  onLogout,
  onSyncLocalToCloud,
  onOpenWorkspaceHub,
  showToast
}: CloudHubModalProps) {
  const [isSyncing, setIsSyncing] = useState(false);
  const [syncStatus, setSyncStatus] = useState<string | null>(null);
  const [authMode, setAuthMode] = useState<"google" | "email_login" | "email_register">("google");
  const [emailInput, setEmailInput] = useState("Amanda@aspclass.org");
  const [passwordInput, setPasswordInput] = useState("");
  const [isAuthLoading, setIsAuthLoading] = useState(false);
  const [authError, setAuthError] = useState<string | null>(null);

  if (!isOpen) return null;

  const handleEmailAuth = async (isRegister: boolean) => {
    if (!emailInput.trim() || !passwordInput) {
      setAuthError("Please enter both email address and password.");
      return;
    }
    try {
      setIsAuthLoading(true);
      setAuthError(null);
      if (isRegister && onRegisterWithEmailPassword) {
        await onRegisterWithEmailPassword(emailInput, passwordInput);
        showToast("Account created and signed into Firebase!");
      } else if (onLoginWithEmailPassword) {
        await onLoginWithEmailPassword(emailInput, passwordInput);
        showToast("Signed into Firebase successfully!");
      }
      setPasswordInput("");
    } catch (err: any) {
      const msg = err?.message || "Authentication failed. Please verify credentials.";
      setAuthError(msg);
      showToast("Authentication failed.");
    } finally {
      setIsAuthLoading(false);
    }
  };

  const handleSyncToCloud = async () => {
    try {
      setIsSyncing(true);
      setSyncStatus("Pushing local records and roster to Google Cloud Firestore...");
      const result = await onSyncLocalToCloud();
      setSyncStatus(`Successfully synchronized ${result.recordsSynced} records and ${result.employeesSynced} personnel to your cloud database.`);
      showToast("Cloud Firestore database synchronized!");
    } catch (err: any) {
      setSyncStatus(`Sync error: ${err.message || "Failed to sync"}`);
      showToast("Sync failed. Check connection or authentication.");
    } finally {
      setIsSyncing(false);
    }
  };

  const handleExportBackup = () => {
    const backupData = {
      exportedAt: new Date().toISOString(),
      projectId: firebaseConfig.projectId,
      firestoreDatabaseId: firebaseConfig.firestoreDatabaseId,
      user: user ? { email: user.email, uid: user.uid } : "offline_anonymous",
      records,
      employees,
      errorTypes,
      savedCriteria
    };

    const dataStr = "data:text/json;charset=utf-8," + encodeURIComponent(JSON.stringify(backupData, null, 2));
    const downloadAnchor = document.createElement("a");
    downloadAnchor.setAttribute("href", dataStr);
    downloadAnchor.setAttribute("download", `asp_warranty_cloud_backup_${new Date().toISOString().slice(0, 10)}.json`);
    document.body.appendChild(downloadAnchor);
    downloadAnchor.click();
    downloadAnchor.remove();
    showToast("Complete database backup exported as JSON.");
  };

  return (
    <AnimatePresence>
      <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/80 backdrop-blur-md">
        <motion.div
          initial={{ opacity: 0, scale: 0.95, y: 15 }}
          animate={{ opacity: 1, scale: 1, y: 0 }}
          exit={{ opacity: 0, scale: 0.95, y: 15 }}
          className="w-full max-w-2xl bg-slate-900 border border-cyan-500/40 rounded-2xl shadow-2xl shadow-cyan-950/60 overflow-hidden flex flex-col max-h-[90vh]"
        >
          {/* HEADER */}
          <div className="px-6 py-4 bg-gradient-to-r from-cyan-950 via-slate-900 to-blue-950 border-b border-cyan-500/30 flex items-center justify-between">
            <div className="flex items-center gap-3">
              <div className="p-2 bg-cyan-500/20 border border-cyan-500/40 rounded-xl text-cyan-300">
                <Cloud className="w-5 h-5 animate-pulse" />
              </div>
              <div>
                <h3 className="text-base font-bold text-white tracking-wide flex items-center gap-2 font-serif">
                  <span>CLOUD STORAGE & DATABASE HUB</span>
                  <span className={`text-[10px] font-mono px-2 py-0.5 rounded-full border ${
                    user 
                      ? "bg-emerald-950 border-emerald-500/50 text-emerald-300" 
                      : "bg-amber-950 border-amber-500/50 text-amber-300"
                  }`}>
                    {user ? "AUTHENTICATED" : "LOCAL / OFFLINE"}
                  </span>
                </h3>
                <p className="text-xs text-slate-400 font-mono">
                  Google Cloud Firestore • Real-Time Synchronization Engine
                </p>
              </div>
            </div>
            <button
              onClick={onClose}
              className="p-1.5 text-slate-400 hover:text-white rounded-lg hover:bg-slate-800 transition-colors cursor-pointer"
            >
              <X className="w-5 h-5" />
            </button>
          </div>

          {/* CONTENT BODY */}
          <div className="p-6 overflow-y-auto space-y-5 text-slate-200 text-xs">
            
            {/* GOOGLE ACCOUNT AUTH CARD */}
            <div className="p-4 rounded-xl bg-slate-950/70 border border-slate-800 space-y-3">
              <div className="flex items-center justify-between">
                <span className="text-[11px] font-mono font-bold uppercase tracking-wider text-slate-400 flex items-center gap-1.5">
                  <User className="w-3.5 h-3.5 text-cyan-400" />
                  GOOGLE CLOUD IDENTITY
                </span>
                <span className="text-[10px] font-mono text-cyan-400">
                  {user ? "CONNECTED" : "UNAUTHENTICATED"}
                </span>
              </div>

              {user ? (
                <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 p-3 bg-emerald-950/30 border border-emerald-500/30 rounded-lg">
                  <div className="flex items-center gap-3">
                    {user.photoURL ? (
                      <img src={user.photoURL} alt={user.displayName || "User"} className="w-10 h-10 rounded-full border border-emerald-500/50" />
                    ) : (
                      <div className="w-10 h-10 rounded-full bg-emerald-900 border border-emerald-500/50 flex items-center justify-center text-emerald-300 font-bold">
                        {(user.email?.[0] || (user.isAnonymous ? "A" : "U")).toUpperCase()}
                      </div>
                    )}
                    <div>
                      <div className="font-bold text-white text-sm flex items-center gap-2">
                        <span>{user.displayName || (user.isAnonymous ? "Anonymous Guest Session" : user.email?.split("@")[0] || "Authenticated User")}</span>
                        {user.isAnonymous && (
                          <span className="text-[9px] font-mono px-1.5 py-0.5 rounded bg-amber-950/80 border border-amber-500/40 text-amber-300">
                            GUEST
                          </span>
                        )}
                      </div>
                      <div className="text-[11px] font-mono text-emerald-300">{user.email || "anonymous@aspclass.org"}</div>
                      <div className="text-[9px] font-mono text-slate-400 truncate max-w-xs">UID: {user.uid}</div>
                    </div>
                  </div>

                  <div className="flex items-center gap-2 shrink-0">
                    <button
                      onClick={async () => {
                        await onLogout();
                        showToast("Signed out of Google Cloud account.");
                      }}
                      className="px-3 py-1.5 bg-slate-800 hover:bg-slate-700 border border-slate-600 text-slate-200 rounded-lg text-xs font-mono font-bold flex items-center gap-1.5 cursor-pointer transition-colors"
                    >
                      <LogOut className="w-3.5 h-3.5 text-rose-400" />
                      <span>SIGN OUT</span>
                    </button>
                  </div>
                </div>
              ) : (
                <div className="space-y-4">
                  {/* AUTH MODE TOGGLE TABS */}
                  <div className="flex items-center gap-1 p-1 bg-slate-900 border border-slate-800 rounded-xl">
                    <button
                      onClick={() => { setAuthMode("google"); setAuthError(null); }}
                      className={`flex-1 py-1.5 px-3 rounded-lg text-xs font-mono font-bold transition-all flex items-center justify-center gap-1.5 cursor-pointer ${
                        authMode === "google"
                          ? "bg-cyan-600 text-white shadow-md"
                          : "text-slate-400 hover:text-slate-200"
                      }`}
                    >
                      <Sparkles className="w-3.5 h-3.5" />
                      <span>Google Sign-In</span>
                    </button>
                    <button
                      onClick={() => { setAuthMode("email_login"); setAuthError(null); }}
                      className={`flex-1 py-1.5 px-3 rounded-lg text-xs font-mono font-bold transition-all flex items-center justify-center gap-1.5 cursor-pointer ${
                        authMode === "email_login"
                          ? "bg-cyan-600 text-white shadow-md"
                          : "text-slate-400 hover:text-slate-200"
                      }`}
                    >
                      <Mail className="w-3.5 h-3.5" />
                      <span>Email Login</span>
                    </button>
                    <button
                      onClick={() => { setAuthMode("email_register"); setAuthError(null); }}
                      className={`flex-1 py-1.5 px-3 rounded-lg text-xs font-mono font-bold transition-all flex items-center justify-center gap-1.5 cursor-pointer ${
                        authMode === "email_register"
                          ? "bg-cyan-600 text-white shadow-md"
                          : "text-slate-400 hover:text-slate-200"
                      }`}
                    >
                      <UserPlus className="w-3.5 h-3.5" />
                      <span>Register</span>
                    </button>
                  </div>

                  {authMode === "google" && (
                    <div className="p-4 bg-gradient-to-r from-cyan-950/60 to-blue-950/60 border border-cyan-500/40 rounded-xl flex flex-col sm:flex-row sm:items-center justify-between gap-4">
                      <div>
                        <div className="font-bold text-white text-sm flex items-center gap-2">
                          <span>Connect Google Cloud Account</span>
                          <Sparkles className="w-4 h-4 text-cyan-400 animate-pulse" />
                        </div>
                        <p className="text-[11px] text-slate-300 mt-1 leading-relaxed">
                          Sign in with your Google account (e.g. <span className="text-cyan-300 font-mono">Amanda@aspclass.org</span>) to link directly to Firebase project <span className="text-cyan-300 font-mono">apt-impact-501115-d1</span>.
                        </p>
                      </div>

                      <button
                        onClick={async () => {
                          await onLogin();
                          showToast("Connecting with Google Cloud...");
                        }}
                        className="px-4 py-2.5 bg-gradient-to-r from-cyan-600 to-blue-600 hover:from-cyan-500 hover:to-blue-500 text-white font-bold text-xs uppercase tracking-wider rounded-xl flex items-center justify-center gap-2 shadow-lg shadow-cyan-500/25 transition-all hover:scale-105 cursor-pointer shrink-0"
                      >
                        <LogIn className="w-4 h-4" />
                        <span>SIGN IN WITH GOOGLE</span>
                      </button>
                    </div>
                  )}

                  {(authMode === "email_login" || authMode === "email_register") && (
                    <div className="p-4 bg-slate-900/90 border border-slate-800 rounded-xl space-y-3">
                      <div className="flex items-center justify-between">
                        <span className="font-bold text-white text-xs flex items-center gap-1.5">
                          {authMode === "email_login" ? <LogIn className="w-3.5 h-3.5 text-cyan-400" /> : <UserPlus className="w-3.5 h-3.5 text-cyan-400" />}
                          {authMode === "email_login" ? "Email / Password Login" : "Create New Firebase Account"}
                        </span>
                        <span className="text-[10px] font-mono text-slate-400">Firebase Auth</span>
                      </div>

                      <div className="space-y-2">
                        <div>
                          <label className="text-[10px] font-mono text-slate-400 block mb-1">Email Address</label>
                          <div className="relative">
                            <Mail className="w-3.5 h-3.5 text-slate-500 absolute left-3 top-2.5" />
                            <input
                              type="email"
                              value={emailInput}
                              onChange={(e) => setEmailInput(e.target.value)}
                              placeholder="name@aspclass.org"
                              className="w-full bg-slate-950 border border-slate-700 focus:border-cyan-400 rounded-lg pl-9 pr-3 py-2 text-xs font-mono text-white outline-none"
                            />
                          </div>
                        </div>

                        <div>
                          <label className="text-[10px] font-mono text-slate-400 block mb-1">Password</label>
                          <div className="relative">
                            <Lock className="w-3.5 h-3.5 text-slate-500 absolute left-3 top-2.5" />
                            <input
                              type="password"
                              value={passwordInput}
                              onChange={(e) => setPasswordInput(e.target.value)}
                              placeholder="••••••••••••"
                              onKeyDown={(e) => {
                                if (e.key === "Enter") handleEmailAuth(authMode === "email_register");
                              }}
                              className="w-full bg-slate-950 border border-slate-700 focus:border-cyan-400 rounded-lg pl-9 pr-3 py-2 text-xs font-mono text-white outline-none"
                            />
                          </div>
                        </div>
                      </div>

                      {authError && (
                        <div className="p-2 bg-rose-950/60 border border-rose-500/40 rounded-lg text-rose-300 text-[10px] flex items-center gap-1.5">
                          <AlertTriangle className="w-3.5 h-3.5 shrink-0 text-rose-400" />
                          <span>{authError}</span>
                        </div>
                      )}

                      <button
                        disabled={isAuthLoading}
                        onClick={() => handleEmailAuth(authMode === "email_register")}
                        className="w-full py-2.5 bg-gradient-to-r from-cyan-600 to-blue-600 hover:from-cyan-500 hover:to-blue-500 text-white font-bold text-xs uppercase tracking-wider rounded-lg flex items-center justify-center gap-2 shadow-md cursor-pointer transition-all disabled:opacity-50"
                      >
                        {isAuthLoading ? (
                          <RefreshCw className="w-3.5 h-3.5 animate-spin" />
                        ) : authMode === "email_login" ? (
                          <LogIn className="w-3.5 h-3.5" />
                        ) : (
                          <UserPlus className="w-3.5 h-3.5" />
                        )}
                        <span>
                          {isAuthLoading 
                            ? "Authenticating..." 
                            : authMode === "email_login" ? "Sign In With Email" : "Create Account & Sign In"}
                        </span>
                      </button>
                    </div>
                  )}
                </div>
              )}
            </div>

            {/* FIRESTORE DATABASE INFRASTRUCTURE METRICS */}
            <div className="p-4 rounded-xl bg-slate-950/70 border border-slate-800 space-y-3">
              <span className="text-[11px] font-mono font-bold uppercase tracking-wider text-slate-400 flex items-center gap-1.5">
                <Database className="w-3.5 h-3.5 text-blue-400" />
                FIRESTORE CLOUD METRICS
              </span>

              <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
                <div className="p-3 bg-slate-900 border border-slate-800 rounded-lg text-center">
                  <div className="text-[10px] font-mono text-slate-400 uppercase">Records / Audits</div>
                  <div className="text-lg font-bold text-cyan-400 font-mono mt-1">{records.length}</div>
                </div>
                <div className="p-3 bg-slate-900 border border-slate-800 rounded-lg text-center">
                  <div className="text-[10px] font-mono text-slate-400 uppercase">Staff Roster</div>
                  <div className="text-lg font-bold text-emerald-400 font-mono mt-1">{employees.length}</div>
                </div>
                <div className="p-3 bg-slate-900 border border-slate-800 rounded-lg text-center">
                  <div className="text-[10px] font-mono text-slate-400 uppercase">Error Codes</div>
                  <div className="text-lg font-bold text-purple-400 font-mono mt-1">{errorTypes.length}</div>
                </div>
                <div className="p-3 bg-slate-900 border border-slate-800 rounded-lg text-center">
                  <div className="text-[10px] font-mono text-slate-400 uppercase">Saved Profiles</div>
                  <div className="text-lg font-bold text-amber-400 font-mono mt-1">{savedCriteria.length}</div>
                </div>
              </div>

              <div className="p-2.5 bg-slate-900/90 border border-slate-800 rounded-lg text-[10px] font-mono text-slate-400 space-y-1">
                <div><strong className="text-slate-300">Project ID:</strong> {firebaseConfig.projectId}</div>
                <div><strong className="text-slate-300">Firestore Database ID:</strong> {firebaseConfig.firestoreDatabaseId}</div>
                <div><strong className="text-slate-300">Telemetry Status:</strong> {firebaseConnected === true ? "Connected & Healthy (Real-time WebSockets active)" : "Connecting / Fallback mode"}</div>
              </div>
            </div>

            {/* SYNC & BACKUP ACTIONS */}
            <div className="space-y-3">
              <div className="text-[11px] font-mono font-bold uppercase tracking-wider text-slate-400 flex items-center gap-1.5">
                <RefreshCw className="w-3.5 h-3.5 text-emerald-400" />
                CLOUD SYNCHRONIZATION & BACKUP TOOLS
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                {/* Push Local to Cloud */}
                <button
                  disabled={!user || isSyncing}
                  onClick={handleSyncToCloud}
                  className={`p-3 rounded-xl border text-left flex items-start gap-3 transition-all ${
                    user && !isSyncing 
                      ? "bg-slate-950 hover:bg-slate-900 border-cyan-500/40 hover:border-cyan-400 cursor-pointer shadow-md hover:shadow-cyan-500/10" 
                      : "bg-slate-950/40 border-slate-800 text-slate-600 cursor-not-allowed"
                  }`}
                >
                  <Upload className={`w-4 h-4 mt-0.5 ${user ? "text-cyan-400" : "text-slate-600"}`} />
                  <div>
                    <div className="font-bold text-white text-xs">Push Local Records to Cloud</div>
                    <div className="text-[10px] text-slate-400 mt-0.5">
                      Uploads all local audit records and staff roster to your cloud database.
                    </div>
                  </div>
                </button>

                {/* Export JSON Backup */}
                <button
                  onClick={handleExportBackup}
                  className="p-3 rounded-xl bg-slate-950 hover:bg-slate-900 border border-slate-800 hover:border-slate-700 text-left flex items-start gap-3 transition-all cursor-pointer shadow-md"
                >
                  <Download className="w-4 h-4 mt-0.5 text-emerald-400" />
                  <div>
                    <div className="font-bold text-white text-xs">Export Complete Backup (JSON)</div>
                    <div className="text-[10px] text-slate-400 mt-0.5">
                      Download full offline JSON snapshot of claims, roster, and compliance rules.
                    </div>
                  </div>
                </button>
              </div>

              {syncStatus && (
                <div className="p-3 bg-cyan-950/50 border border-cyan-500/40 rounded-xl text-cyan-200 text-[11px] font-mono flex items-center gap-2">
                  <CheckCircle2 className="w-4 h-4 text-cyan-400 shrink-0" />
                  <span>{syncStatus}</span>
                </div>
              )}
            </div>

            {/* GOOGLE WORKSPACE HUB BANNER */}
            {onOpenWorkspaceHub && (
              <div className="p-3.5 bg-gradient-to-r from-red-950/40 via-slate-950 to-blue-950/40 border border-red-500/30 rounded-xl flex items-center justify-between gap-3">
                <div className="flex items-center gap-3">
                  <FileSpreadsheet className="w-5 h-5 text-red-400 shrink-0" />
                  <div>
                    <div className="font-bold text-white text-xs">Google Workspace Integration</div>
                    <div className="text-[10px] text-slate-400">Sync with Google Sheets, Google Drive, Gmail, Docs & Forms.</div>
                  </div>
                </div>
                <button
                  onClick={() => {
                    onClose();
                    onOpenWorkspaceHub();
                  }}
                  className="px-3 py-1.5 bg-red-950 hover:bg-red-900 border border-red-500/40 text-red-200 hover:text-white rounded-lg text-xs font-mono font-bold flex items-center gap-1.5 cursor-pointer transition-colors shrink-0"
                >
                  <span>OPEN WORKSPACE HUB</span>
                  <ExternalLink className="w-3 h-3" />
                </button>
              </div>
            )}

          </div>

          {/* FOOTER */}
          <div className="px-6 py-3 bg-slate-950 border-t border-slate-800 flex items-center justify-between text-[11px] font-mono text-slate-500">
            <span>ASP Dealership Compliance Cloud System</span>
            <button
              onClick={onClose}
              className="px-4 py-1.5 bg-slate-800 hover:bg-slate-700 text-slate-200 rounded-lg text-xs font-mono font-bold cursor-pointer transition-colors"
            >
              CLOSE
            </button>
          </div>
        </motion.div>
      </div>
    </AnimatePresence>
  );
}
