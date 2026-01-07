"use client"

import { useState } from "react"
import { useRouter } from "next/navigation"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Card, CardContent, CardDescription, CardHeader, CardTitle, CardFooter } from "@/components/ui/card"
import Link from "next/link"

import { signIn } from "next-auth/react"
import { useSearchParams } from "next/navigation"

export function LoginForm() {
  const router = useRouter()
  const searchParams = useSearchParams()
  const callbackUrl = searchParams.get("callbackUrl") || "/groups"
  
  const [isLoading, setIsLoading] = useState(false)
  const [error, setError] = useState("")

  async function onSubmit(event: React.FormEvent<HTMLFormElement>) {
    event.preventDefault()
    setIsLoading(true)
    setError("")

    const formData = new FormData(event.currentTarget)
    const email = formData.get("email") as string
    const password = formData.get("password") as string

    try {
      const result = await signIn("credentials", {
        redirect: false,
        email,
        password,
        callbackUrl,
      })

      if (result?.error) {
        console.error("Login result error:", result.error)
        setError("Invalid email or password")
        setIsLoading(false)
      } else if (result?.ok) {
        // Use window.location for a full reload to ensure session is active
        window.location.href = callbackUrl
      } else {
        setError("Login failed. Please try again.")
        setIsLoading(false)
      }
    } catch (error) {
      console.error("Login catch error:", error)
      setError("Something went wrong")
      setIsLoading(false)
    }
  }

  return (
    <Card className="w-[350px]">
      <CardHeader>
        <CardTitle>Login</CardTitle>
        <CardDescription>
          Enter your email below to login to your account.
        </CardDescription>
      </CardHeader>
      <form onSubmit={onSubmit}>
        <CardContent className="grid gap-4">
          <div className="grid gap-2">
            <label htmlFor="email">Email</label>
            <Input id="email" name="email" type="email" placeholder="m@example.com" disabled={isLoading} required />
          </div>
          <div className="grid gap-2">
            <label htmlFor="password">Password</label>
            <Input id="password" name="password" type="password" disabled={isLoading} required />
          </div>
          {error && <p className="text-sm text-red-500">{error}</p>}
        </CardContent>
        <CardFooter className="flex flex-col gap-2">
          <Button className="w-full" disabled={isLoading}>
            {isLoading ? "Signing in..." : "Sign In"}
          </Button>
          <p className="text-sm text-center text-muted-foreground">
             Don't have an account? <Link href="/register" className="underline">Register</Link>
          </p>
        </CardFooter>
      </form>
    </Card>
  )
}
