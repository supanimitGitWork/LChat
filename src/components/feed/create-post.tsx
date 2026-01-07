"use client"

import { useState, useEffect, useRef } from "react"
import { Button } from "@/components/ui/button"
import { Textarea } from "@/components/ui/textarea"
import { Image as ImageIcon, Globe, Loader2, X, Send } from "lucide-react"
import { useUploadThing } from "@/lib/uploadthing"

export function CreatePost() {
  const [content, setContent] = useState("")
  const [groupId, setGroupId] = useState("")
  const [groups, setGroups] = useState<{id: string, name: string}[]>([])
  const [mediaUrl, setMediaUrl] = useState("")
  const [isSubmitting, setIsSubmitting] = useState(false)
  const fileInputRef = useRef<HTMLInputElement>(null)

  const { startUpload, isUploading } = useUploadThing("imageUploader", {
    onClientUploadComplete: (res) => {
      if (res?.[0]) {
        setMediaUrl(res[0].url)
      }
    },
    onUploadError: (error) => {
      console.error("Upload failed:", error)
      alert(`UPLOAD_FAILURE: ${error.message}`)
    }
  })

  useEffect(() => {
    const fetchGroups = async () => {
        try {
            const res = await fetch("/api/groups")
            if (res.ok) {
                const data = await res.json()
                setGroups(data)
                if (data.length > 0 && !groupId) {
                    setGroupId(data[0].id)
                }
            }
        } catch (error) {
            console.error("Failed to load groups", error)
        }
    }
    fetchGroups()
  }, [])

  const handleUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0]
    if (!file) return

    await startUpload([file])
    if (fileInputRef.current) fileInputRef.current.value = ""
  }

  const handleSubmit = async () => {
      if (!content.trim() && !mediaUrl) return
      if (!groupId) return

      setIsSubmitting(true)
      try {
          const res = await fetch("/api/feed", {
              method: "POST",
              headers: { "Content-Type": "application/json" },
              body: JSON.stringify({
                  content,
                  groupId,
                  mediaUrl
              })
          })

          if (res.ok) {
              setContent("")
              setMediaUrl("")
              window.location.reload() // Refresh to see post
          } else {
              const data = await res.json()
              alert(`POST_FAILURE: ${data.error || "UNKNOWN_ERROR"}\n${data.message || ""}`)
          }
      } catch (error) {
          console.error("Post failed", error)
          alert("POST_FAILURE: NETWORK_ERROR")
      } finally {
          setIsSubmitting(false)
      }
  }

  return (
    <div className="mb-8 border-2 border-primary/80 bg-black/80 p-4 relative overflow-hidden">
      
      <div className="flex items-center justify-between mb-4 border-b border-primary/80 pb-2">
        <div className="flex items-center gap-2">
            <Globe className="h-4 w-4 text-primary animate-pulse" />
            <span className="text-xs font-bold text-primary tracking-widest uppercase">BROADCAST_UPLINK</span>
        </div>
        <select 
            value={groupId} 
            onChange={(e) => setGroupId(e.target.value)}
            className="bg-black border border-primary/80 text-primary text-[10px] uppercase font-mono px-2 py-1 outline-none focus:border-primary transition-colors"
        >
            <option value="">SELECT_NODE --</option>
            {groups.map(g => (
                <option key={g.id} value={g.id}>{g.name}</option>
            ))}
        </select>
      </div>

      <div className="space-y-4">
        <Textarea
            placeholder="ESTABLISH_CONNECTION: Type your update here..."
            className="min-h-[120px] resize-none bg-black/80 border-primary/80 rounded-none focus-visible:ring-primary text-primary font-mono placeholder:text-primary/40"
            value={content}
            onChange={(e) => setContent(e.target.value)}
        />

        {mediaUrl && (
            <div className="relative w-full aspect-video border border-primary/80 rounded-sm overflow-hidden group">
                <img src={mediaUrl} alt="Preview" className="w-full h-full object-cover" />
                <Button 
                    variant="destructive" 
                    size="icon" 
                    onClick={() => setMediaUrl("")}
                    className="absolute top-2 right-2 h-6 w-6 rounded-none opacity-0 group-hover:opacity-100 transition-opacity"
                >
                    <X className="h-4 w-4" />
                </Button>
            </div>
        )}

        <div className="flex justify-between items-center bg-primary/80 p-2 border-t border-primary/80">
            <div className="flex items-center gap-3">
                <input 
                    type="file" 
                    ref={fileInputRef} 
                    className="hidden" 
                    accept="image/*"
                    onChange={handleUpload}
                />
                <Button 
                    variant="ghost" 
                    size="sm" 
                    disabled={isUploading}
                    onClick={() => fileInputRef.current?.click()}
                    className="text-black font-bold hover:bg-black hover:text-primary gap-2 h-8 rounded-none border border-black"
                >
                    {isUploading ? <Loader2 className="h-3.5 w-3.5 animate-spin" /> : <ImageIcon className="h-3.5 w-3.5" />}
                    <span className="text-[10px] font-bold tracking-tighter uppercase">ATTACH_VISUAL</span>
                </Button>
            </div>
            
            <Button 
                onClick={handleSubmit} 
                disabled={(!content.trim() && !mediaUrl) || !groupId || isSubmitting}
                className="bg-black text-primary border-2 border-primary hover:bg-primary hover:text-black font-bold px-6 h-8 rounded-none flex gap-2 items-center shadow-[0_0_15px_rgba(8,203,0,0.8)]"
            >
                {isSubmitting ? <Loader2 className="h-4 w-4 animate-spin" /> : <Send className="h-4 w-4" />}
                <span className="tracking-widest uppercase">TRANSMIT</span>
            </Button>
        </div>
      </div>
    </div>
  )
}
