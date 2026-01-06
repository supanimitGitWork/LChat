"use client"

import { useState } from "react"
import { useRouter } from "next/navigation"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Card, CardContent, CardDescription, CardHeader, CardTitle, CardFooter } from "@/components/ui/card"
import Link from "next/link"

export function RegisterForm() {
    const router = useRouter()
    const [isLoading, setIsLoading] = useState(false)
  
    const [error, setError] = useState("")

  async function onSubmit(event: React.FormEvent<HTMLFormElement>) {
    event.preventDefault()
    setIsLoading(true)
    setError("")

    const formData = new FormData(event.currentTarget)
    const name = formData.get("name") as string
    const email = formData.get("email") as string
    const password = formData.get("password") as string

    try {
      const res = await fetch("/api/register", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ name, email, password }),
      })

      if (res.ok) {
        router.push("/login")
      } else {
        const data = await res.json()
        setError(data.error || "Registration failed")
        setIsLoading(false)
      }
    } catch (error) {
      setError("Something went wrong")
      setIsLoading(false)
    }
  }
  
    return (
      <Card className="w-[350px]">
        <CardHeader>
          <CardTitle>Register</CardTitle>
          <CardDescription>
            Create an account to start chatting.
          </CardDescription>
        </CardHeader>
        <form onSubmit={onSubmit}>
          <CardContent className="grid gap-4">
          <div className="grid gap-2">
            <label htmlFor="name">Name</label>
            <Input id="name" name="name" type="text" placeholder="John Doe" disabled={isLoading} required />
          </div>
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
              {isLoading ? "Creating account..." : "Create Account"}
            </Button>
            <p className="text-sm text-center text-muted-foreground">
               Already have an account? <Link href="/login" className="underline">Login</Link>
            </p>
          </CardFooter>
        </form>
      </Card>
    )
  }
