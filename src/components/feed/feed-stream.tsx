"use client"

import { useState, useEffect } from "react"
import { PostCard } from "./post-card"
import { Loader2, Terminal } from "lucide-react"

export function FeedStream() {
    const [posts, setPosts] = useState<any[]>([])
    const [isLoading, setIsLoading] = useState(true)

    useEffect(() => {
        const fetchFeed = async () => {
            try {
                const res = await fetch("/api/feed")
                if (res.ok) {
                    const data = await res.json()
                    setPosts(data)
                }
            } catch (error) {
                console.error("Failed to load feed", error)
            } finally {
                setIsLoading(false)
            }
        }
        fetchFeed()
    }, [])

    if (isLoading) {
        return (
            <div className="flex flex-col items-center justify-center py-20 gap-4">
                <Loader2 className="h-8 w-8 text-primary animate-spin" />
                <span className="text-primary font-mono text-xs animate-pulse">SYNCHRONIZING_FEED_LAYER...</span>
            </div>
        )
    }

    if (posts.length === 0) {
        return (
            <div className="border border-dashed border-primary/20 p-12 text-center rounded-lg">
                <Terminal className="h-10 w-10 text-primary/20 mx-auto mb-4" />
                <p className="text-primary/40 font-mono text-sm uppercase tracking-widest">NO_LOGS_DETECTED_IN_THIS_SECTOR</p>
                <p className="text-primary/20 font-mono text-[10px] mt-2 italic">join more nodes to see updates from the network</p>
            </div>
        )
    }

    return (
        <div className="space-y-6 pb-12">
            {posts.map(post => (
                <PostCard 
                    key={post.id} 
                    id={post.id}
                    authorId={post.authorId}
                    authorName={post.authorName}
                    authorImage={post.authorImage}
                    groupName={post.groupName}
                    content={post.content}
                    createdAt={post.createdAt}
                    mediaUrl={post.mediaUrl}
                    commentsCount={post.commentsCount}
                    comments={post.comments}
                    boostCount={post.boostCount}
                    isBoosted={post.isBoosted}
                />
            ))}
        </div>
    )
}
