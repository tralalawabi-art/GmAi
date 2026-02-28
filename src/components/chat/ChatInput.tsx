import { useState, useRef, useCallback } from "react";
import { Send, Square, Image, X, Globe } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { MODEL_INFO, type ModelId } from "@/lib/chat-store";
import { cn } from "@/lib/utils";

interface ChatInputProps {
  model: ModelId;
  webSearch: boolean;
  isLoading: boolean;
  onModelChange: (m: ModelId) => void;
  onWebSearchChange: (v: boolean) => void;
  onSend: (content: string, imageBase64?: string) => void;
  onStop: () => void;
}

export function ChatInput({
  model,
  webSearch,
  isLoading,
  onModelChange,
  onWebSearchChange,
  onSend,
  onStop,
}: ChatInputProps) {
  const [input, setInput] = useState("");
  const [imagePreview, setImagePreview] = useState<string | null>(null);
  const [isDragging, setIsDragging] = useState(false);
  const fileInputRef = useRef<HTMLInputElement>(null);
  const textareaRef = useRef<HTMLTextAreaElement>(null);

  const handleSubmit = () => {
    const trimmed = input.trim();
    if (!trimmed && !imagePreview) return;
    onSend(trimmed, imagePreview || undefined);
    setInput("");
    setImagePreview(null);
  };

  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === "Enter" && !e.shiftKey) {
      e.preventDefault();
      handleSubmit();
    }
  };

  const handleFileSelect = useCallback((file: File) => {
    if (!file.type.startsWith("image/")) return;
    const reader = new FileReader();
    reader.onload = (e) => setImagePreview(e.target?.result as string);
    reader.readAsDataURL(file);
  }, []);

  const handleDrop = useCallback(
    (e: React.DragEvent) => {
      e.preventDefault();
      setIsDragging(false);
      const file = e.dataTransfer.files[0];
      if (file) handleFileSelect(file);
    },
    [handleFileSelect]
  );

  return (
    <div className="w-full max-w-3xl mx-auto px-4 pb-4">
      <div
        className={cn(
          "glass rounded-2xl p-3 transition-all",
          isDragging && "ring-2 ring-primary/50"
        )}
        onDragOver={(e) => {
          e.preventDefault();
          if (model === "gemini") setIsDragging(true);
        }}
        onDragLeave={() => setIsDragging(false)}
        onDrop={model === "gemini" ? handleDrop : undefined}
      >
        {/* Image Preview */}
        {imagePreview && (
          <div className="relative inline-block mb-2">
            <img src={imagePreview} alt="Preview" className="h-20 rounded-lg" />
            <Button
              variant="secondary"
              size="icon"
              className="absolute -top-2 -right-2 h-5 w-5 rounded-full"
              onClick={() => setImagePreview(null)}
            >
              <X className="h-3 w-3" />
            </Button>
          </div>
        )}

        {/* Drag overlay */}
        {isDragging && model === "gemini" && (
          <div className="flex items-center justify-center py-6 text-muted-foreground text-sm">
            <Image className="h-5 w-5 mr-2" />
            Drop image here
          </div>
        )}

        {/* Text area */}
        {!isDragging && (
          <Textarea
            ref={textareaRef}
            value={input}
            onChange={(e) => setInput(e.target.value)}
            onKeyDown={handleKeyDown}
            placeholder="Type your message..."
            className="min-h-[44px] max-h-[160px] resize-none border-0 bg-transparent p-0 focus-visible:ring-0 focus-visible:ring-offset-0 text-sm"
            rows={1}
          />
        )}

        {/* Bottom bar */}
        <div className="flex items-center justify-between mt-2 gap-2">
          <div className="flex items-center gap-2">
            {/* Model selector */}
            <Select value={model} onValueChange={(v) => onModelChange(v as ModelId)}>
              <SelectTrigger className="h-8 w-auto gap-1 text-xs border-border/50 glass-subtle">
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                {(Object.keys(MODEL_INFO) as ModelId[]).map((id) => (
                  <SelectItem key={id} value={id}>
                    <span className="flex items-center gap-1.5">
                      <span>{MODEL_INFO[id].icon}</span>
                      <span>{MODEL_INFO[id].name}</span>
                    </span>
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>

            {/* Web search toggle (Quillbot only) */}
            {model === "quillbot" && (
              <Button
                variant={webSearch ? "default" : "outline"}
                size="sm"
                className="h-8 text-xs gap-1"
                onClick={() => onWebSearchChange(!webSearch)}
              >
                <Globe className="h-3 w-3" />
                Web
              </Button>
            )}

            {/* Image upload (Gemini only) */}
            {model === "gemini" && (
              <>
                <Button
                  variant="outline"
                  size="sm"
                  className="h-8 text-xs gap-1 border-border/50"
                  onClick={() => fileInputRef.current?.click()}
                >
                  <Image className="h-3 w-3" />
                  Image
                </Button>
                <input
                  ref={fileInputRef}
                  type="file"
                  accept="image/*"
                  className="hidden"
                  onChange={(e) => {
                    const file = e.target.files?.[0];
                    if (file) handleFileSelect(file);
                    e.target.value = "";
                  }}
                />
              </>
            )}
          </div>

          {/* Send / Stop */}
          {isLoading ? (
            <Button size="icon" className="h-8 w-8 rounded-full" onClick={onStop}>
              <Square className="h-3 w-3" />
            </Button>
          ) : (
            <Button
              size="icon"
              className="h-8 w-8 rounded-full"
              onClick={handleSubmit}
              disabled={!input.trim() && !imagePreview}
            >
              <Send className="h-3 w-3" />
            </Button>
          )}
        </div>
      </div>
    </div>
  );
}
