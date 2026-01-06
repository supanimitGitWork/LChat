import { cn } from "@/lib/utils"

interface MessageBubbleProps {
  id?: string
  content: string
  isOwn?: boolean
  senderName?: string
  senderImage?: string
  timestamp?: string
  image?: string
  isHighlighted?: boolean
}

export function MessageBubble({ id, content, isOwn, senderName, senderImage, timestamp, image, isHighlighted }: MessageBubbleProps) {
  return (
    <div 
        id={id}
        className={cn("flex w-full mb-6 hover:bg-primary/10 p-2 rounded-md transition-all duration-500", 
        // Always left align, no special own alignment
        "justify-start",
        isHighlighted && "bg-primary/80 shadow-[0_0_25px_rgba(8,203,0,0.8)] border-2 border-primary"
    )}>
      <div className="flex gap-4 max-w-full w-full">
        
        {/* Avatar */}
        <div className="flex-shrink-0 pt-1">
          <div className="h-10 w-10 rounded-full border-2 border-primary flex items-center justify-center bg-black text-primary font-bold shadow-[0_0_15px_rgba(8,203,0,0.6)] overflow-hidden">
            {senderImage ? (
                <img src={senderImage} alt={senderName} className="h-full w-full object-cover" />
            ) : (
                senderName?.charAt(0).toUpperCase()
            )}
          </div>
        </div>

        {/* Info & Content */}
        <div className="flex flex-col min-w-0 flex-1">
            
            {/* Sender Name */}
            <div className="flex items-baseline gap-2 mb-1">
                <span className="font-bold text-primary tracking-wide text-base shadow-primary/20">{senderName}</span>
            </div>

            {/* Message Content (No Bubble) */}
            <div className="text-primary text-[15px] leading-relaxed break-words whitespace-pre-wrap font-mono">
                 {image && (
                    <div className="mb-3 max-w-md">
                        <img 
                            src={image} 
                            alt="attachment" 
                            className="rounded border-2 border-primary shadow-[0_0_20px_rgba(8,203,0,0.4)] hover:border-primary transition-all cursor-zoom-in" 
                        />
                    </div>
                )}
                {content}
            </div>
            
            {/* Time Below */}
            <div className="mt-1">
                <span className="text-[10px] text-primary/80 uppercase font-bold tracking-widest">
                    {timestamp}
                </span>
            </div>
        </div>
      </div>
    </div>
  )
}
