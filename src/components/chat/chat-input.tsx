import { useState, useRef } from "react"
import { Button } from "@/components/ui/button"
import { Textarea } from "@/components/ui/textarea"
import { Send, Image as ImageIcon, X, Loader2 } from "lucide-react"
import { useUploadThing } from "@/lib/uploadthing"

interface ChatInputProps {
    onSendMessage: (content: string, imageUrl?: string) => void
}

export function ChatInput({ onSendMessage }: ChatInputProps) {
  const [message, setMessage] = useState("")
  const [imageUrl, setImageUrl] = useState<string | null>(null)
  const fileInputRef = useRef<HTMLInputElement>(null)

  const { startUpload, isUploading } = useUploadThing("imageUploader", {
    onClientUploadComplete: (res) => {
      if (res?.[0]) {
        setImageUrl(res[0].url)
      }
    },
    onUploadError: (error) => {
      console.error("Upload failed:", error)
      alert(`UPLOAD_FAILURE: ${error.message}`)
    }
  })

  const handleSend = () => {
    if (message.trim() || imageUrl) {
      onSendMessage(message, imageUrl || undefined)
      setMessage("")
      setImageUrl(null)
    }
  }

  const handleKeyDown = (e: React.KeyboardEvent) => {
      if (e.key === 'Enter' && !e.shiftKey) {
          e.preventDefault()
          handleSend()
      }
  }

  const handleFileSelect = async (e: React.ChangeEvent<HTMLInputElement>) => {
      const file = e.target.files?.[0]
      if (!file) return

      await startUpload([file])
      if (fileInputRef.current) fileInputRef.current.value = ""
  }

  return (
    <div className="border-t border-primary/20 bg-black p-4 flex flex-col gap-2">
      {/* Preview Area */}
      {imageUrl && (
          <div className="relative inline-block group">
              <img src={imageUrl} alt="preview" className="h-20 w-auto rounded border border-primary/50 shadow-[0_0_10px_rgba(8,203,0,0.2)]" />
              <button 
                onClick={() => setImageUrl(null)}
                className="absolute -top-2 -right-2 bg-black border border-primary text-primary rounded-full p-1 opacity-100 hover:bg-primary hover:text-black transition-colors"
              >
                  <X className="h-3 w-3" />
              </button>
          </div>
      )}

      <div className="flex items-end gap-2">
          <input 
            type="file" 
            ref={fileInputRef} 
            className="hidden" 
            accept="image/*" 
            onChange={handleFileSelect} 
          />
          <Button 
            variant="ghost" 
            size="icon" 
            disabled={isUploading}
            onClick={() => fileInputRef.current?.click()}
            className="h-10 w-10 shrink-0 text-primary hover:bg-primary/10"
          >
              {isUploading ? <Loader2 className="h-5 w-5 animate-spin" /> : <ImageIcon className="h-5 w-5" />}
          </Button>
          <Textarea
            placeholder="TERMINAL_COMMAND > "
            className="min-h-[40px] max-h-[120px] resize-none py-3 bg-black text-primary border-primary/30 focus-visible:ring-primary/50 placeholder:text-primary/30 font-mono"
            value={message}
            onChange={(e) => setMessage(e.target.value)}
            onKeyDown={handleKeyDown}
          />
          <Button 
            onClick={handleSend} 
            size="icon" 
            disabled={isUploading || (!message.trim() && !imageUrl)}
            className="h-10 w-10 shrink-0 bg-primary text-black hover:bg-primary/90 shadow-[0_0_15px_rgba(8,203,0,0.4)] border-none"
          >
            <Send className="h-4 w-4" />
          </Button>
      </div>
    </div>
  )
}
