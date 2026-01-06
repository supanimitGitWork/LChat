import { FeedStream } from "@/components/feed/feed-stream"
import { CreatePost } from "@/components/feed/create-post"
import { LayoutDashboard } from "lucide-react"

export default function FeedPage() {
    return (
        <div className="h-full overflow-y-auto custom-scrollbar bg-black/40">
            <div className="max-w-3xl mx-auto px-6 py-8">
                <div className="flex items-center gap-3 mb-8 border-b border-primary/20 pb-4">
                    <LayoutDashboard className="h-6 w-6 text-primary shadow-[0_0_10px_rgba(8,203,0,0.5)]" />
                    <h1 className="text-2xl font-bold tracking-[0.2em] text-primary uppercase italic">NETWORK_UPLINK_FEED</h1>
                </div>
                
                <CreatePost />
                <FeedStream />
            </div>
        </div>
    )
}
