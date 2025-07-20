import { createClient } from '@supabase/supabase-js'

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL
const supabaseAnonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY

// Only log and throw in development to avoid build issues
if (process.env.NODE_ENV === 'development') {
  console.log('Supabase config check:', {
    url: supabaseUrl ? `${supabaseUrl.substring(0, 30)}...` : 'MISSING',
    key: supabaseAnonKey ? `${supabaseAnonKey.substring(0, 10)}...` : 'MISSING'
  })
}

// Provide fallback values for build time
const url = supabaseUrl || 'https://placeholder.supabase.co'
const key = supabaseAnonKey || 'placeholder-key'

export const supabase = createClient(url, key)

// Types for our auth
export interface AuthUser {
  id: string
  email: string
  user_type: 'jobseeker' | 'employer'
}

export interface SignupData {
  email: string
  password: string
  user_type: 'jobseeker' | 'employer'
}

export interface LoginData {
  email: string
  password: string
} 