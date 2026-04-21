const API_BASE = 'http://localhost:8000/api/v1'

export async function sendOtp(email) {
  const response = await fetch(`${API_BASE}/auth/send-otp`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ email })
  })
  if (!response.ok) throw new Error('Failed to send OTP')
  return response.json()
}

export async function verifyOtp(email, otp) {
  const response = await fetch(`${API_BASE}/auth/verify-otp`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ email, otp })
  })
  if (!response.ok) throw new Error('Invalid or expired OTP')
  return response.json()
}

export async function registerUser(userData) {
  const response = await fetch(`${API_BASE}/auth/register`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(userData)
  })
  if (!response.ok) throw new Error('Registration failed')
  return response.json()
}

export async function loginUser(email, password) {
  const response = await fetch(`${API_BASE}/auth/login`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ email, password })
  })
  if (!response.ok) {
    const errorText = await response.text()
    console.error('Login response:', response.status, errorText)
    throw new Error(`Login failed: ${response.status}`)
  }
  return response.json()
}

export function googleLogin() {
  window.location.href = `${API_BASE}/auth/google`;
}

export function facebookLogin() {
  window.location.href = `${API_BASE}/auth/facebook`;
}

