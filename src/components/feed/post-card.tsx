import { Card, CardContent, CardFooter, CardHeader } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { MessageSquare, Globe, Send, Loader2, X, Hash, Trash2 } from "lucide-react"
import { useState } from "react"
import { useSession } from "next-auth/react"
import { Input } from "@/components/ui/input"
import { cn } from "@/lib/utils"

interface Comment {
    id: string
    content: string
    createdAt: Date
    authorName: string
    authorImage?: string
}

interface PostCardProps {
  id: string
  authorId: string
  authorName: string
  authorImage?: string
  groupName?: string
  content: string
  createdAt: Date
  mediaUrl?: string
  commentsCount?: number
  comments?: Comment[]
  boostCount: number
  isBoosted: boolean
}

export function PostCard({ 
    id, 
    authorId,
    authorName, 
    authorImage, 
    groupName, 
    content, 
    createdAt, 
    mediaUrl, 
    commentsCount = 0,
    comments,
    boostCount: initialBoostCount,
    isBoosted: initialIsBoosted
}: PostCardProps) {
  const [isCommentsOpen, setIsCommentsOpen] = useState(false)
  const [commentList, setCommentList] = useState<Comment[]>(comments || [])
  const [newComment, setNewComment] = useState("")
  const [isSubmitting, setIsSubmitting] = useState(false)
  
  // Boost state
  const [boostCount, setBoostCount] = useState(initialBoostCount)
  const [isBoosted, setIsBoosted] = useState(initialIsBoosted)
  const [isBoosting, setIsBoosting] = useState(false)

  // Share state
  const [isShareOpen, setIsShareOpen] = useState(false)
  const [groups, setGroups] = useState<{id: string, name: string}[]>([])
  const [isSharing, setIsSharing] = useState(false)

  const handleBoost = async () => {
    if (isBoosting) return
    setIsBoosting(true)
    
    // Optimistic UI
    const prevBoosted = isBoosted
    const prevCount = boostCount
    setIsBoosted(!prevBoosted)
    setBoostCount(prevBoosted ? prevCount - 1 : prevCount + 1)

    try {
        const res = await fetch("/api/feed/boost", {
            method: "POST",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify({ postId: id })
        })
        if (!res.ok) throw new Error()
        const data = await res.json()
        setIsBoosted(data.boosted)
        setBoostCount(data.boostCount)
    } catch (error) {
        // Revert
        setIsBoosted(prevBoosted)
        setBoostCount(prevCount)
    } finally {
        setIsBoosting(false)
    }
  }

  const fetchGroups = async () => {
    try {
        const res = await fetch("/api/groups")
        if (res.ok) {
            const data = await res.json()
            setGroups(data)
        }
    } catch (error) {
        console.error("Failed to load groups", error)
    }
  }

  const handleShare = async (groupId: string) => {
    setIsSharing(true)
    try {
        const res = await fetch("/api/feed/share", {
            method: "POST",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify({ postId: id, groupId })
        })
        if (res.ok) {
            setIsShareOpen(false)
        }
    } catch (error) {
        console.error("Share failed", error)
    } finally {
        setIsSharing(false)
    }
  }

  const { data: session } = useSession()

  const handleDelete = async () => {
    if (!confirm("CONFIRM_TERMINATION: Are you sure you want to delete this broadcast?")) return

    try {
        const res = await fetch(`/api/feed/${id}`, { method: "DELETE" })
        if (res.ok) {
            window.location.reload()
        }
    } catch (error) {
        console.error("Delete failed", error)
    }
  }

  const isAuthor = session?.user && (session.user as any).id === authorId

  const handleSubmitComment = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!newComment.trim() || isSubmitting) return

    setIsSubmitting(true)
    try {
        const res = await fetch("/api/feed/comments", {
            method: "POST",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify({
                content: newComment,
                postId: id
            })
        })

        if (res.ok) {
            const data = await res.json()
            setCommentList(prev => [...prev, {
                ...data,
                createdAt: new Date(data.createdAt),
                authorName: data.author?.name || "Unknown",
                authorImage: data.author?.image
            }])
            setNewComment("")
        }
    } catch (error) {
        console.error("Failed to post comment", error)
    } finally {
        setIsSubmitting(false)
    }
  }

  return (
    <Card className="mb-6 bg-black border-primary/80 rounded-none shadow-[0_0_15px_rgba(8,203,0,0.8)] group hover:border-primary transition-all duration-300">
      <CardHeader className="flex flex-row items-center gap-4 p-4 border-b border-primary/80">
        {/* Avatar */}
        <div className="h-10 w-10 rounded-full border border-primary/80 flex items-center justify-center bg-black overflow-hidden shadow-[0_0_8px_rgba(8,203,0,0.8)]">
            {authorImage ? (
                <img src={authorImage} alt={authorName} className="h-full w-full object-cover" />
            ) : (
                <span className="text-primary font-bold">{authorName.charAt(0).toUpperCase()}</span>
            )}
        </div>
        
        <div className="flex flex-col flex-1">
          <div className="flex items-center gap-2">
            <span className="font-bold text-sm text-primary tracking-tighter uppercase">{authorName}</span>
            <div className="h-1 w-1 rounded-full bg-primary" />
            <span className="text-[10px] text-primary font-mono flex items-center gap-1 uppercase">
                <Globe className="h-3 w-3" /> {groupName || "GENERAL"}
            </span>
          </div>
          <span className="text-[10px] text-primary/80 font-mono italic">TIMESTAMP: {new Date(createdAt).toLocaleString()}</span>
        </div>

        {isAuthor && (
            <Button 
                variant="ghost" 
                size="icon" 
                onClick={handleDelete}
                className="text-primary/40 hover:text-red-500 hover:bg-red-500/10 transition-colors h-8 w-8 rounded-none border border-transparent hover:border-red-500/50"
            >
                <Trash2 className="h-4 w-4" />
            </Button>
        )}
      </CardHeader>

      <CardContent className="p-6 space-y-4 pb-4">
        {content && (
            <p className="text-sm leading-relaxed text-primary font-mono whitespace-pre-wrap break-words border-l-2 border-primary/40 pl-4 py-1">
                {content}
            </p>
        )}
        
        {mediaUrl && (
            <div className="relative overflow-hidden border border-primary/80 bg-primary/20 rounded-sm p-1">
                <div className="relative aspect-video w-full overflow-hidden">
                    <img src={mediaUrl} alt="Data payload" className="object-cover w-full h-full opacity-90 group-hover:opacity-100 transition-opacity" />
                    {/* Scanline effect overlay */}
                    <div className="absolute inset-0 pointer-events-none bg-[linear-gradient(rgba(18,16,16,0)_50%,rgba(0,0,0,0.25)_50%),linear-gradient(90deg,rgba(255,0,0,0.06),rgba(0,255,0,0.02),rgba(0,0,255,0.06))] bg-[length:100%_4px,3px_100%] opacity-80" />
                </div>
            </div>
        )}
      </CardContent>

      <CardFooter className="px-4 py-2 border-t border-primary/80 flex flex-col bg-primary/80 relative">
        <div className="w-full flex justify-between items-center py-2">
            <div className="flex gap-2">
                <Button 
                    variant="ghost" 
                    size="sm" 
                    onClick={handleBoost}
                    disabled={isBoosting}
                    className={cn(
                        "text-black font-black hover:bg-black hover:text-primary gap-2 h-8 px-3 rounded-none transition-all duration-300 border border-transparent hover:border-black",
                        isBoosted && "bg-black text-primary border-black shadow-[0_0_15px_rgba(0,0,0,0.5)]"
                    )}
                >
                    <Globe className={cn("h-3.5 w-3.5", isBoosted && "animate-pulse")} />
                    <span className="text-[10px] tracking-widest uppercase">{boostCount} SIGNAL_BOOST</span>
                </Button>

                <Button 
                    variant="ghost" 
                    size="sm" 
                    onClick={() => {
                        setIsShareOpen(!isShareOpen)
                        if (!isShareOpen) fetchGroups()
                    }}
                    className={cn(
                        "text-black font-black hover:bg-black hover:text-primary gap-2 h-8 px-3 rounded-none transition-all duration-300 border border-transparent hover:border-black",
                        isShareOpen && "bg-black text-primary border-black"
                    )}
                >
                    <Send className="h-3.5 w-3.5" />
                    <span className="text-[10px] tracking-widest uppercase">ENCRYPT_SHARE</span>
                </Button>
            </div>

            <Button 
                variant="ghost" 
                size="sm" 
                onClick={() => setIsCommentsOpen(!isCommentsOpen)}
                className={cn(
                    "text-black font-bold hover:bg-black hover:text-primary gap-2 h-8 px-3 rounded-none transition-colors border border-transparent hover:border-black",
                    isCommentsOpen && "text-black bg-black/10 border-black"
                )}
            >
                <MessageSquare className="h-3.5 w-3.5" />
                <span className="text-[10px] font-bold tracking-widest uppercase">{commentList.length} COMMS</span>
            </Button>
        </div>

        {/* Share Selector Overay */}
        {isShareOpen && (
            <div className="absolute bottom-full left-4 mb-2 w-64 bg-black border-2 border-primary p-3 shadow-[0_0_20px_rgba(8,203,0,0.5)] z-20 animate-in slide-in-from-bottom-2 duration-200">
                <div className="flex justify-between items-center mb-3 pb-2 border-b border-primary/20">
                    <span className="text-[10px] font-black text-primary uppercase tracking-[0.2em]">BROADCAST_TARGET</span>
                    <Button variant="ghost" size="icon" onClick={() => setIsShareOpen(false)} className="h-4 w-4 text-primary p-0 p-px">
                        <X className="h-3 w-3" />
                    </Button>
                </div>
                <div className="space-y-2 max-h-48 overflow-y-auto custom-scrollbar">
                    {groups.length > 0 ? (
                        groups.map(g => (
                            <Button 
                                key={g.id}
                                variant="ghost"
                                size="sm"
                                disabled={isSharing}
                                onClick={() => handleShare(g.id)}
                                className="w-full justify-start text-[10px] text-primary/80 hover:text-black hover:bg-primary rounded-none border border-primary/20 hover:border-primary font-mono"
                            >
                                <Hash className="h-3 w-3 mr-2" />
                                {g.name}
                            </Button>
                        ))
                    ) : (
                        <p className="text-[9px] text-primary/40 text-center py-2 italic font-mono uppercase">no_nodes_detected...</p>
                    )}
                </div>
            </div>
        )}

        {isCommentsOpen && (
            <div className="w-full border-t border-black/20 pt-4 pb-2 space-y-4 animate-in slide-in-from-top-1 duration-200">
                {/* Comment List */}
                <div className="space-y-4 max-h-[300px] overflow-y-auto custom-scrollbar px-1">
                    {commentList.length > 0 ? (
                        commentList.map((comment) => (
                            <div key={comment.id} className="group/comment select-text">
                                <div className="flex items-center gap-2 mb-1">
                                    <span className="text-[10px] font-bold text-black uppercase">{comment.authorName}</span>
                                    <span className="text-[9px] text-black/80 font-mono italic">
                                        {new Date(comment.createdAt).toLocaleTimeString()}
                                    </span>
                                </div>
                                <p className="text-xs text-black font-mono pl-3 border-l border-black/40 break-words leading-relaxed">
                                    {comment.content}
                                </p>
                            </div>
                        ))
                    ) : (
                        <p className="text-[10px] text-black/60 font-mono italic uppercase tracking-wider text-center py-2">
                            awaiting_comms_traffic...
                        </p>
                    )}
                </div>

                {/* Comment Input */}
                <form onSubmit={handleSubmitComment} className="flex gap-2 mt-4 items-center">
                    <div className="flex-1 relative">
                        <Input 
                            placeholder="TRANSMIT_COMMENT >" 
                            value={newComment}
                            onChange={(e) => setNewComment(e.target.value)}
                            disabled={isSubmitting}
                            className="h-8 bg-black/80 border-black/40 text-xs font-mono text-primary rounded-none focus-visible:ring-black focus-visible:border-black placeholder:text-primary/40"
                        />
                    </div>
                    <Button 
                        type="submit" 
                        disabled={!newComment.trim() || isSubmitting}
                        className="h-8 w-8 p-0 bg-black text-primary hover:bg-black/90 border border-black rounded-none shadow-[0_0_8px_rgba(0,0,0,0.3)]"
                    >
                        {isSubmitting ? <Loader2 className="h-4 w-4 animate-spin" /> : <Send className="h-3.5 w-3.5" />}
                    </Button>
                </form>
            </div>
        )}
      </CardFooter>
    </Card>
  )
}
