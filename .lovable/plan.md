

# Fmc AI — Modern AI Chat App

## Overview
A sleek, glassmorphism-styled AI chat application with multi-model support (Quillbot, Gemini 2.5 Flash, and DeepSeek R1), featuring image analysis, conversation memory, and a polished modern UI.

## Design & Theme
- **Glassmorphism UI**: Frosted glass panels, subtle gradients, backdrop blur effects, soft shadows
- **Dark/Light mode** toggle with smooth transitions
- **Plus Jakarta Sans** font for a premium feel
- **Responsive**: Full sidebar on desktop, slide-out drawer on mobile

## Pages & Layout

### 1. Chat Page (Main)
- **Sidebar** (glass-effect): New chat button, conversation history list with delete, dark mode toggle, Fmc AI branding
- **Chat area**: Message bubbles with avatars, markdown rendering (code highlighting, math, tables), typing indicator animation
- **Input bar** (floating glass card):
  - Model selector dropdown (Quillbot, Gemini 2.5 Flash, DeepSeek R1) with icons
  - Web Search toggle chip (for Quillbot model)
  - Image upload button with drag & drop zone (enabled when Gemini is selected)
  - Text input with auto-resize + send button

### 2. Welcome Screen
- Fmc AI logo and greeting
- Suggestion cards (Travel, Physics, Coding) to quick-start a conversation

## Core Features

### Multi-Model Chat
- **Dropdown selector** in the input area to switch between:
  - 🔵 **Quillbot** (existing FmcStore API) — with optional web search
  - 🟢 **Gemini 2.5 Flash** — supports image analysis and conversation memory
  - 🟣 **DeepSeek R1** (SambaNova) — reasoning-focused model
- Each model's responses styled with a subtle color accent

### Image Analysis (Gemini)
- Drag & drop or click to attach images
- Image preview thumbnail before sending
- Gemini analyzes uploaded images and responds with descriptions/insights

### Conversation Memory
- Full conversation history sent with each request for context-aware replies
- Chat history saved to localStorage with titles
- New chat / delete history management in sidebar

### Message Rendering
- Markdown with syntax-highlighted code blocks (highlight.js)
- Copy-to-clipboard button on code blocks
- MathJax for mathematical expressions
- Toast notifications for copy actions

## Backend & Security
- **Lovable Cloud** with Supabase Edge Functions to securely store and use API keys (Gemini, SambaNova, FmcStore)
- API keys will NOT be exposed in frontend code
- Streaming responses for Gemini model for real-time token display
- Error handling with user-friendly toast messages (rate limits, connection errors)

## Data Storage
- **localStorage** for chat history and theme preference (no database needed for MVP)

