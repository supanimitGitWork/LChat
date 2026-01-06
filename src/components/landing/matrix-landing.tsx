"use client"

import { useEffect, useRef } from "react"
import Link from "next/link"
import { Shield, Lock, Terminal, ArrowRight } from "lucide-react"

export default function MatrixLanding() {
  const canvasRef = useRef<HTMLCanvasElement>(null)

  useEffect(() => {
    const canvas = canvasRef.current
    if (!canvas) return

    const ctx = canvas.getContext("2d")
    if (!ctx) return

    canvas.width = window.innerWidth
    canvas.height = window.innerHeight

    const characters = "ABCDEFGHIJKLMNOPQRSTUVWXYZ0123456789$+-*/=%\"'#&_(),.;:?!"
    const fontSize = 16
    const columns = Math.floor(canvas.width / fontSize)
    const drops: number[] = []

    for (let i = 0; i < columns; i++) {
      drops[i] = Math.random() * -100
    }

    const draw = () => {
      ctx.fillStyle = "rgba(0, 0, 0, 0.05)"
      ctx.fillRect(0, 0, canvas.width, canvas.height)

      ctx.fillStyle = "#08CB00"
      ctx.font = `${fontSize}px monospace`

      for (let i = 0; i < drops.length; i++) {
        const text = characters.charAt(Math.floor(Math.random() * characters.length))
        ctx.fillText(text, i * fontSize, drops[i] * fontSize)

        if (drops[i] * fontSize > canvas.height && Math.random() > 0.975) {
          drops[i] = 0
        }
        drops[i]++
      }
    }

    const interval = setInterval(draw, 33)

    const handleResize = () => {
      canvas.width = window.innerWidth
      canvas.height = window.innerHeight
    }

    window.addEventListener("resize", handleResize)

    return () => {
      clearInterval(interval)
      window.removeEventListener("resize", handleResize)
    }
  }, [])

  return (
    <div className="relative min-h-screen w-full bg-black overflow-hidden flex flex-col items-center justify-center font-mono">
      <canvas ref={canvasRef} className="absolute inset-0 opacity-40" />
      
      {/* HUD Overlays */}
      <div className="absolute top-0 left-0 w-full p-6 flex justify-between items-start pointer-events-none z-10">
        <div className="border border-primary/40 bg-black/60 p-3 backdrop-blur-sm animate-pulse">
            <span className="text-[10px] text-primary tracking-[0.2em] font-bold uppercase">SYSTEM_STATE: OPERATIONAL</span>
        </div>
        <div className="text-right border border-primary/40 bg-black/60 p-3 backdrop-blur-sm">
            <span className="text-[10px] text-primary tracking-[0.2em] font-bold uppercase">SEC_LEVEL: CLASS_A_NETWORK</span>
        </div>
      </div>

      {/* Main Content */}
      <div className="relative z-10 flex flex-col items-center max-w-4xl px-6 text-center">
        <div className="mb-4 inline-flex items-center gap-2 border border-primary bg-black/40 px-3 py-1 text-primary shadow-[0_0_15px_rgba(8,203,0,0.3)]">
            <Shield className="h-4 w-4" />
            <span className="text-xs font-bold tracking-widest uppercase">identity_layer_active</span>
        </div>

        <h1 className="text-6xl md:text-8xl font-black text-primary mb-6 tracking-tighter filter drop-shadow-[0_0_20px_rgba(8,203,0,0.5)]">
            LCHAT<span className="animate-pulse">_</span>
        </h1>

        <p className="text-primary/90 text-lg md:text-xl max-w-2xl mb-12 uppercase tracking-wide leading-relaxed bg-black/60 backdrop-blur-sm inline-block p-4 border border-primary/20">
            Secure Decentralized Intelligence Node. <br/>
            Establish Connection to Enter the Network.
        </p>

        <div className="flex flex-col sm:flex-row gap-6 w-full max-w-md">
            <Link 
                href="/login" 
                className="flex-1 bg-primary text-black font-black py-4 px-8 text-lg hover:bg-black hover:text-primary transition-all duration-300 border-2 border-primary group relative overflow-hidden text-center"
            >
                <div className="absolute inset-0 bg-primary/20 translate-y-full group-hover:translate-y-0 transition-transform duration-300 pointer-events-none" />
                <span className="relative flex items-center justify-center gap-2">
                    LOGIN_LOGON <ArrowRight className="h-5 w-5 group-hover:translate-x-1 transition-transform" />
                </span>
            </Link>
            <Link 
                href="/register" 
                className="flex-1 bg-black text-primary font-black py-4 px-8 text-lg hover:bg-primary hover:text-black transition-all duration-300 border-2 border-primary group relative overflow-hidden text-center"
            >
                <div className="absolute inset-x-0 bottom-0 h-1 bg-primary animate-pulse" />
                <span className="relative flex items-center justify-center gap-2">
                    INIT_REGISTER <Lock className="h-5 w-5" />
                </span>
            </Link>
        </div>

        <div className="mt-16 text-primary/40 text-[10px] uppercase tracking-[0.5em] font-bold">
            &lt; decrypting_sector_log ... DONE &gt;
        </div>
      </div>

      {/* Bottom HUD */}
      <div className="absolute bottom-0 w-full p-8 flex justify-center items-center pointer-events-none">
        <div className="flex gap-12 items-center opacity-40">
            <div className="flex items-center gap-2">
                <Terminal className="h-4 w-4" />
                <span className="text-[10px] font-bold">NODE_STREAM</span>
            </div>
            <div className="h-px w-24 bg-primary/40" />
            <span className="text-[10px] font-bold tracking-[0.3em]">GATE_ID: 786-DA522</span>
            <div className="h-px w-24 bg-primary/40" />
            <span className="text-[10px] font-bold">VER: 1.0.9</span>
        </div>
      </div>
    </div>
  )
}
