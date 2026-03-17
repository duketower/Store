import { useState, useEffect } from 'react'
import { useNavigate } from 'react-router-dom'
import { Delete, ShoppingCart, Fingerprint } from 'lucide-react'
import { useAuthStore } from '@/stores/authStore'
import { verifyPin, createSession, getActiveEmployees, saveBiometricCredential } from './authService'
import type { Employee } from '@/types'
import { ROLE_COLORS, ROLE_LABELS } from '@/constants/roles'
import { cn } from '@/utils/cn'
import { ROUTES } from '@/constants/routes'
import { PIN_LENGTH, MAX_PIN_ATTEMPTS, PIN_LOCKOUT_SECONDS } from '@/constants/app'
import { CLIENT_CONFIG } from '@/constants/clientConfig'
import { ErrorBanner } from '@/components/feedback/ErrorBanner'
import { isBiometricAvailable, registerBiometric, authenticateBiometric } from '@/services/biometric/biometric'

type Screen = 'staff' | 'pin'

export function LoginScreen() {
  const navigate = useNavigate()
  const setSession = useAuthStore((s) => s.setSession)
  const isAuthenticated = useAuthStore((s) => s.isAuthenticated)

  const [screen, setScreen] = useState<Screen>('staff')
  const [employees, setEmployees] = useState<Employee[]>([])
  const [selectedEmployee, setSelectedEmployee] = useState<Employee | null>(null)
  const [pin, setPin] = useState('')
  const [error, setError] = useState('')
  const [loading, setLoading] = useState(false)
  const [attempts, setAttempts] = useState(0)
  const [lockoutUntil, setLockoutUntil] = useState<Date | null>(null)

  const [bioAvailable, setBioAvailable] = useState(false)
  const [showBioPrompt, setShowBioPrompt] = useState(false)
  const [pendingEmployee, setPendingEmployee] = useState<Employee | null>(null)

  // Redirect if already logged in
  useEffect(() => {
    if (isAuthenticated()) navigate(ROUTES.BILLING, { replace: true })
  }, [isAuthenticated, navigate])

  useEffect(() => {
    getActiveEmployees().then(setEmployees)
    isBiometricAvailable().then(setBioAvailable)
  }, [])

  const isLockedOut = lockoutUntil && new Date() < lockoutUntil

  // Keyboard support for PIN screen
  useEffect(() => {
    if (screen !== 'pin') return
    const handler = (e: KeyboardEvent) => {
      if (e.key >= '0' && e.key <= '9') {
        if (!isLockedOut && !loading && pin.length < PIN_LENGTH) {
          setPin((prev) => prev + e.key)
        }
      } else if (e.key === 'Backspace') {
        setPin((prev) => prev.slice(0, -1))
      } else if (e.key === 'Enter') {
        if (!isLockedOut && !loading && pin.length === PIN_LENGTH) {
          document.getElementById('pin-confirm-btn')?.click()
        }
      }
    }
    window.addEventListener('keydown', handler)
    return () => window.removeEventListener('keydown', handler)
  }, [screen, pin, loading, isLockedOut])

  const handleCardSelect = (employee: Employee) => {
    setSelectedEmployee(employee)
    setPin('')
    setError('')
    setAttempts(0)
    setLockoutUntil(null)
    setScreen('pin')
  }

  const handleBiometricLogin = async (employee: Employee, e: React.MouseEvent) => {
    e.stopPropagation()
    if (!employee.credentialId) return
    setLoading(true)
    try {
      const ok = await authenticateBiometric(employee.credentialId)
      if (ok) {
        const session = createSession(employee)
        setSession(session)
        navigate(ROUTES.BILLING, { replace: true })
      } else {
        // Fall through to PIN
        setSelectedEmployee(employee)
        setPin('')
        setError('Biometric failed — enter PIN instead.')
        setAttempts(0)
        setLockoutUntil(null)
        setScreen('pin')
      }
    } catch {
      setSelectedEmployee(employee)
      setPin('')
      setError('Biometric failed — enter PIN instead.')
      setAttempts(0)
      setLockoutUntil(null)
      setScreen('pin')
    } finally {
      setLoading(false)
    }
  }

  const handlePinDigit = (digit: string) => {
    if (isLockedOut) return
    if (pin.length < PIN_LENGTH) {
      setPin((prev) => prev + digit)
    }
  }

  const handlePinBackspace = () => {
    setPin((prev) => prev.slice(0, -1))
  }

  const handlePinConfirm = async () => {
    if (!selectedEmployee?.id || pin.length < PIN_LENGTH) return
    if (isLockedOut) return

    setLoading(true)
    setError('')

    try {
      const employee = await verifyPin(selectedEmployee.id, pin)
      if (employee) {
        // Prompt to register biometric for admin/manager who don't have it yet
        if (
          bioAvailable &&
          (employee.role === 'admin' || employee.role === 'manager') &&
          !employee.credentialId
        ) {
          setPendingEmployee(employee)
          setShowBioPrompt(true)
        } else {
          const session = createSession(employee)
          setSession(session)
          navigate(ROUTES.BILLING, { replace: true })
        }
      } else {
        const newAttempts = attempts + 1
        setAttempts(newAttempts)
        setPin('')

        if (newAttempts >= MAX_PIN_ATTEMPTS) {
          const lockUntil = new Date(Date.now() + PIN_LOCKOUT_SECONDS * 1000)
          setLockoutUntil(lockUntil)
          setError(`Too many attempts. Locked for ${PIN_LOCKOUT_SECONDS} seconds.`)
        } else {
          setError(`Wrong PIN. ${MAX_PIN_ATTEMPTS - newAttempts} attempt${MAX_PIN_ATTEMPTS - newAttempts === 1 ? '' : 's'} remaining.`)
        }
      }
    } finally {
      setLoading(false)
    }
  }

  const handleBioRegister = async () => {
    if (!pendingEmployee?.id) return
    setLoading(true)
    try {
      const credentialId = await registerBiometric(pendingEmployee.id, pendingEmployee.name)
      await saveBiometricCredential(pendingEmployee.id, credentialId)
      setEmployees((prev) =>
        prev.map((e) => (e.id === pendingEmployee.id ? { ...e, credentialId } : e))
      )
    } catch {
      // Registration cancelled or failed — proceed without biometric
    } finally {
      setLoading(false)
      setShowBioPrompt(false)
      const session = createSession(pendingEmployee)
      setSession(session)
      navigate(ROUTES.BILLING, { replace: true })
    }
  }

  const handleBioSkip = () => {
    setShowBioPrompt(false)
    if (pendingEmployee) {
      const session = createSession(pendingEmployee)
      setSession(session)
      navigate(ROUTES.BILLING, { replace: true })
    }
  }

  return (
    <div className="flex h-screen items-center justify-center bg-gradient-to-br from-blue-50 to-indigo-100">
      <div className="w-full max-w-4xl px-4">
        {/* App title */}
        <div className="mb-8 text-center">
          <div className="mb-2 flex justify-center">
            <div className="rounded-2xl bg-brand-600 p-3">
              <ShoppingCart className="text-white" size={32} />
            </div>
          </div>
          <h1 className="text-2xl font-bold text-gray-900">{CLIENT_CONFIG.brand.appName}</h1>
        </div>

        {/* Staff selection */}
        {screen === 'staff' && (
          <div className="card p-6">
            <h2 className="mb-4 text-center text-base font-semibold text-gray-700">Who's logging in?</h2>
            <div className="grid grid-cols-2 gap-3 sm:grid-cols-3 md:grid-cols-4">
              {employees.map((emp) => (
                <button
                  key={emp.id}
                  onClick={() => handleCardSelect(emp)}
                  className="relative flex flex-col items-center rounded-xl border-2 border-gray-200 bg-white p-4 text-center transition-all hover:border-brand-500 hover:bg-brand-50 hover:shadow-sm focus:outline-none focus:ring-2 focus:ring-brand-500"
                >
                  {/* Biometric button for admin/manager with registered credential */}
                  {bioAvailable &&
                    (emp.role === 'admin' || emp.role === 'manager') &&
                    emp.credentialId && (
                      <button
                        onClick={(e) => handleBiometricLogin(emp, e)}
                        disabled={loading}
                        title="Login with fingerprint"
                        className="absolute top-2 right-2 rounded-full p-1 text-brand-500 hover:bg-brand-50 focus:outline-none disabled:opacity-50"
                      >
                        <Fingerprint size={16} />
                      </button>
                    )}
                  <div className={cn(
                    'mb-2 flex h-12 w-12 items-center justify-center rounded-full text-xl font-bold',
                    emp.role === 'admin' ? 'bg-purple-100 text-purple-700' :
                    emp.role === 'manager' ? 'bg-brand-100 text-brand-700' :
                    'bg-green-100 text-green-700'
                  )}>
                    {emp.name.charAt(0).toUpperCase()}
                  </div>
                  <span className="text-sm font-medium text-gray-900">{emp.name}</span>
                  <span className={cn('mt-1 rounded px-1.5 py-0.5 text-xs font-medium', ROLE_COLORS[emp.role])}>
                    {ROLE_LABELS[emp.role]}
                  </span>
                </button>
              ))}
            </div>
          </div>
        )}

        {/* PIN pad */}
        {screen === 'pin' && selectedEmployee && (
          <div className="mx-auto max-w-xs card p-6">
            {showBioPrompt ? (
              /* Biometric registration prompt — shown after first successful PIN login */
              <div className="text-center">
                <div className="mx-auto mb-4 flex h-16 w-16 items-center justify-center rounded-full bg-brand-50">
                  <Fingerprint size={32} className="text-brand-600" />
                </div>
                <p className="text-base font-semibold text-gray-900 mb-1">Enable Fingerprint Login?</p>
                <p className="text-sm text-gray-500 mb-6">
                  Log in faster next time using your fingerprint or Face ID — no PIN needed.
                </p>
                <button
                  onClick={handleBioRegister}
                  disabled={loading}
                  className="btn-primary w-full mb-2"
                >
                  {loading ? 'Setting up…' : 'Enable Fingerprint'}
                </button>
                <button
                  onClick={handleBioSkip}
                  disabled={loading}
                  className="w-full text-sm text-gray-500 hover:text-gray-700 py-2"
                >
                  Skip for now
                </button>
              </div>
            ) : (
              <>
                <div className="mb-6 text-center">
                  <div className={cn(
                    'mx-auto mb-2 flex h-14 w-14 items-center justify-center rounded-full text-2xl font-bold',
                    selectedEmployee.role === 'admin' ? 'bg-purple-100 text-purple-700' :
                    selectedEmployee.role === 'manager' ? 'bg-brand-100 text-brand-700' :
                    'bg-green-100 text-green-700'
                  )}>
                    {selectedEmployee.name.charAt(0)}
                  </div>
                  <p className="text-base font-semibold text-gray-900">{selectedEmployee.name}</p>
                  <span className={cn('mt-1 rounded px-1.5 py-0.5 text-xs font-medium', ROLE_COLORS[selectedEmployee.role])}>
                    {ROLE_LABELS[selectedEmployee.role]}
                  </span>
                  <p className="text-sm text-gray-500 mt-2">Enter your 4-digit PIN</p>
                </div>

                {/* PIN dots */}
                <div className="mb-6 flex justify-center gap-3">
                  {Array.from({ length: PIN_LENGTH }).map((_, i) => (
                    <div
                      key={i}
                      className={cn(
                        'h-4 w-4 rounded-full border-2 transition-all',
                        i < pin.length
                          ? 'border-brand-600 bg-brand-600'
                          : 'border-gray-300 bg-transparent'
                      )}
                    />
                  ))}
                </div>

                {error && <div className="mb-4"><ErrorBanner message={error} /></div>}

                {/* Number pad */}
                <div className="grid grid-cols-3 gap-2">
                  {['1','2','3','4','5','6','7','8','9'].map((d) => (
                    <button
                      key={d}
                      onClick={() => handlePinDigit(d)}
                      disabled={!!isLockedOut || loading}
                      className="rounded-xl border border-gray-200 bg-white py-4 text-lg font-semibold text-gray-800 shadow-sm transition-all hover:bg-brand-50 hover:border-brand-200 active:scale-95 disabled:opacity-50"
                    >
                      {d}
                    </button>
                  ))}
                  <button
                    onClick={handlePinBackspace}
                    disabled={!!isLockedOut || loading}
                    className="rounded-xl border border-gray-200 bg-white py-4 text-gray-500 shadow-sm transition-all hover:bg-gray-50 active:scale-95 disabled:opacity-50 flex items-center justify-center"
                  >
                    <Delete size={18} />
                  </button>
                  <button
                    onClick={() => handlePinDigit('0')}
                    disabled={!!isLockedOut || loading}
                    className="rounded-xl border border-gray-200 bg-white py-4 text-lg font-semibold text-gray-800 shadow-sm transition-all hover:bg-brand-50 hover:border-brand-200 active:scale-95 disabled:opacity-50"
                  >
                    0
                  </button>
                  <button
                    id="pin-confirm-btn"
                    onClick={handlePinConfirm}
                    disabled={pin.length < PIN_LENGTH || !!isLockedOut || loading}
                    className="rounded-xl bg-brand-600 py-4 text-sm font-bold text-white shadow-sm transition-all hover:bg-brand-700 active:scale-95 disabled:opacity-40"
                  >
                    {loading ? '...' : 'OK'}
                  </button>
                </div>

                <button
                  onClick={() => { setScreen('staff'); setPin(''); setError('') }}
                  className="mt-4 w-full text-center text-sm text-gray-500 hover:text-gray-700"
                >
                  ← Back
                </button>
              </>
            )}
          </div>
        )}
      </div>
    </div>
  )
}
