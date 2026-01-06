"use client"

import { useState, useEffect } from "react"
import { useRouter } from "next/navigation"
import { Button } from "@/components/ui/button"
import { X, Loader2, Hash, Users, ArrowRight } from "lucide-react"

interface JoinGroupDialogProps {
    isOpen: boolean
    onClose: () => void
}

interface DiscoverableGroup {
    id: string
    name: string
    description?: string
    memberCount: number
}

export function JoinGroupDialog({ isOpen, onClose }: JoinGroupDialogProps) {
    const [groups, setGroups] = useState<DiscoverableGroup[]>([])
    const [isLoading, setIsLoading] = useState(false)
    const [joiningId, setJoiningId] = useState<string | null>(null)
    const [error, setError] = useState("")
    const router = useRouter()

    const fetchDiscoverable = async () => {
        setIsLoading(true)
        setError("")
        try {
            const res = await fetch("/api/groups/discover")
            if (res.ok) {
                const data = await res.json()
                setGroups(data)
            } else {
                throw new Error("Failed to load available nodes")
            }
        } catch (err: any) {
            setError(err.message)
        } finally {
            setIsLoading(false)
        }
    }

    useEffect(() => {
        if (isOpen) {
            fetchDiscoverable()
        }
    }, [isOpen])

    const handleJoin = async (groupId: string) => {
        setJoiningId(groupId)
        setError("")

        try {
            const res = await fetch("/api/groups/join", {
                method: "POST",
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify({ groupId }),
            })

            if (!res.ok) {
                const data = await res.json()
                throw new Error(data.error || "Failed to join node")
            }

            onClose()
            router.push(`/groups/${groupId}`)
            router.refresh()
        } catch (err: any) {
            setError(err.message)
        } finally {
            setJoiningId(null)
        }
    }

    if (!isOpen) return null

    return (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/80 backdrop-blur-sm p-4">
            <div className="w-full max-w-lg bg-black border border-primary/40 shadow-[0_0_30px_rgba(8,203,0,0.2)] rounded-lg overflow-hidden animate-in fade-in zoom-in duration-200 flex flex-col max-h-[80vh]">
                <div className="flex items-center justify-between p-4 border-b border-primary/20 shrink-0">
                    <h2 className="text-xl font-bold text-primary tracking-tighter uppercase">DISCOVER_NODES</h2>
                    <Button variant="ghost" size="icon" onClick={onClose} className="text-primary/70 hover:text-primary hover:bg-primary/10">
                        <X className="h-5 w-5" />
                    </Button>
                </div>

                <div className="p-4 flex-1 overflow-y-auto min-h-0 space-y-4">
                    {error && (
                        <div className="p-3 bg-red-500/10 border border-red-500/50 text-red-500 text-sm rounded font-mono">
                            ERROR: {error}
                        </div>
                    )}

                    {isLoading ? (
                        <div className="flex flex-col items-center justify-center py-12 space-y-4">
                            <Loader2 className="h-8 w-8 text-primary animate-spin" />
                            <p className="text-xs font-mono text-primary/50 uppercase tracking-[0.2em]">scanning_network...</p>
                        </div>
                    ) : groups.length > 0 ? (
                        <div className="grid gap-3">
                            {groups.map((group) => (
                                <div 
                                    key={group.id}
                                    className="p-4 border border-primary/10 bg-primary/5 hover:bg-primary/10 hover:border-primary/30 transition-all rounded group"
                                >
                                    <div className="flex items-center justify-between">
                                        <div className="flex-1 min-w-0">
                                            <div className="flex items-center gap-2">
                                                <Hash className="h-4 w-4 text-primary" />
                                                <h3 className="text-lg font-bold text-primary tracking-tight uppercase truncate">{group.name}</h3>
                                            </div>
                                            {group.description && (
                                                <p className="text-xs text-primary/60 mt-1 font-mono line-clamp-1">{group.description}</p>
                                            )}
                                            <div className="flex items-center gap-2 mt-2 text-[10px] font-mono text-primary/40">
                                                <Users className="h-3 w-3" />
                                                <span>{group.memberCount} CONNECTED_USERS</span>
                                            </div>
                                        </div>
                                        <Button 
                                            size="sm"
                                            disabled={joiningId === group.id}
                                            onClick={() => handleJoin(group.id)}
                                            className="ml-4 bg-primary/20 text-primary border border-primary/30 hover:bg-primary hover:text-black font-bold uppercase"
                                        >
                                            {joiningId === group.id ? <Loader2 className="h-4 w-4 animate-spin" /> : "CONNECT"}
                                        </Button>
                                    </div>
                                </div>
                            ))}
                        </div>
                    ) : (
                        <div className="text-center py-12 px-6">
                            <div className="inline-block p-4 rounded-full bg-primary/5 border border-primary/10 mb-4">
                                <Hash className="h-8 w-8 text-primary/30" />
                            </div>
                            <p className="text-sm text-primary/50 font-mono uppercase tracking-widest">No discoverable nodes found</p>
                        </div>
                    )}
                </div>

                <div className="p-4 border-t border-primary/20 bg-black/50 shrink-0">
                    <Button
                        variant="ghost"
                        onClick={onClose}
                        className="w-full text-primary/70 hover:text-primary hover:bg-primary/10 font-mono text-xs tracking-tighter"
                    >
                        [BACK_TO_TERMINAL]
                    </Button>
                </div>
            </div>
        </div>
    )
}
