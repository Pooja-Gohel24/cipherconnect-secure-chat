import { useState, useEffect, useRef } from 'react';
import type { ChangeEvent, FormEvent, DragEvent } from 'react';
import { useNavigate } from 'react-router-dom';
import { userService } from '../services/userService';

interface User {
  id: string;
  username: string;
  email: string;
  bio?: string;
  profile_picture_url?: string;
  status?: string;
  role: string;
  created_at: string;
  last_seen?: string;
}

const STATUS_OPTIONS = [
  { value: "online", label: "Online", color: "bg-green-500" },
  { value: "away", label: "Away", color: "bg-yellow-500" },
  { value: "busy", label: "Busy", color: "bg-red-500" },
  { value: "offline", label: "Offline", color: "bg-gray-500" },
];

// Helper function to format dates in India/Kolkata timezone (GMT+5:30) - 12 hour format
const formatDate = (dateString: string | undefined): string => {
  if (!dateString) return 'N/A';
  
  // Parse the date string
  const date = new Date(dateString);
  
  // Check if the date is valid
  if (isNaN(date.getTime())) return 'N/A';
  
  // Format as India/Kolkata timezone (GMT+5:30) - 12 hour format with AM/PM
  return date.toLocaleString('en-IN', {
    timeZone: 'Asia/Kolkata',
    year: 'numeric',
    month: 'short',
    day: 'numeric',
    hour: '2-digit',
    minute: '2-digit',
    second: '2-digit',
    hour12: true,
    timeZoneName: 'short'
  });
};

// Helper function to format date only in India/Kolkata timezone
const formatDateOnly = (dateString: string | undefined): string => {
  if (!dateString) return 'N/A';
  
  const date = new Date(dateString);
  
  if (isNaN(date.getTime())) return 'N/A';
  
  return date.toLocaleDateString('en-IN', {
    timeZone: 'Asia/Kolkata',
    year: 'numeric',
    month: 'short',
    day: 'numeric'
  });
};

export default function ProfilePage() {
  const [user, setUser] = useState<User | null>(null);
  const [editing, setEditing] = useState(false);
  const [bio, setBio] = useState('');
  const [status, setStatus] = useState('online');
  const [profilePictureUrl, setProfilePictureUrl] = useState('');
  const [isDragging, setIsDragging] = useState(false);
  const [loading, setLoading] = useState(true);
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState('');
  const [success, setSuccess] = useState('');
  const fileInputRef = useRef<HTMLInputElement>(null);
  const navigate = useNavigate();

  useEffect(() => {
    loadProfile();
  }, []);

  const loadProfile = async () => {
    try {
      const res = await userService.getMe();
      setUser(res.data);
      setBio(res.data.bio || '');
      setStatus(res.data.status || 'online');
      setProfilePictureUrl(res.data.profile_picture_url || '');
      setLoading(false);
    } catch (err) {
      console.error(err);
      navigate('/login');
    }
  };

  const getStatusColor = (statusValue: string) => {
    const statusOption = STATUS_OPTIONS.find((s) => s.value === statusValue);
    return statusOption?.color || "bg-gray-500";
  };

  const getStatusLabel = (statusValue: string) => {
    const statusOption = STATUS_OPTIONS.find((s) => s.value === statusValue);
    return statusOption?.label || "Offline";
  };

  // Handle drag and drop events
  const handleDragOver = (e: DragEvent<HTMLDivElement>) => {
    e.preventDefault();
    setIsDragging(true);
  };

  const handleDragLeave = (e: DragEvent<HTMLDivElement>) => {
    e.preventDefault();
    setIsDragging(false);
  };

  const handleDrop = (e: DragEvent<HTMLDivElement>) => {
    e.preventDefault();
    setIsDragging(false);
    
    const files = e.dataTransfer.files;
    if (files.length > 0) {
      handleFileSelect(files[0]);
    }
  };

  const handleFileInputChange = (e: ChangeEvent<HTMLInputElement>) => {
    const files = e.target.files;
    if (files && files.length > 0) {
      handleFileSelect(files[0]);
    }
  };

  const handleFileSelect = async (file: File) => {
    // Validate file type
    if (!file.type.startsWith('image/')) {
      setError("Please select an image file");
      return;
    }

    // Validate file size (max 5MB)
    if (file.size > 5 * 1024 * 1024) {
      setError("File size must be less than 5MB");
      return;
    }

    // Upload the file
    try {
      setError('');
      const response = await userService.uploadProfilePicture(file);
      setProfilePictureUrl(response.data.profile_picture_url);
      setSuccess('Profile picture uploaded successfully!');
    } catch (err: any) {
      setError(err.response?.data?.detail || 'Failed to upload image. Please try again.');
      console.error('Upload error:', err);
    }
  };

  const handleRemoveImage = () => {
    setProfilePictureUrl('');
    if (fileInputRef.current) {
      fileInputRef.current.value = '';
    }
  };

  const updateProfile = async () => {
    setSubmitting(true);
    setError('');
    setSuccess('');
    
    try {
      await userService.updateMe({ 
        bio, 
        status,
        profile_picture_url: profilePictureUrl || null
      });
      setSuccess('Profile updated successfully!');
      setEditing(false);
      loadProfile();
    } catch (err: any) {
      setError(err.response?.data?.detail || 'Failed to update profile');
    } finally {
      setSubmitting(false);
    }
  };

  if (loading || !user) return (
    <div className="flex items-center justify-center h-screen bg-[#f8f8f8]">
      <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-[#4a154b]"></div>
    </div>
  );

  return (
    <div className="min-h-screen bg-[#f8f8f8] py-8 px-4">
      <div className="max-w-4xl mx-auto">
        <div className="bg-white rounded-lg shadow-sm border border-gray-200 overflow-hidden">
          {/* Header */}
          <div className="h-32 bg-[#4a154b]"></div>
          
          {/* Profile Content */}
          <div className="relative px-8 pb-8">
            <div className="flex flex-col items-center -mt-16">
              {/* Profile Picture with Status */}
              <div className="relative">
                <div className="w-32 h-32 bg-white rounded-lg border-4 border-white shadow-lg flex items-center justify-center overflow-hidden">
                  {profilePictureUrl ? (
                    <img 
                      src={profilePictureUrl.startsWith('/') ? `http://127.0.0.1:8000${profilePictureUrl}` : profilePictureUrl} 
                      alt="Profile" 
                      className="w-full h-full object-cover"
                      onError={(e) => {
                        (e.target as HTMLImageElement).src = '';
                        setProfilePictureUrl('');
                      }}
                    />
                  ) : (
                    <div className="w-full h-full bg-[#e01e5a] flex items-center justify-center text-white text-4xl font-bold">
                      {user.username[0].toUpperCase()}
                    </div>
                  )}
                </div>
                {/* Status indicator */}
                <div className={`absolute bottom-1 right-1 h-5 w-5 rounded-full border-2 border-white ${getStatusColor(status)}`}></div>
              </div>
              
              <h1 className="mt-4 text-2xl font-bold text-gray-900">{user.username}</h1>
              <p className="text-gray-600">{user.email}</p>
              <span className="mt-2 px-3 py-1 bg-[#4a154b]/10 text-[#4a154b] rounded-full text-sm font-semibold">{user.role}</span>
            </div>

            {/* Success/Error Messages */}
            {success && (
              <div className="mt-4 p-3 bg-green-50 border border-green-200 rounded-lg">
                <p className="text-sm text-green-600">{success}</p>
              </div>
            )}
            {error && (
              <div className="mt-4 p-3 bg-red-50 border border-red-200 rounded-lg">
                <p className="text-sm text-red-600">{error}</p>
              </div>
            )}

            <div className="mt-8 space-y-6">
              {/* Bio Section */}
              <div className="bg-[#f8f8f8] rounded-lg p-6">
                <div className="flex items-center justify-between mb-4">
                  <h3 className="text-lg font-semibold text-gray-900">About</h3>
                  <button onClick={() => setEditing(!editing)} className="text-[#4a154b] hover:text-[#611f69] font-medium text-sm">
                    {editing ? 'Cancel' : 'Edit'}
                  </button>
                </div>
                
                {editing ? (
                  <div className="space-y-4">
                    {/* Profile Picture with Drag and Drop */}
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-2">Profile Picture</label>
                      
                      {/* Drag and Drop Area */}
                      <div
                        className={`mt-2 flex flex-col items-center justify-center rounded-lg border-2 border-dashed p-4 transition-colors ${
                          isDragging 
                            ? 'border-[#4a154b] bg-[#4a154b]/5' 
                            : 'border-gray-300 hover:border-gray-400'
                        }`}
                        onDragOver={handleDragOver}
                        onDragLeave={handleDragLeave}
                        onDrop={handleDrop}
                      >
                        {profilePictureUrl ? (
                          <div className="relative">
                            <img
                              src={profilePictureUrl.startsWith('/') ? `http://127.0.0.1:8000${profilePictureUrl}` : profilePictureUrl}
                              alt="Preview"
                              className="h-24 w-24 rounded-full object-cover border-2 border-gray-200"
                              onError={(e) => {
                                (e.target as HTMLImageElement).src = '';
                                setProfilePictureUrl('');
                              }}
                            />
                            <button
                              type="button"
                              onClick={handleRemoveImage}
                              className="absolute -top-2 -right-2 flex h-6 w-6 items-center justify-center rounded-full bg-red-500 text-white hover:bg-red-600"
                            >
                              <svg className="h-3 w-3" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                              </svg>
                            </button>
                          </div>
                        ) : (
                          <div className="flex flex-col items-center gap-2 py-2">
                            <svg className="h-10 w-10 text-gray-400" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 16l4.586-4.586a2 2 0 012.828 0L16 16m-2-2l1.586-1.586a2 2 0 012.828 0L20 14m-6-6h.01M6 20h12a2 2 0 002-2V6a2 2 0 00-2-2H6a2 2 0 00-2 2v12a2 2 0 002 2z" />
                            </svg>
                            <p className="text-sm text-gray-500">Drag and drop an image here</p>
                          </div>
                        )}
                        
                        <input
                          ref={fileInputRef}
                          type="file"
                          accept="image/*"
                          onChange={handleFileInputChange}
                          className="hidden"
                        />
                        
                        <button
                          type="button"
                          onClick={() => fileInputRef.current?.click()}
                          className="mt-2 rounded-lg border border-gray-300 px-4 py-2 text-sm font-medium text-gray-700 hover:bg-gray-100"
                        >
                          {profilePictureUrl ? "Change Image" : "Select Image"}
                        </button>
                        <p className="mt-1 text-xs text-gray-400">Max file size: 5MB</p>
                      </div>
                    </div>

                    {/* Status Dropdown */}
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-2">Status</label>
                      <div className="relative">
                        <div className="pointer-events-none absolute inset-y-0 left-0 flex items-center pl-4">
                          <div className={`h-5 w-5 rounded-full ${getStatusColor(status)}`}></div>
                        </div>
                        <select
                          value={status}
                          onChange={(e) => setStatus(e.target.value)}
                          className="w-full rounded-lg border border-gray-300 py-3 pl-12 pr-4 text-gray-900 outline-none focus:ring-2 focus:ring-[#4a154b] focus:border-transparent"
                        >
                          {STATUS_OPTIONS.map((option) => (
                            <option key={option.value} value={option.value}>
                              {option.label}
                            </option>
                          ))}
                        </select>
                      </div>
                    </div>

                    {/* Bio */}
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-2">Bio</label>
                      <textarea 
                        value={bio} 
                        onChange={(e) => setBio(e.target.value)} 
                        rows={3} 
                        className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-[#4a154b] focus:border-transparent outline-none"
                        placeholder="Tell us about yourself..."
                        maxLength={255}
                      />
                      <p className="mt-1 text-xs text-gray-500">{bio.length}/255 characters</p>
                    </div>

                    <button 
                      onClick={updateProfile} 
                      disabled={submitting}
                      className="w-full py-3 bg-[#4a154b] text-white rounded-lg hover:bg-[#611f69] font-semibold disabled:opacity-50 disabled:cursor-not-allowed"
                    >
                      {submitting ? 'Saving...' : 'Save Changes'}
                    </button>
                  </div>
                ) : (
                  <div className="space-y-3">
                    <p className="text-gray-700">{user.bio || 'No bio yet'}</p>
                    <div className="flex items-center space-x-2">
                      <div className={`w-2 h-2 rounded-full ${getStatusColor(user.status || 'offline')}`}></div>
                      <span className="text-gray-600">{getStatusLabel(user.status || 'offline')}</span>
                    </div>
                  </div>
                )}
              </div>

              {/* Stats */}
              <div className="grid grid-cols-3 gap-4">
                <div className="bg-[#4a154b]/5 rounded-lg p-6 text-center">
                  <p className="text-3xl font-bold text-gray-900">0</p>
                  <p className="text-gray-600 text-sm mt-1">Messages</p>
                </div>
                <div className="bg-[#e01e5a]/5 rounded-lg p-6 text-center">
                  <p className="text-3xl font-bold text-gray-900">0</p>
                  <p className="text-gray-600 text-sm mt-1">Contacts</p>
                </div>
                <div className="bg-[#36c5f0]/5 rounded-lg p-6 text-center">
                  <p className="text-3xl font-bold text-gray-900">0</p>
                  <p className="text-gray-600 text-sm mt-1">Groups</p>
                </div>
              </div>

              {/* Account Info - without User ID */}
              <div className="bg-[#f8f8f8] rounded-lg p-6">
                <h3 className="text-lg font-semibold text-gray-900 mb-4">Account Information</h3>
                <div className="space-y-3">
                  <div className="flex justify-between">
                    <span className="text-gray-600">Member Since</span>
                    <span className="text-gray-900">{formatDateOnly(user.created_at)}</span>
                  </div>
                  {user.last_seen && (
                    <div className="flex justify-between">
                      <span className="text-gray-600">Last Seen</span>
                      <span className="text-gray-900">{formatDate(user.last_seen)}</span>
                    </div>
                  )}
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
