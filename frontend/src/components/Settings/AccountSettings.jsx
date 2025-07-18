import { useState, useEffect } from "react"
import PropTypes from 'prop-types'
import { Mail, Key, Trash2, AlertTriangle, Loader2 } from "lucide-react"
import ApiService from "../../services/ApiService"
import { toast } from "react-hot-toast"
import { useAuthContext } from '../../context/AuthContext'

const AccountSettings = ({ profileData, onProfileUpdate, onLogout }) => {
  const { updateUser } = useAuthContext()
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

  // Check if user is Google authenticated
  const isGoogleAuth = profileData?.isGoogleAuth || false

  useEffect(() => {
    if (profileData) {
      const newData = { email: profileData.email || "" }
      setFormData(newData)
      setOriginalData(newData)
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

  const updateEmail = async () => {
    if (!formData.email) {
      toast.error('Please enter an email address')
      return
    }

    setLoading(prev => ({ ...prev, email: true }))

    try {
      const response = await ApiService.put("/users/update/email", {
        email: formData.email
      })

      let updatedProfile

      // Handle different response formats
      if (response.data && typeof response.data === 'object') {
        if (response.data.user) {
          // If response has user object
          updatedProfile = response.data.user
        } else if (response.data.email !== undefined) {
          // If response has the email field directly
          updatedProfile = { ...profileData, ...response.data }
        } else {
          // If response doesn't contain expected data, merge with current profile
          updatedProfile = { ...profileData, email: formData.email }
        }
      } else {
        // Fallback: merge with current profile data
        updatedProfile = { ...profileData, email: formData.email }
      }

      // Update original data to reflect the successful change
      setOriginalData(prev => ({
        ...prev,
        email: updatedProfile.email || formData.email
      }))

      // Update form data to match the response
      setFormData(prev => ({
        ...prev,
        email: updatedProfile.email || formData.email
      }))

      // Update AuthContext
      const contextUpdateSuccess = updateUser(updatedProfile)

      if (contextUpdateSuccess) {
        toast.success('Email updated successfully')

        // Call the callback if provided (for backward compatibility)
        if (onProfileUpdate) {
          onProfileUpdate(updatedProfile)
        }
      } else {
        toast.error('Failed to update local data')
      }

    } catch (error) {
      console.error('Error updating email:', error)

      // Reset form data on error
      setFormData(prev => ({
        ...prev,
        email: originalData.email
      }))

      // Show error message
      const errorMessage = error.response?.data?.message ||
        error.response?.data?.error ||
        'Failed to update email'
      toast.error(errorMessage)
    } finally {
      setLoading(prev => ({ ...prev, email: false }))
    }
  }

  const handleSubmit = async (e) => {
    e.preventDefault()
    await updateEmail()
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

  const isEmailChanged = () => {
    return formData.email !== originalData.email
  }

  const isEmailValid = () => {
    return formData.email && formData.email.trim().length > 0
  }

  return (
    <div className="space-y-6 bg-gray-800/50 p-4 sm:p-6 rounded-xl">
      <h3 className="text-base sm:text-lg font-medium text-white">Account Settings</h3>
      <form onSubmit={handleSubmit} className="space-y-4">
        <div className="relative flex flex-col sm:flex-row items-stretch sm:items-center gap-2">
          <div className="flex-1 relative">
            <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
              <Mail className="h-5 w-5 text-gray-400" />
            </div>
            <input
              type="email"
              name="email"
              value={formData.email}
              onChange={handleChange}
              placeholder="Email Address"
              className="w-full pl-10 pr-3 py-2 bg-gray-800/50 rounded-lg border border-gray-700 focus:border-blue-500 focus:ring focus:ring-blue-500 focus:ring-opacity-20 text-white text-sm"
              disabled={loading.email}
            />
          </div>
          <button
            type="submit"
            disabled={loading.email || formData.email === originalData.email}
            className="px-4 py-2 bg-blue-500 text-white rounded-lg hover:bg-blue-600 transition-colors font-medium disabled:bg-blue-500/50 disabled:cursor-not-allowed min-w-[100px] text-sm"
          >
            {loading.email ? (
              <>
                <Loader2 className="inline mr-2 h-4 w-4 animate-spin" />
                Updating...
              </>
            ) : (
              'Update'
            )}
          </button>
        </div>
      </form>

      {/* Password Change Section - Hidden for Google Auth users */}
      {!isGoogleAuth && (
        <div className="space-y-2 bg-gray-800/50 p-2 sm:p-6 rounded-xl">
          <h3 className="text-base sm:text-lg font-medium text-white">Security</h3>
          {!showPasswordForm ? (
            <button
              onClick={() => setShowPasswordForm(true)}
              className="w-full flex items-center justify-between p-2 bg-gray-800 rounded-lg hover:bg-gray-700 transition-colors text-sm"
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
                  type="password"
                  name="currentPassword"
                  value={passwordData.currentPassword}
                  onChange={handlePasswordChange}
                  placeholder="Current Password"
                  className="w-full px-3 py-2 bg-gray-800/50 rounded-lg border border-gray-700 focus:border-blue-500 focus:ring focus:ring-blue-500 focus:ring-opacity-20 text-white text-sm"
                />
                <input
                  type="password"
                  name="newPassword"
                  value={passwordData.newPassword}
                  onChange={handlePasswordChange}
                  placeholder="New Password"
                  className="w-full px-3 py-2 bg-gray-800/50 rounded-lg border border-gray-700 focus:border-blue-500 focus:ring focus:ring-blue-500 focus:ring-opacity-20 text-white text-sm"
                />
                <input
                  type="password"
                  name="confirmPassword"
                  value={passwordData.confirmPassword}
                  onChange={handlePasswordChange}
                  placeholder="Confirm New Password"
                  className="w-full px-3 py-2 bg-gray-800/50 rounded-lg border border-gray-700 focus:border-blue-500 focus:ring focus:ring-blue-500 focus:ring-opacity-20 text-white text-sm"
                />
              </div>
              <div className="flex gap-2">
                <button
                  type="submit"
                  disabled={loading.password}
                  className="flex-1 px-4 py-2 bg-blue-500 text-white rounded-lg hover:bg-blue-600 transition-colors disabled:bg-blue-500/50 disabled:cursor-not-allowed text-sm"
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
                  className="flex-1 px-4 py-2 bg-gray-700 text-white rounded-lg hover:bg-gray-600 transition-colors text-sm"
                >
                  Cancel
                </button>
              </div>
            </form>
          )}
        </div>
      )}

      {/* Delete Account Section */}
      <div className="space-y-2 bg-gray-800/50 p-2 sm:p-6 rounded-xl">
        <h3 className="text-base sm:text-lg font-medium text-white">Danger Zone</h3>
        <button
          onClick={() => setShowDeleteConfirm(true)}
          className="w-full flex items-center justify-between p-2 bg-red-500/10 text-red-500 rounded-lg hover:bg-red-500/20 transition-colors text-sm"
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
          <div className="w-full max-w-xs sm:max-w-md bg-gray-900 rounded-xl p-4 sm:p-6 shadow-2xl mx-2">
            <div className="space-y-4">
              <div className="flex items-center gap-3 text-red-500">
                <AlertTriangle size={20} className="sm:w-6 sm:h-6 w-5 h-5" />
                <h3 className="text-lg sm:text-xl font-semibold">Delete Account</h3>
              </div>
              <p className="text-gray-300 leading-relaxed text-sm">
                Are you absolutely sure you want to delete your account? This action cannot be undone and will
                permanently delete:
              </p>
              <ul className="space-y-2 text-gray-400 text-sm">
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
                className="w-full px-3 py-2 mb-3 bg-gray-800/50 rounded-lg border border-gray-700 focus:border-blue-500 focus:ring focus:ring-blue-500 focus:ring-opacity-20 text-white text-sm"
              />
              <div className="flex flex-col sm:flex-row gap-2 pt-2">
                <button
                  onClick={handleDeleteAccount}
                  disabled={loading.delete}
                  className="flex-1 px-4 py-2 bg-red-500 hover:bg-red-600 text-white rounded-lg transition-colors disabled:bg-red-500/50 disabled:cursor-not-allowed text-sm"
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
                  className="flex-1 px-4 py-2 bg-gray-700 hover:bg-gray-600 text-white rounded-lg transition-colors text-sm"
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

AccountSettings.propTypes = {
  profileData: PropTypes.shape({
    email: PropTypes.string,
    isGoogleAuth: PropTypes.bool,
  }),
  onProfileUpdate: PropTypes.func,
  onLogout: PropTypes.func,
}

export default AccountSettings