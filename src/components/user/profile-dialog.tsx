"use client"

import { useState, useEffect, useRef } from "react"
import { useSession } from "next-auth/react"
import { useRouter } from "next/navigation"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { X, Loader2, Camera, User } from "lucide-react"

interface ProfileDialogProps {
    isOpen: boolean
    onClose: () => void
}

export function ProfileDialog({ isOpen, onClose }: ProfileDialogProps) {
    const { data: session, update } = useSession()
    const [name, setName] = useState("")
    const [image, setImage] = useState<string | null>(null)
    const [isUploading, setIsUploading] = useState(false)
    const [isSaving, setIsSaving] = useState(false)
    const [error, setError] = useState("")
    const fileInputRef = useRef<HTMLInputElement>(null)
    const router = useRouter()

    useEffect(() => {
        if (session?.user) {
            setName(session.user.name || "")
            setImage(session.user.image || null)
        }
    }, [session, isOpen])

    const handleFileSelect = async (e: React.ChangeEvent<HTMLInputElement>) => {
        const file = e.target.files?.[0]
        if (!file) return

        setIsUploading(true)
        setError("")
        const formData = new FormData()
        formData.append("file", file)

        try {
            const res = await fetch("/api/upload", {
                method: "POST",
                body: formData,
            })
            if (res.ok) {
                const data = await res.json()
                setImage(data.url)
            } else {
                throw new Error("Upload failed")
            }
        } catch (err: any) {
            setError(err.message)
        } finally {
            setIsUploading(false)
            if (fileInputRef.current) fileInputRef.current.value = ""
        }
    }

    const handleSave = async (e: React.FormEvent) => {
        e.preventDefault()
        setIsSaving(true)
        setError("")

        try {
            const res = await fetch("/api/user/profile", {
                method: "PATCH",
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify({ name, image }),
            })

            if (!res.ok) {
                const data = await res.json()
                throw new Error(data.error || "Failed to update profile")
            }

            // Refresh session data
            await update({
                ...session,
                user: {
                    ...session?.user,
                    name: name,
                    image: image
                }
            })

            onClose()
            router.refresh()
        } catch (err: any) {
            setError(err.message)
        } finally {
            setIsSaving(false)
        }
    }

    if (!isOpen) return null

    return (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/80 backdrop-blur-sm p-4">
            <div className="w-full max-w-md bg-black border border-primary/40 shadow-[0_0_30px_rgba(8,203,0,0.2)] rounded-lg overflow-hidden animate-in fade-in zoom-in duration-200">
                <div className="flex items-center justify-between p-4 border-b border-primary/20">
                    <h2 className="text-xl font-bold text-primary tracking-tighter uppercase">IDENTITY_MANAGEMENT</h2>
                    <Button variant="ghost" size="icon" onClick={onClose} className="text-primary/70 hover:text-primary hover:bg-primary/10">
                        <X className="h-5 w-5" />
                    </Button>
                </div>

                <form onSubmit={handleSave} className="p-6 space-y-6">
                    {error && (
                        <div className="p-3 bg-red-500/10 border border-red-500/50 text-red-500 text-sm rounded font-mono">
                            ERROR: {error}
                        </div>
                    )}

                    <div className="flex flex-col items-center gap-4">
                        <div className="relative group">
                            <div className="h-24 w-24 rounded-full border-2 border-primary overflow-hidden bg-black flex items-center justify-center shadow-[0_0_15px_rgba(8,203,0,0.3)]">
                                {image ? (
                                    <img src={image} alt="Avatar" className="h-full w-full object-cover" />
                                ) : (
                                    <User className="h-12 w-12 text-primary/40" />
                                )}
                                {isUploading && (
                                    <div className="absolute inset-0 bg-black/60 flex items-center justify-center">
                                        <Loader2 className="h-6 w-6 text-primary animate-spin" />
                                    </div>
                                )}
                            </div>
                            <button
                                type="button"
                                onClick={() => fileInputRef.current?.click()}
                                className="absolute bottom-0 right-0 bg-primary text-black p-1.5 rounded-full border-2 border-black hover:bg-primary/90 transition-colors shadow-lg"
                                disabled={isUploading}
                            >
                                <Camera className="h-4 w-4" />
                            </button>
                            <input
                                type="file"
                                ref={fileInputRef}
                                className="hidden"
                                accept="image/*"
                                onChange={handleFileSelect}
                            />
                        </div>
                        <p className="text-[10px] font-mono text-primary/50 uppercase tracking-widest">Update uplink identifier avatar</p>
                    </div>

                    <div className="space-y-2">
                        <label className="text-xs uppercase font-bold text-primary/70 tracking-widest ml-1">CODENAME</label>
                        <Input
                            placeholder="e.g. NEO"
                            value={name}
                            onChange={(e) => setName(e.target.value)}
                            className="bg-black border-primary/30 text-primary focus-visible:ring-primary/50 font-mono"
                            required
                        />
                    </div>

                    <div className="space-y-2">
                        <label className="text-xs uppercase font-bold text-primary/70 tracking-widest ml-1">ACCESS_EMAIL</label>
                        <Input
                            value={session?.user?.email || ""}
                            disabled
                            className="bg-black border-primary/10 text-primary/40 font-mono cursor-not-allowed"
                        />
                        <p className="text-[9px] text-primary/30 font-mono uppercase italic ml-1">Email cannot be modified once synchronized</p>
                    </div>

                    <div className="pt-4 flex gap-3">
                        <Button
                            type="button"
                            variant="ghost"
                            onClick={onClose}
                            className="flex-1 text-primary/70 hover:text-primary hover:bg-primary/10 border border-primary/20"
                        >
                            ABORT
                        </Button>
                        <Button
                            type="submit"
                            disabled={isSaving || isUploading || !name}
                            className="flex-1 bg-primary text-black font-bold hover:bg-primary/90 shadow-[0_0_15px_rgba(8,203,0,0.4)] border-none"
                        >
                            {isSaving ? <Loader2 className="h-4 w-4 animate-spin" /> : "COMMIT_CHANGES"}
                        </Button>
                    </div>
                </form>
            </div>
        </div>
    )
}
