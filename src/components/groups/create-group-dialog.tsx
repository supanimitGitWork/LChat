"use client"

import { useState } from "react"
import { useRouter } from "next/navigation"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Textarea } from "@/components/ui/textarea"
import { X, Loader2 } from "lucide-react"

interface CreateGroupDialogProps {
    isOpen: boolean
    onClose: () => void
}

export function CreateGroupDialog({ isOpen, onClose }: CreateGroupDialogProps) {
    const [name, setName] = useState("")
    const [description, setDescription] = useState("")
    const [isLoading, setIsLoading] = useState(false)
    const [error, setError] = useState("")
    const router = useRouter()

    if (!isOpen) return null

    const handleCreate = async (e: React.FormEvent) => {
        e.preventDefault()
        if (!name) return

        setIsLoading(true)
        setError("")

        try {
            const res = await fetch("/api/groups", {
                method: "POST",
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify({ name, description }),
            })

            if (!res.ok) {
                const data = await res.json()
                throw new Error(data.error || "Failed to create group")
            }

            const group = await res.json()
            
            // Emit group_created event for real-time sync
            import("@/lib/socket").then(({ socket }) => {
                socket.emit("group_created", group)
            })

            onClose()
            router.push(`/groups/${group.id}`)
            router.refresh()
        } catch (err: any) {
            setError(err.message)
        } finally {
            setIsLoading(false)
        }
    }

    return (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/80 backdrop-blur-sm p-4">
            <div className="w-full max-w-md bg-black border border-primary/40 shadow-[0_0_30px_rgba(8,203,0,0.2)] rounded-lg overflow-hidden animate-in fade-in zoom-in duration-200">
                <div className="flex items-center justify-between p-4 border-b border-primary/20">
                    <h2 className="text-xl font-bold text-primary tracking-tighter uppercase">INITIALIZE_NODE</h2>
                    <Button variant="ghost" size="icon" onClick={onClose} className="text-primary/70 hover:text-primary hover:bg-primary/10">
                        <X className="h-5 w-5" />
                    </Button>
                </div>

                <form onSubmit={handleCreate} className="p-6 space-y-6">
                    {error && (
                        <div className="p-3 bg-red-500/10 border border-red-500/50 text-red-500 text-sm rounded font-mono">
                            ERROR: {error}
                        </div>
                    )}

                    <div className="space-y-2">
                        <label className="text-xs uppercase font-bold text-primary/70 tracking-widest ml-1">NODE_NAME</label>
                        <Input
                            placeholder="e.g. PROJECT_OMEGA"
                            value={name}
                            onChange={(e) => setName(e.target.value)}
                            className="bg-black border-primary/30 text-primary focus-visible:ring-primary/50 font-mono"
                            required
                        />
                    </div>

                    <div className="space-y-2">
                        <label className="text-xs uppercase font-bold text-primary/70 tracking-widest ml-1">DESCRIPTION</label>
                        <Textarea
                            placeholder="Optional metadata..."
                            value={description}
                            onChange={(e) => setDescription(e.target.value)}
                            className="bg-black border-primary/30 text-primary focus-visible:ring-primary/50 font-mono resize-none h-24"
                        />
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
                            disabled={isLoading || !name}
                            className="flex-1 bg-primary text-black font-bold hover:bg-primary/90 shadow-[0_0_15px_rgba(8,203,0,0.4)] border-none"
                        >
                            {isLoading ? <Loader2 className="h-4 w-4 animate-spin" /> : "EXECUTE"}
                        </Button>
                    </div>
                </form>
            </div>
        </div>
    )
}
