 import { Link, Outlet, useNavigate } from "react-router-dom";

import { useAuth } from "../hooks/useAuth";

export default function AppLayout() {
  const { user, logout } = useAuth();
  const navigate = useNavigate();

  const handleLogout = async () => {
    const refreshToken = localStorage.getItem("cipherconnect_refresh_token");
    
    // Clear storage first
    localStorage.clear();
    sessionStorage.clear();
    
    // Call logout API
    if (refreshToken) {
      try {
        await logout();
      } catch (err) {
        console.error("Logout error:", err);
      }
    }
    
    // Force complete page reload to login
    window.location.replace("/login");
  };

  return (
    <div className="min-h-screen bg-[#f8f8f8]">
      {/* Slack-style Navigation */}
      <nav className="bg-[#4a154b] border-b border-[#3d0e40]">
        <div className="w-full px-4">
          <div className="flex justify-between h-14">
            <div className="flex items-center space-x-6">
              <div className="flex items-center space-x-2">
                <div className="w-8 h-8 bg-white rounded flex items-center justify-center">
                  <span className="text-[#4a154b] font-bold text-lg">C</span>
                </div>
                <span className="text-white font-bold text-lg">CipherConnect</span>
              </div>
              <div className="hidden md:flex space-x-1">
                <Link to="/dashboard" className="px-3 py-2 text-white hover:bg-[#611f69] rounded text-sm font-medium">Dashboard</Link>
                <Link to="/chat" className="px-3 py-2 text-white hover:bg-[#611f69] rounded text-sm font-medium">Messages</Link>
                <Link to="/contacts" className="px-3 py-2 text-white hover:bg-[#611f69] rounded text-sm font-medium">Contacts</Link>
                <Link to="/groups" className="px-3 py-2 text-white hover:bg-[#611f69] rounded text-sm font-medium">Groups</Link>
                <Link to="/reports" className="px-3 py-2 text-white hover:bg-[#611f69] rounded text-sm font-medium">Reports</Link>
                {(user?.role === "admin" || user?.role === "superadmin") && (
                  <Link to="/admin" className="px-3 py-2 text-white hover:bg-[#611f69] rounded text-sm font-medium">Admin</Link>
                )}
              </div>
            </div>
            <div className="flex items-center space-x-3">
              <Link to="/profile" className="flex items-center space-x-2 px-3 py-1 hover:bg-[#611f69] rounded">
                <div className="w-7 h-7 bg-[#e01e5a] rounded flex items-center justify-center text-white font-semibold text-sm overflow-hidden">
                  {user?.profile_picture_url ? (
                    <img 
                      src={user.profile_picture_url.startsWith('/') ? `http://127.0.0.1:8000${user.profile_picture_url}` : user.profile_picture_url} 
                      alt={user.username} 
                      className="w-full h-full object-cover" 
                    />
                  ) : (
                    user?.username?.[0]?.toUpperCase() || "U"
                  )}
                </div>
                <span className="text-white text-sm font-medium hidden md:block">{user?.username || "User"}</span>
              </Link>
              <button onClick={handleLogout} className="px-3 py-1.5 bg-transparent border border-white/30 text-white rounded hover:bg-white/10 text-sm font-medium">
                Sign out
              </button>
            </div>
          </div>
        </div>
      </nav>
      <main className="w-full px-4 py-6">
        <Outlet />
      </main>
    </div>
  );
}
