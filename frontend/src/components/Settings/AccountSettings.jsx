import React, { useState, useEffect } from "react"
import { Mail, Key, Trash2, AlertTriangle, Loader2 } from "lucide-react"
import ApiService from "../../services/ApiService"
import { toast } from "react-hot-toast"

const AccountSettings = ({ profileData, onProfileUpdate, onLogout }) => {
  const [formData, setFormData] = useState({
    email: profileData?.email || "",
  })
  const [originalData, setOriginalData] = useState({
    email: profileData?.email || "",
  })
  const [showPasswordForm, setShowPasswordForm] = useState(false)
  const [showDeleteConfirm, setShowDeleteConfirm] = useState(false)
  const [passwordData, setPasswordData] = useState({
    currentPassword: "",
    newPassword: "",
    confirmPassword: "",
  })
  const [deleteConfirmPassword, setDeleteConfirmPassword] = useState("")
  const [loading, setLoading] = useState({
    email: false,
    password: false,
    delete: false
  })

  useEffect(() => {
    if (profileData) {
      setFormData({ email: profileData.email || "" })
      setOriginalData({ email: profileData.email || "" })
    }
  }, [profileData])

  const handleChange = (e) => {
    const { name, value } = e.target
    setFormData((prev) => ({
      ...prev,
      [name]: value,
    }))
  }

  const handlePasswordChange = (e) => {
    const { name, value } = e.target
    setPasswordData((prev) => ({
      ...prev,
      [name]: value,
    }))
  }

  const handleSubmit = async (e) => {
    e.preventDefault()
    setLoading(prev => ({ ...prev, email: true }))
    try {
      const responses = await Promise.all([ApiService.put("/users/update/email", { email: formData.email })])

      toast.success("Account information updated successfully")
      if (onProfileUpdate) {
        onProfileUpdate({
          ...profileData,
          email: formData.email,
        })
      }
    } catch (error) {
      toast.error(error.response?.data?.message || "Failed to update account information")
    } finally {
      setLoading(prev => ({ ...prev, email: false }))
    }
  }

  const handlePasswordSubmit = async (e) => {
    e.preventDefault()
    if (passwordData.newPassword !== passwordData.confirmPassword) {
      toast.error("New passwords do not match")
      return
    }

    setLoading(prev => ({ ...prev, password: true }))
    try {
      await ApiService.put("/users/update/password", {
        currentPassword: passwordData.currentPassword,
        newPassword: passwordData.newPassword,
      })
      toast.success("Password updated successfully")
      setShowPasswordForm(false)
      setPasswordData({
        currentPassword: "",
        newPassword: "",
        confirmPassword: "",
      })
    } catch (error) {
      toast.error(error.response?.data?.message || "Failed to update password")
    } finally {
      setLoading(prev => ({ ...prev, password: false }))
    }
  }

  const handleDeleteAccount = async () => {
    if (!deleteConfirmPassword) {
      toast.error("Please enter your password to confirm account deletion")
      return
    }
    setLoading(prev => ({ ...prev, delete: true }))
    try {
      await ApiService.delete("/users/profile", {
        password: deleteConfirmPassword,
      })
      toast.success("Account deleted successfully")
      if (onLogout) {
        onLogout()
      }
    } catch (error) {
      if (error.response?.status === 401) {
        toast.error("Incorrect password. Please try again.")
      } else {
        toast.error(error.response?.data?.message || "Failed to delete account")
      }
    } finally {
      setLoading(prev => ({ ...prev, delete: false }))
    }
  }

  return (
    <div className="space-y-6">
      <div className="space-y-6 bg-gray-800/50 p-6 rounded-xl">
        <h3 className="text-lg font-medium text-white">Account Information</h3>
        <form onSubmit={handleSubmit} className="space-y-4">
          <div className="space-y-4">
            {/* Email Input */}
            <div className="relative">
              <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                <Mail className="h-5 w-5 text-gray-400" />
              </div>
              <input
                type="email"
                name="email"
                value={formData.email}
                onChange={handleChange}
                placeholder="Email Address"
                className="w-full pl-10 pr-3 py-2 bg-gray-800/50 rounded-lg border border-gray-700 focus:border-blue-500 focus:ring focus:ring-blue-500 focus:ring-opacity-20 text-white"
              />
            </div>
          </div>
          <button
            type="submit"
            disabled={loading.email || formData.email === originalData.email}
            className="w-full px-4 py-2 bg-blue-500 text-white rounded-lg hover:bg-blue-600 transition-colors font-medium disabled:bg-blue-500/50 disabled:cursor-not-allowed"
          >
            {loading.email ? (
              <>
                <Loader2 className="inline mr-2 h-4 w-4 animate-spin" />
                Updating...
              </>
            ) : (
              'Update Account Info'
            )}
          </button>
        </form>
      </div>

      {/* Password Change Section */}
      <div className="space-y-6 bg-gray-800/50 p-6 rounded-xl">
        <h3 className="text-lg font-medium text-white">Security</h3>
        {!showPasswordForm ? (
          <button
            onClick={() => setShowPasswordForm(true)}
            className="w-full flex items-center justify-between p-3 bg-gray-800 rounded-lg hover:bg-gray-700 transition-colors"
          >
            <div className="flex items-center gap-2 text-gray-300">
              <Key size={18} />
              <span>Change Password</span>
            </div>
          </button>
        ) : (
          <form onSubmit={handlePasswordSubmit} className="space-y-4">
            <div className="space-y-4">
              <input
                type="text"
                name="currentPassword"
                value={passwordData.currentPassword}
                onChange={handlePasswordChange}
                placeholder="Current Password"
                className="w-full px-3 py-2 bg-gray-800/50 rounded-lg border border-gray-700 focus:border-blue-500 focus:ring focus:ring-blue-500 focus:ring-opacity-20 text-white"
              />
              <input
                type="text"
                name="newPassword"
                value={passwordData.newPassword}
                onChange={handlePasswordChange}
                placeholder="New Password"
                className="w-full px-3 py-2 bg-gray-800/50 rounded-lg border border-gray-700 focus:border-blue-500 focus:ring focus:ring-blue-500 focus:ring-opacity-20 text-white"
              />
              <input
                type="text"
                name="confirmPassword"
                value={passwordData.confirmPassword}
                onChange={handlePasswordChange}
                placeholder="Confirm New Password"
                className="w-full px-3 py-2 bg-gray-800/50 rounded-lg border border-gray-700 focus:border-blue-500 focus:ring focus:ring-blue-500 focus:ring-opacity-20 text-white"
              />
            </div>
            <div className="flex gap-2">
              <button
                type="submit"
                disabled={loading.password}
                className="flex-1 px-4 py-2 bg-blue-500 text-white rounded-lg hover:bg-blue-600 transition-colors disabled:bg-blue-500/50 disabled:cursor-not-allowed"
              >
                {loading.password ? (
                  <>
                    <Loader2 className="inline mr-2 h-4 w-4 animate-spin" />
                    Updating...
                  </>
                ) : (
                  'Update Password'
                )}
              </button>
              <button
                type="button"
                onClick={() => setShowPasswordForm(false)}
                className="flex-1 px-4 py-2 bg-gray-700 text-white rounded-lg hover:bg-gray-600 transition-colors"
              >
                Cancel
              </button>
            </div>
          </form>
        )}
      </div>

      {/* Delete Account Section */}
      <div className="space-y-6 bg-gray-800/50 p-6 rounded-xl">
        <h3 className="text-lg font-medium text-white">Danger Zone</h3>
        <button
          onClick={() => setShowDeleteConfirm(true)}
          className="w-full flex items-center justify-between p-3 bg-red-500/10 text-red-500 rounded-lg hover:bg-red-500/20 transition-colors"
        >
          <div className="flex items-center gap-2">
            <Trash2 size={18} />
            <span>Delete Account</span>
          </div>
        </button>
      </div>

      {/* Delete Confirmation Dialog */}
      {showDeleteConfirm && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/70">
          <div className="w-full max-w-md bg-gray-900 rounded-xl p-6 shadow-2xl">
            <div className="space-y-4">
              <div className="flex items-center gap-3 text-red-500">
                <AlertTriangle size={24} />
                <h3 className="text-xl font-semibold">Delete Account</h3>
              </div>
              <p className="text-gray-300 leading-relaxed">
                Are you absolutely sure you want to delete your account? This action cannot be undone and will
                permanently delete:
              </p>
              <ul className="space-y-2 text-gray-400">
                <li className="flex items-center gap-2">
                  <div className="w-1.5 h-1.5 bg-red-500 rounded-full" />
                  Your profile and personal information
                </li>
                <li className="flex items-center gap-2">
                  <div className="w-1.5 h-1.5 bg-red-500 rounded-full" />
                  All your saved preferences and settings
                </li>
                <li className="flex items-center gap-2">
                  <div className="w-1.5 h-1.5 bg-red-500 rounded-full" />
                  Your entire activity history
                </li>
              </ul>
              <input
                type="password"
                value={deleteConfirmPassword}
                onChange={(e) => setDeleteConfirmPassword(e.target.value)}
                placeholder="Enter your password to confirm"
                className="w-full px-3 py-2 mb-3 bg-gray-800/50 rounded-lg border border-gray-700 focus:border-blue-500 focus:ring focus:ring-blue-500 focus:ring-opacity-20 text-white"
              />
              <div className="flex gap-3 pt-4">
                <button
                  onClick={handleDeleteAccount}
                  disabled={loading.delete}
                  className="flex-1 px-4 py-2 bg-red-500 hover:bg-red-600 text-white rounded-lg transition-colors disabled:bg-red-500/50 disabled:cursor-not-allowed"
                >
                  {loading.delete ? (
                    <>
                      <Loader2 className="inline mr-2 h-4 w-4 animate-spin" />
                      Deleting...
                    </>
                  ) : (
                    'Yes, Delete My Account'
                  )}
                </button>
                <button
                  onClick={() => {
                    setShowDeleteConfirm(false)
                    setDeleteConfirmPassword("")
                  }}
                  className="flex-1 px-4 py-2 bg-gray-700 hover:bg-gray-600 text-white rounded-lg transition-colors"
                >
                  Cancel
                </button>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  )
}

export default AccountSettings

