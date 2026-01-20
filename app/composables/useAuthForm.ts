import type { Provider } from '@supabase/supabase-js'

export function useAuthForm() {
  const supabase = useSupabaseClient()
  const loading = ref(false)
  const error = ref<string | null>(null)

  // Social login
  async function signInWithProvider(provider: Provider) {
    loading.value = true
    error.value = null

    try {
      const { error: authError } = await supabase.auth.signInWithOAuth({
        provider,
        options: {
          redirectTo: `${window.location.origin}/`,
        },
      })

      if (authError) throw authError
    } catch (err) {
      console.error(`${provider} login error:`, err)
      error.value = err instanceof Error ? err.message : `Failed to sign in with ${provider}`
    } finally {
      loading.value = false
    }
  }

  // Email/password login
  async function signInWithPassword(email: string, password: string) {
    loading.value = true
    error.value = null

    try {
      const { error: authError } = await supabase.auth.signInWithPassword({
        email,
        password,
      })

      if (authError) throw authError

      await navigateTo('/')
    } catch (err) {
      console.error('Login error:', err)
      error.value = err instanceof Error ? err.message : 'Failed to sign in'
    } finally {
      loading.value = false
    }
  }

  // Email/password signup
  async function signUpWithPassword(email: string, password: string, confirmPassword: string) {
    loading.value = true
    error.value = null

    // Validation
    if (password !== confirmPassword) {
      error.value = 'Passwords do not match'
      loading.value = false
      return
    }

    if (password.length < 6) {
      error.value = 'Password must be at least 6 characters long'
      loading.value = false
      return
    }

    try {
      const { error: authError } = await supabase.auth.signUp({
        email,
        password,
        options: {
          emailRedirectTo: `${window.location.origin}/auth/confirm`,
        },
      })

      if (authError) throw authError

      await navigateTo('/auth/confirm?message=check-email')
    } catch (err) {
      console.error('Signup error:', err)
      error.value = err instanceof Error ? err.message : 'Failed to create account'
    } finally {
      loading.value = false
    }
  }

  // Password reset
  async function resetPassword(email: string) {
    loading.value = true
    error.value = null

    try {
      const { error: authError } = await supabase.auth.resetPasswordForEmail(email, {
        redirectTo: `${window.location.origin}/auth/confirm?type=recovery`,
      })

      if (authError) throw authError

      await navigateTo('/auth/confirm?message=password-reset-sent')
    } catch (err) {
      console.error('Password reset error:', err)
      error.value = err instanceof Error ? err.message : 'Failed to send password reset email'
    } finally {
      loading.value = false
    }
  }

  // Update password
  async function updatePassword(newPassword: string, confirmPassword: string) {
    loading.value = true
    error.value = null

    if (newPassword !== confirmPassword) {
      error.value = 'Passwords do not match'
      loading.value = false
      return
    }

    if (newPassword.length < 6) {
      error.value = 'Password must be at least 6 characters long'
      loading.value = false
      return
    }

    try {
      const { error: authError } = await supabase.auth.updateUser({
        password: newPassword,
      })

      if (authError) throw authError

      await navigateTo('/')
    } catch (err) {
      console.error('Password update error:', err)
      error.value = err instanceof Error ? err.message : 'Failed to update password'
    } finally {
      loading.value = false
    }
  }

  // Clear error
  function clearError() {
    error.value = null
  }

  return {
    loading: readonly(loading),
    error: readonly(error),
    signInWithProvider,
    signInWithPassword,
    signUpWithPassword,
    resetPassword,
    updatePassword,
    clearError,
  }
}