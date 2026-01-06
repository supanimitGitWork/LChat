"use client"

import { useState, useEffect } from "react"
import Link from "next/link"
import { usePathname } from "next/navigation"
import { useSession, signOut } from "next-auth/react"
import { cn } from "@/lib/utils"
import { Button } from "@/components/ui/button"
import { MessageSquare, Users, User, LogOut, Hash, Loader2, Plus, Search } from "lucide-react"
import { CreateGroupDialog } from "@/components/groups/create-group-dialog"
import { JoinGroupDialog } from "@/components/groups/join-group-dialog"
import { ProfileDialog } from "@/components/user/profile-dialog"
import { socket } from "@/lib/socket"

interface SidebarProps extends React.HTMLAttributes<HTMLDivElement> {}

interface GroupList {
    id: string
    name: string
    description?: string
}

export function Sidebar({ className }: SidebarProps) {
  const { data: session } = useSession()
  const pathname = usePathname()
  const [groups, setGroups] = useState<GroupList[]>([])
  const [isLoading, setIsLoading] = useState(true)
  const [isDialogOpen, setIsDialogOpen] = useState(false)
  const [isJoinDialogOpen, setIsJoinDialogOpen] = useState(false)
  const [isProfileDialogOpen, setIsProfileDialogOpen] = useState(false)
  const [onlineUsers, setOnlineUsers] = useState<string[]>([])
  const [isConnected, setIsConnected] = useState(false)
  
  const fetchGroups = async () => {
    try {
        const res = await fetch("/api/groups")
        if (res.ok) {
            const data = await res.json()
            setGroups(data)
        }
    } catch (error) {
        console.error("Failed to fetch groups:", error)
    } finally {
        setIsLoading(false)
    }
  }

  useEffect(() => {
    if (session?.user) {
        fetchGroups()

        if (!socket.connected) {
            socket.on("connect", () => {
                const user = session.user as any
                socket.emit("user_connected", user.id)
                setIsConnected(true)
            })
            socket.connect()
        } else {
            const user = session.user as any
            socket.emit("user_connected", user.id)
            setIsConnected(true)
        }

        socket.on("online_users_list", (users: string[]) => setOnlineUsers(users))
        socket.on("user_online", (userId: string) => setOnlineUsers(prev => [...new Set([...prev, userId])]))
        socket.on("user_offline", (userId: string) => setOnlineUsers(prev => prev.filter(id => id !== userId)))
        socket.on("new_group_available", () => fetchGroups())

        return () => {
            socket.off("online_users_list")
            socket.off("user_online")
            socket.off("user_offline")
            socket.off("new_group_available")
        }
    }
  }, [session])

  const isActive = (path: string) => pathname?.startsWith(path)

  return (
    <div className={cn("w-64 border-r border-border bg-black md:flex flex-col h-full", className)}>
      <div className="space-y-4 py-4 h-full flex flex-col overflow-hidden">
        <div className="px-3 py-2">
          <h2 className="mb-2 px-4 text-xs uppercase text-primary/70 font-bold tracking-[0.2em]">
            SYSTEM
          </h2>
          <div className="space-y-1">
            <Link href="/groups/general" passHref>
                <Button variant={isActive("/groups") ? "secondary" : "ghost"} className="w-full justify-start text-primary hover:text-primary hover:bg-primary/10 hover:shadow-[0_0_8px_rgba(8,203,0,0.2)]">
                    <MessageSquare className="mr-2 h-4 w-4" />
                    CHATS
                </Button>
            </Link>
             <Link href="/feed" passHref>
                <Button variant={isActive("/feed") ? "secondary" : "ghost"} className="w-full justify-start text-primary hover:text-primary hover:bg-primary/10 hover:shadow-[0_0_8px_rgba(8,203,0,0.2)]">
                    <Users className="mr-2 h-4 w-4" />
                    FEED_LAYER
                    <span className="ml-auto text-[10px] bg-primary/20 px-1 border border-primary/40 text-primary animate-pulse">{onlineUsers.length} ONLINE</span>
                </Button>
            </Link>
          </div>
        </div>
        
        <div className="px-3 py-2 flex-1 overflow-y-auto min-h-0">
          <h2 className="mb-2 px-4 text-xs uppercase text-primary/70 font-bold tracking-[0.2em]">
            NODES
          </h2>
          <div className="space-y-1">
            {isLoading ? (
                <div className="py-2 px-4">
                    <Loader2 className="h-4 w-4 text-primary/50 animate-spin" />
                </div>
            ) : groups.length > 0 ? (
                groups.map((group) => (
                    <Link key={group.id} href={`/groups/${group.id}`} passHref>
                        <Button 
                          variant={pathname === `/groups/${group.id}` ? "secondary" : "ghost"} 
                          className="w-full justify-start font-normal text-primary hover:text-primary hover:bg-primary/10"
                        >
                          <Hash className="mr-2 h-4 w-4 opacity-70" />
                          {group.name}
                        </Button>
                    </Link>
                  ))
            ) : (
                <p className="px-4 py-2 text-[10px] text-primary/40 font-mono tracking-tighter">NO_NODES_ACTIVE</p>
            )}
            
            <div className="grid grid-cols-2 gap-2 mt-4 px-2">
                <Button 
                    variant="ghost" 
                    size="sm"
                    className="flex flex-col h-auto py-3 text-[10px] items-center justify-center text-primary/60 hover:text-primary hover:bg-primary/10 border border-primary/10 hover:border-primary/30"
                    onClick={() => setIsDialogOpen(true)}
                >
                    <Plus className="h-4 w-4 mb-1" />
                    INITIALIZE
                </Button>
                <Button 
                    variant="ghost" 
                    size="sm"
                    className="flex flex-col h-auto py-3 text-[10px] items-center justify-center text-primary/60 hover:text-primary hover:bg-primary/10 border border-primary/10 hover:border-primary/30"
                    onClick={() => setIsJoinDialogOpen(true)}
                >
                    <Search className="h-4 w-4 mb-1" />
                    JOIN
                </Button>
            </div>
          </div>
        </div>

        <div className="px-3 py-2 mt-auto">
            <div className="space-y-1 border-t border-primary/20 pt-4">
                 {session?.user && (
                    <div 
                        onClick={() => setIsProfileDialogOpen(true)}
                        className="flex items-center gap-3 px-2 py-2 mb-2 rounded-md hover:bg-primary/10 transition-colors cursor-pointer group border border-transparent hover:border-primary/20"
                    >
                        <div className="h-9 w-9 rounded-full bg-black border border-primary flex items-center justify-center text-primary font-bold shadow-[0_0_5px_rgba(8,203,0,0.5)] overflow-hidden">
                            {session.user.image ? (
                                <img src={session.user.image} alt="Profile" className="h-full w-full object-cover" />
                            ) : (
                                session.user.name?.charAt(0).toUpperCase()
                            )}
                        </div>
                         <div className="flex-1 overflow-hidden">
                            <p className="text-sm font-bold text-primary truncate group-hover:text-primary transition-colors tracking-wide">{session.user.name}</p>
                            <p className="text-[10px] text-primary/80 truncate font-mono">{session.user.email}</p>
                        </div>
                    </div>
                 )}
                 
                 <Button variant="ghost" size="sm" className="w-full justify-start text-primary/70 hover:text-red-500 hover:bg-red-500/10 hover:border-red-500/20" onClick={() => signOut()}>
                    <LogOut className="mr-2 h-4 w-4" />
                    TERMINATE SESSION
                 </Button>
            </div>
        </div>

      </div>

      <CreateGroupDialog 
        isOpen={isDialogOpen} 
        onClose={() => {
            setIsDialogOpen(false)
            fetchGroups()
        }} 
      />

      <JoinGroupDialog
        isOpen={isJoinDialogOpen}
        onClose={() => {
            setIsJoinDialogOpen(false)
            fetchGroups()
        }}
      />

      <ProfileDialog
        isOpen={isProfileDialogOpen}
        onClose={() => setIsProfileDialogOpen(false)}
      />
    </div>
  )
}
