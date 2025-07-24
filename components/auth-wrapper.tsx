"use client"

import type React from "react"
import { useState } from "react"
import { useSupabaseData } from "@/hooks/useSupabaseData"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Loader2, AlertTriangle, Mail, UserPlus } from "lucide-react"
import { Alert, AlertDescription } from "@/components/ui/alert"

interface AuthWrapperProps {
  children: React.ReactNode
}

export function AuthWrapper({ children }: AuthWrapperProps) {
  const { user, loading, signInWithEmail, signUpWithEmail, error } = useSupabaseData()
  const [authMode, setAuthMode] = useState<"signin" | "signup">("signin")
  const [email, setEmail] = useState("")
  const [password, setPassword] = useState("")
  const [authLoading, setAuthLoading] = useState(false)
  const [authError, setAuthError] = useState<string | null>(null)

  const handleEmailAuth = async () => {
    if (!email || !password) {
      setAuthError("Por favor completa todos los campos")
      return
    }

    if (password.length < 6) {
      setAuthError("La contraseña debe tener al menos 6 caracteres")
      return
    }

    setAuthLoading(true)
    setAuthError(null)

    try {
      if (authMode === "signin") {
        await signInWithEmail(email, password)
      } else {
        await signUpWithEmail(email, password)
        setAuthError("¡Cuenta creada! Revisa tu email para confirmar tu cuenta antes de iniciar sesión.")
      }
    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : "Error de autenticación"

      // Traducir algunos errores comunes
      if (errorMessage.includes("Invalid login credentials")) {
        setAuthError("Email o contraseña incorrectos")
      } else if (errorMessage.includes("User already registered")) {
        setAuthError("Este email ya está registrado. Intenta iniciar sesión.")
      } else if (errorMessage.includes("Email not confirmed")) {
        setAuthError("Debes confirmar tu email antes de iniciar sesión. Revisa tu bandeja de entrada.")
      } else if (errorMessage.includes("Password should be at least 6 characters")) {
        setAuthError("La contraseña debe tener al menos 6 caracteres")
      } else {
        setAuthError(errorMessage)
      }
    } finally {
      setAuthLoading(false)
    }
  }

  const handleKeyPress = (e: React.KeyboardEvent) => {
    if (e.key === "Enter") {
      handleEmailAuth()
    }
  }

  if (loading) {
    return (
      <div className="min-h-screen bg-gray-50 p-4 flex items-center justify-center">
        <Card className="max-w-md">
          <CardContent className="flex items-center justify-center p-8">
            <Loader2 className="h-8 w-8 animate-spin" />
          </CardContent>
        </Card>
      </div>
    )
  }

  // Show configuration error if Supabase is not configured
  if (error && error.includes("configurado")) {
    return (
      <div className="min-h-screen bg-gray-50 p-4 flex items-center justify-center">
        <Card className="max-w-md">
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <AlertTriangle className="h-5 w-5 text-orange-500" />
              Configuración de Supabase Requerida
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <p className="text-gray-600">Para usar esta aplicación necesitas configurar Supabase.</p>
            <div className="space-y-2">
              <p className="text-sm font-medium">Pasos:</p>
              <ol className="text-sm text-gray-600 space-y-1 list-decimal list-inside">
                <li>
                  Ve a{" "}
                  <a
                    href="https://supabase.com/"
                    target="_blank"
                    rel="noopener noreferrer"
                    className="text-blue-600 hover:underline"
                  >
                    supabase.com
                  </a>
                </li>
                <li>Crea un nuevo proyecto</li>
                <li>Obtén tu URL y clave anónima del proyecto</li>
                <li>
                  Configura las variables de entorno:
                  <br />
                  <code className="bg-gray-100 px-1 rounded text-xs">NEXT_PUBLIC_SUPABASE_URL</code>
                  <br />
                  <code className="bg-gray-100 px-1 rounded text-xs">NEXT_PUBLIC_SUPABASE_ANON_KEY</code>
                </li>
                <li>Ejecuta el script SQL para crear las tablas</li>
              </ol>
            </div>
            <Alert>
              <AlertDescription>
                <strong>Error actual:</strong> {error}
              </AlertDescription>
            </Alert>
          </CardContent>
        </Card>
      </div>
    )
  }

  if (!user) {
    return (
      <div className="min-h-screen bg-gray-50 p-4 flex items-center justify-center">
        <Card className="max-w-md w-full">
          <CardHeader className="text-center">
            <CardTitle>Mi Portafolio de Acciones</CardTitle>
            <CardDescription>
              {authMode === "signin" ? "Inicia sesión" : "Crea una cuenta"} para gestionar tu portafolio de inversiones
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            {/* Email/Password Auth */}
            <div className="space-y-3">
              <div>
                <Label htmlFor="email">Email</Label>
                <Input
                  id="email"
                  type="email"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  onKeyPress={handleKeyPress}
                  placeholder="tu@email.com"
                  disabled={authLoading}
                />
              </div>
              <div>
                <Label htmlFor="password">Contraseña</Label>
                <Input
                  id="password"
                  type="password"
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  onKeyPress={handleKeyPress}
                  placeholder="••••••••"
                  disabled={authLoading}
                />
                {authMode === "signup" && <p className="text-xs text-gray-500 mt-1">Mínimo 6 caracteres</p>}
              </div>
              <Button onClick={handleEmailAuth} disabled={authLoading} className="w-full">
                {authLoading ? (
                  <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                ) : authMode === "signin" ? (
                  <Mail className="w-4 h-4 mr-2" />
                ) : (
                  <UserPlus className="w-4 h-4 mr-2" />
                )}
                {authMode === "signin" ? "Iniciar Sesión" : "Crear Cuenta"}
              </Button>
            </div>

            {/* Toggle between signin/signup */}
            <div className="text-center">
              <button
                type="button"
                onClick={() => {
                  setAuthMode(authMode === "signin" ? "signup" : "signin")
                  setAuthError(null)
                }}
                disabled={authLoading}
                className="text-sm text-blue-600 hover:underline disabled:opacity-50"
              >
                {authMode === "signin" ? "¿No tienes cuenta? Regístrate" : "¿Ya tienes cuenta? Inicia sesión"}
              </button>
            </div>

            {/* Error display */}
            {authError && (
              <Alert
                variant={
                  authError.includes("¡Cuenta creada!") || authError.includes("Revisa tu email")
                    ? "default"
                    : "destructive"
                }
              >
                <AlertDescription>{authError}</AlertDescription>
              </Alert>
            )}

            <div className="text-center">
              <p className="text-xs text-gray-500">Tus datos se guardarán de forma segura en Supabase</p>
              {authMode === "signup" && (
                <p className="text-xs text-gray-400 mt-1">Al registrarte, recibirás un email de confirmación</p>
              )}
            </div>
          </CardContent>
        </Card>
      </div>
    )
  }

  return <>{children}</>
}
