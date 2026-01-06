import { useState, useRef, useEffect } from "react"
import { useSession } from "next-auth/react"
import { socket } from "@/lib/socket"
import { MessageBubble } from "./message-bubble"
import { ChatInput } from "./chat-input"
import { Search, X, Loader2 } from "lucide-react"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"

interface Message {
    id: string
    content: string
    senderId: string
    senderName: string
    senderImage?: string
    createdAt: Date
    isOwn: boolean
    image?: string
}

export function ChatWindow({ groupId }: { groupId: string }) {
    const { data: session } = useSession()
    // Cast to any to access custom id property added in next-auth route
    const user = session?.user as any
    const myId = user?.id
    const myName = user?.name
    const myImage = user?.image

    const [messages, setMessages] = useState<Message[]>([])
    const [isSearchOpen, setIsSearchOpen] = useState(false)
    const [searchQuery, setSearchQuery] = useState("")
    const [searchResults, setSearchResults] = useState<Message[]>([])
    const [isSearching, setIsSearching] = useState(false)
    const [highlightedMessageId, setHighlightedMessageId] = useState<string | null>(null)
    const scrollRef = useRef<HTMLDivElement>(null)

    const scrollToMessage = (messageId: string) => {
        setHighlightedMessageId(messageId)
        setIsSearchOpen(false) // Close search overlay
        
        // Let the state update and search overlay close slightly if needed, then scroll
        setTimeout(() => {
            const element = document.getElementById(`msg-${messageId}`)
            if (element) {
                element.scrollIntoView({ behavior: "smooth", block: "center" })
            }
        }, 100)

        // Remote highlight after 3 seconds
        setTimeout(() => {
            setHighlightedMessageId(null)
        }, 3000)
    }

    // Fetch initial messages
    useEffect(() => {
        if (!myId) return; // Wait for session

        const fetchMessages = async () => {
            try {
                const res = await fetch(`/api/messages?groupId=${groupId}`);
                if (res.ok) {
                    const data = await res.json();
                    const formatted = data.map((msg: any) => ({
                        ...msg,
                        createdAt: new Date(msg.createdAt),
                        isOwn: msg.senderId === myId
                    }));
                    setMessages(formatted);
                }
            } catch (error) {
                console.error("Failed to load messages", error);
            }
        };

        fetchMessages();
    }, [groupId, myId]);

    useEffect(() => {
        if (!socket.connected) {
            socket.on("connect", () => {
                console.log("Connected with ID:", socket.id);
            });
            socket.connect();
        }

        socket.emit("join_room", groupId);

    const handleReceiveMessage = (message: any) => {
            console.log("Received:", message);
            // Don't add if it's our own message (we added it optimistically) or if we don't have ID yet
            if (!myId || message.senderId === myId) return;

            setMessages((prev) => [...prev, {
                ...message,
                createdAt: new Date(message.createdAt),
                isOwn: false,
                image: message.image,
                senderImage: message.senderImage
            }]);
        };

        socket.on("receive_message", handleReceiveMessage);

        return () => {
            socket.off("receive_message", handleReceiveMessage);
        };
    }, [groupId, myId]); // Added myId to dependency array for correctness

    const handleSendMessage = (content: string, imageUrl?: string) => {
        const newMessage: Message = {
            id: Date.now().toString(),
            content,
            senderId: myId,
            senderName: myName || "Unknown",
            senderImage: myImage,
            createdAt: new Date(),
            isOwn: true,
            image: imageUrl
        }
        
        socket.emit("send_message", { ...newMessage, groupId });
        setMessages((prev) => [...prev, newMessage]);
    }

    const handleSearch = async (e: React.FormEvent) => {
        e.preventDefault()
        if (!searchQuery.trim()) return

        setIsSearching(true)
        try {
            const res = await fetch(`/api/messages/search?groupId=${groupId}&q=${encodeURIComponent(searchQuery)}`)
            if (res.ok) {
                const data = await res.json()
                setSearchResults(data.map((msg: any) => ({
                    ...msg,
                    createdAt: new Date(msg.createdAt),
                    isOwn: msg.senderId === myId
                })))
            }
        } catch (error) {
            console.error("Search failed:", error)
        } finally {
            setIsSearching(false)
        }
    }

    useEffect(() => {
        if (scrollRef.current) {
            scrollRef.current.scrollTop = scrollRef.current.scrollHeight
        }
    }, [messages])

    return (
        <div className="flex flex-col h-full bg-black overflow-hidden relative">
            {/* Header */}
            <div className="px-6 py-4 border-b border-primary/80 shrink-0 flex items-center justify-between">
                <h1 className="text-xl font-bold tracking-tighter text-primary uppercase">NODE_CHANNEL: {groupId}</h1>
                <Button 
                    variant="ghost" 
                    size="icon" 
                    onClick={() => setIsSearchOpen(!isSearchOpen)}
                    className="text-primary hover:bg-primary/80"
                >
                    {isSearchOpen ? <X className="h-5 w-5" /> : <Search className="h-5 w-5" />}
                </Button>
            </div>

            <div className="flex-1 relative overflow-hidden flex flex-col">
                {/* Search Overlay */}
                {isSearchOpen && (
                    <div className="absolute inset-x-0 top-0 z-10 bg-black/95 border-b border-primary/80 p-4 animate-in slide-in-from-top duration-200">
                        <form onSubmit={handleSearch} className="flex gap-2 mb-4">
                            <Input 
                                placeholder="SEARCH_LOGS >" 
                                value={searchQuery}
                                onChange={(e) => setSearchQuery(e.target.value)}
                                className="bg-black border-primary/80 text-primary font-mono focus-visible:ring-primary placeholder:text-primary/40"
                                autoFocus
                            />
                            <Button type="submit" disabled={isSearching} className="bg-primary text-black hover:bg-primary/90 font-bold">
                                {isSearching ? <Loader2 className="h-4 w-4 animate-spin" /> : "QUERY"}
                            </Button>
                        </form>

                        <div className="max-h-[300px] overflow-y-auto space-y-3 custom-scrollbar">
                            {searchResults.length > 0 ? (
                                searchResults.map((result) => (
                                    <div 
                                        key={result.id} 
                                        onClick={() => scrollToMessage(result.id)}
                                        className="p-2 border border-primary/80 hover:border-primary rounded transition-colors bg-primary/20 group cursor-pointer active:bg-primary/40"
                                    >
                                        <div className="flex justify-between items-start mb-1">
                                            <span className="text-[10px] font-bold text-primary/80 uppercase tracking-widest">{result.senderName}</span>
                                            <span className="text-[10px] text-primary/40 font-mono italic">{result.createdAt.toLocaleString()}</span>
                                        </div>
                                        <p className="text-sm text-primary/90 font-mono break-words">{result.content}</p>
                                        <div className="mt-1 flex justify-between items-center">
                                            {result.image && (
                                                <span className="text-[9px] text-primary/40 uppercase tracking-tighter">[IMAGE_ATTACHMENT]</span>
                                            )}
                                            <span className="text-[9px] opacity-0 group-hover:opacity-100 text-primary font-bold uppercase transition-opacity tracking-widest">GOTO_MESSAGE &gt;&gt;</span>
                                        </div>
                                    </div>
                                ))
                            ) : searchQuery && !isSearching ? (
                                <p className="text-center py-4 text-primary/40 font-mono text-sm">NO_MATCHING_LOGS_FOUND</p>
                            ) : !searchQuery ? (
                                <p className="text-center py-4 text-primary/40 font-mono text-xs italic uppercase tracking-wider">awaiting_search_parameters...</p>
                            ) : null}
                        </div>
                    </div>
                )}

                {/* Scrolling Area */}
                <div className="flex-1 overflow-y-auto px-6 py-4 min-h-0" ref={scrollRef}>
                    <div className="flex flex-col">
                        {messages.map((msg) => (
                            <MessageBubble
                                key={msg.id}
                                id={`msg-${msg.id}`}
                                content={msg.content}
                                isOwn={msg.isOwn}
                                senderName={msg.senderName}
                                senderImage={msg.senderImage}
                                image={msg.image}
                                timestamp={msg.createdAt.toLocaleTimeString('en-US', { hour: '2-digit', minute: '2-digit' })}
                                isHighlighted={highlightedMessageId === msg.id}
                            />
                        ))}
                    </div>
                </div>
            </div>

            {/* Input - Shrink-0 ensures it stays at the bottom */}
            <div className="shrink-0 border-t border-primary/80">
                <ChatInput onSendMessage={handleSendMessage} />
            </div>
        </div>
    )
}
