import { useState, useEffect, useRef } from "react";
import type { ChangeEvent, FormEvent, DragEvent } from "react";
import { useNavigate } from "react-router-dom";

import { useAuth } from "../hooks/useAuth";
import { updateUserProfile, type UpdateProfilePayload } from "../services/auth";

interface ProfileFormState {
  profile_picture_url: string;
  bio: string;
  status: string;
}

interface ValidationErrors {
  profile_picture_url?: string;
  bio?: string;
  status?: string;
}

const STATUS_OPTIONS = [
  { value: "online", label: "Online", color: "bg-green-500" },
  { value: "away", label: "Away", color: "bg-yellow-500" },
  { value: "busy", label: "Busy", color: "bg-red-500" },
  { value: "offline", label: "Offline", color: "bg-gray-500" },
];

export default function ProfilePage() {
  const navigate = useNavigate();
  const { user, setUser, accessToken } = useAuth();
  const fileInputRef = useRef<HTMLInputElement>(null);
  const [form, setForm] = useState<ProfileFormState>({
    profile_picture_url: "",
    bio: "",
    status: "online",
  });
  const [errors, setErrors] = useState<ValidationErrors>({});
  const [success, setSuccess] = useState("");
  const [error, setError] = useState("");
  const [submitting, setSubmitting] = useState(false);
  const [loading, setLoading] = useState(true);
  const [isDragging, setIsDragging] = useState(false);

  // Load user data on mount
  useEffect(() => {
    if (user) {
      setForm({
        profile_picture_url: user.profile_picture_url || "",
        bio: user.bio || "",
        status: user.status || "online",
      });
      setLoading(false);
    }
  }, [user]);

  const validateForm = (): boolean => {
    const newErrors: ValidationErrors = {};

    // Profile picture URL validation (optional) - allow blob URLs from drag/drop
    if (form.profile_picture_url && !form.profile_picture_url.startsWith('blob:') && !/^https?:\/\/.+/.test(form.profile_picture_url)) {
      newErrors.profile_picture_url = "Please enter a valid URL";
    }

    // Bio validation (optional - max 255 chars)
    if (form.bio.length > 255) {
      newErrors.bio = "Bio must be less than 255 characters";
    }

    // Status validation
    const validStatuses = STATUS_OPTIONS.map((s) => s.value);
    if (!validStatuses.includes(form.status)) {
      newErrors.status = "Invalid status selected";
    }

    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const onChange = (e: ChangeEvent<HTMLInputElement | HTMLTextAreaElement | HTMLSelectElement>) => {
    const { name, value } = e.target;
    setForm((prev) => ({ ...prev, [name]: value }));
    // Clear error when user starts typing
    if (errors[name as keyof ValidationErrors]) {
      setErrors((prev) => ({ ...prev, [name]: undefined }));
    }
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

  const handleFileSelect = (file: File) => {
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

    // Create a URL for the uploaded file
    const imageUrl = URL.createObjectURL(file);
    setForm((prev) => ({ ...prev, profile_picture_url: imageUrl }));
    setError("");
  };

  const handleRemoveImage = () => {
    setForm((prev) => ({ ...prev, profile_picture_url: "" }));
    if (fileInputRef.current) {
      fileInputRef.current.value = "";
    }
  };

  const onSubmit = async (e: FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    setError("");
    setSuccess("");

    if (!validateForm()) {
      return;
    }

    if (!accessToken) {
      setError("You must be logged in to update your profile");
      return;
    }

    setSubmitting(true);
    try {
      const payload: UpdateProfilePayload = {
        profile_picture_url: form.profile_picture_url || null,
        bio: form.bio || null,
        status: form.status,
      };

      const updatedUser = await updateUserProfile(payload, accessToken);
      setUser(updatedUser);
      setSuccess("Profile updated successfully!");
      
      // Redirect to home page after successful update
      setTimeout(() => {
        navigate("/");
      }, 1500);
    } catch (err: unknown) {
      const message =
        typeof err === "object" &&
        err !== null &&
        "response" in err &&
        typeof (err as { response?: { data?: { detail?: string } } }).response?.data?.detail === "string"
          ? (err as { response: { data: { detail: string } } }).response.data.detail
          : "Failed to update profile. Please try again.";
      setError(message);
    } finally {
      setSubmitting(false);
    }
  };

  const getStatusColor = (status: string) => {
    const statusOption = STATUS_OPTIONS.find((s) => s.value === status);
    return statusOption?.color || "bg-gray-500";
  };

  if (loading) {
    return (
      <div className="flex min-h-screen items-center justify-center bg-black">
        <div className="flex flex-col items-center gap-4">
          <svg className="h-10 w-10 animate-spin text-white" fill="none" viewBox="0 0 24 24">
            <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
            <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
          </svg>
          <p className="text-white">Loading profile...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="flex min-h-screen items-center justify-center bg-black px-4 py-12">
      <form
        onSubmit={onSubmit}
        className="w-full max-w-md rounded-2xl border border-white bg-white p-8 shadow-2xl"
      >
        {/* Header with Avatar */}
        <div className="mb-6 text-center">
          <div className="relative mx-auto mb-3 inline-block">
            {form.profile_picture_url ? (
              <img
                src={form.profile_picture_url}
                alt="Profile"
                className="h-24 w-24 rounded-full border-4 border-black object-cover shadow-lg"
                onError={(e) => {
                  (e.target as HTMLImageElement).src = "";
                  (e.target as HTMLImageElement).style.display = "none";
                }}
              />
            ) : (
              <div className="flex h-24 w-24 items-center justify-center rounded-full border-4 border-black bg-black shadow-lg">
                <svg className="h-12 w-12 text-white" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M16 7a4 4 0 11-8 0 4 4 0 018 0zM12 14a7 7 0 00-7 7h14a7 7 0 00-7-7z" />
                </svg>
              </div>
            )}
            <div className={`absolute bottom-1 right-1 h-5 w-5 rounded-full border-2 border-white ${getStatusColor(form.status)}`}></div>
          </div>
          <h1 className="text-3xl font-bold text-black">{user?.username}</h1>
          <p className="mt-1 text-sm text-gray-600">{user?.email}</p>
          <p className="mt-1 text-xs text-gray-500">Role: {user?.role}</p>
        </div>

        {/* Success Message */}
        {success && (
          <div className="mb-4 flex items-center gap-2 rounded-lg border border-green-200 bg-green-50 p-3">
            <svg className="h-5 w-5 text-green-500 flex-shrink-0" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" />
            </svg>
            <p className="text-sm text-green-600">{success}</p>
          </div>
        )}

        {/* Error Message */}
        {error && (
          <div className="mb-4 flex items-center gap-2 rounded-lg border border-red-200 bg-red-50 p-3">
            <svg className="h-5 w-5 text-red-500 flex-shrink-0" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4m0 4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
            </svg>
            <p className="text-sm text-red-600">{error}</p>
          </div>
        )}

        <div className="space-y-5">
          {/* Profile Picture with Drag and Drop */}
          <div>
            <label className="block text-sm font-semibold text-black">Profile Picture</label>
            
            {/* Drag and Drop Area */}
            <div
              className={`mt-2 flex flex-col items-center justify-center rounded-lg border-2 border-dashed p-4 transition-colors ${
                isDragging 
                  ? 'border-black bg-gray-100' 
                  : 'border-gray-300 hover:border-gray-400'
              }`}
              onDragOver={handleDragOver}
              onDragLeave={handleDragLeave}
              onDrop={handleDrop}
            >
              {form.profile_picture_url ? (
                <div className="relative">
                  <img
                    src={form.profile_picture_url}
                    alt="Preview"
                    className="h-32 w-32 rounded-full object-cover border-2 border-black"
                    onError={(e) => {
                      (e.target as HTMLImageElement).src = "";
                      (e.target as HTMLImageElement).style.display = "none";
                    }}
                  />
                  <button
                    type="button"
                    onClick={handleRemoveImage}
                    className="absolute -top-2 -right-2 flex h-8 w-8 items-center justify-center rounded-full bg-red-500 text-white hover:bg-red-600"
                  >
                    <svg className="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                    </svg>
                  </button>
                </div>
              ) : (
                <div className="flex flex-col items-center gap-2 py-4">
                  <svg className="h-12 w-12 text-gray-400" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 16l4.586-4.586a2 2 0 012.828 0L16 16m-2-2l1.586-1.586a2 2 0 012.828 0L20 14m-6-6h.01M6 20h12a2 2 0 002-2V6a2 2 0 00-2-2H6a2 2 0 00-2 2v12a2 2 0 002 2z" />
                  </svg>
                  <p className="text-sm text-gray-500">Drag and drop an image here</p>
                  <p className="text-xs text-gray-400">or</p>
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
                className="mt-2 rounded-lg border border-black px-4 py-2 text-sm font-medium text-black hover:bg-gray-100"
              >
                {form.profile_picture_url ? "Change Image" : "Select Image"}
              </button>
              <p className="mt-1 text-xs text-gray-400">Max file size: 5MB</p>
            </div>

            {/* URL Input (alternative) */}
            <div className="mt-3">
              <label className="block text-xs text-gray-500">Or use a URL:</label>
              <div className="relative mt-1">
                <div className="pointer-events-none absolute inset-y-0 left-0 flex items-center pl-4">
                  <svg className="h-5 w-5 text-black" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13.828 10.172a4 4 0 00-5.656 0l-4 4a4 4 0 105.656 5.656l1.102-1.101m-.758-4.899a4 4 0 005.656 0l4-4a4 4 0 00-5.656-5.656l-1.1 1.1" />
                  </svg>
                </div>
                <input
                  className={`w-full rounded-lg border ${errors.profile_picture_url ? 'border-red-500 bg-red-50' : 'border-black bg-white'} py-3 pl-12 pr-4 text-black outline-none transition-all focus:border-black focus:ring-2 focus:ring-black`}
                  type="text"
                  name="profile_picture_url"
                  placeholder="https://example.com/avatar.jpg"
                  value={form.profile_picture_url.startsWith('blob:') ? '' : form.profile_picture_url}
                  onChange={onChange}
                />
              </div>
              {errors.profile_picture_url && (
                <p className="mt-1 flex items-center gap-1 text-sm text-red-500">
                  <svg className="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4m0 4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
                  </svg>
                  {errors.profile_picture_url}
                </p>
              )}
            </div>
          </div>

          {/* Status */}
          <div>
            <label className="block text-sm font-semibold text-black">Status</label>
            <div className="relative mt-1">
              <div className="pointer-events-none absolute inset-y-0 left-0 flex items-center pl-4">
                <div className={`h-5 w-5 rounded-full ${getStatusColor(form.status)}`}></div>
              </div>
              <select
                className="w-full rounded-lg border border-black bg-white py-3 pl-12 pr-4 text-black outline-none transition-all focus:border-black focus:ring-2 focus:ring-black"
                name="status"
                value={form.status}
                onChange={onChange}
              >
                {STATUS_OPTIONS.map((option) => (
                  <option key={option.value} value={option.value}>
                    {option.label}
                  </option>
                ))}
              </select>
            </div>
            {errors.status && (
              <p className="mt-1 flex items-center gap-1 text-sm text-red-500">
                <svg className="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4m0 4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
                </svg>
                {errors.status}
              </p>
            )}
          </div>

          {/* Bio */}
          <div>
            <label className="block text-sm font-semibold text-black">Bio</label>
            <div className="relative mt-1">
              <div className="pointer-events-none absolute top-3 left-0 flex items-center pl-4">
                <svg className="h-5 w-5 text-black" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M16 7a4 4 0 11-8 0 4 4 0 018 0zM12 14a7 7 0 00-7 7h14a7 7 0 00-7-7z" />
                </svg>
              </div>
              <textarea
                className={`w-full rounded-lg border ${errors.bio ? 'border-red-500 bg-red-50' : 'border-black bg-white'} py-3 pl-12 pr-4 text-black outline-none transition-all focus:border-black focus:ring-2 focus:ring-black`}
                name="bio"
                placeholder="Tell us about yourself..."
                value={form.bio}
                onChange={onChange}
                rows={4}
              />
            </div>
            {errors.bio && (
              <p className="mt-1 flex items-center gap-1 text-sm text-red-500">
                <svg className="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4m0 4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
                </svg>
                {errors.bio}
              </p>
            )}
            <p className="mt-1 text-xs text-gray-500">{form.bio.length}/255 characters</p>
          </div>
        </div>

        {/* Submit Button */}
        <button
          type="submit"
          disabled={submitting}
          className="mt-8 flex w-full items-center justify-center gap-2 rounded-lg bg-black px-4 py-3 text-sm font-semibold text-white shadow-lg transition-all hover:bg-gray-900 hover:shadow-xl disabled:cursor-not-allowed disabled:opacity-60"
        >
          {submitting ? (
            <>
              <svg className="h-5 w-5 animate-spin" fill="none" viewBox="0 0 24 24">
                <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
              </svg>
              Saving changes...
            </>
          ) : (
            <>
              <svg className="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
              </svg>
              Save Changes
            </>
          )}
        </button>

        {/* Account Info */}
        <div className="mt-6 border-t border-gray-200 pt-4">
          <p className="text-center text-xs text-gray-500">
            Account created: {user?.created_at ? new Date(user.created_at).toLocaleDateString() : "N/A"}
          </p>
          <p className="text-center text-xs text-gray-500">
            Last seen: {user?.last_seen ? new Date(user.last_seen).toLocaleString() : "N/A"}
          </p>
        </div>
      </form>
    </div>
  );
}
