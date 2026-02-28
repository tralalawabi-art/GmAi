import { Sparkles, Plane, Atom, Code } from "lucide-react";
import { Card } from "@/components/ui/card";

interface WelcomeScreenProps {
  onSuggestion: (text: string) => void;
}

const suggestions = [
  { icon: Plane, label: "Travel", prompt: "Plan a 5-day trip to Tokyo with must-see attractions and food recommendations" },
  { icon: Atom, label: "Physics", prompt: "Explain quantum entanglement in simple terms with real-world analogies" },
  { icon: Code, label: "Coding", prompt: "Write a React hook for infinite scroll with intersection observer" },
];

export function WelcomeScreen({ onSuggestion }: WelcomeScreenProps) {
  return (
    <div className="flex flex-1 flex-col items-center justify-center px-4">
      <div className="flex items-center gap-3 mb-2">
        <div className="h-12 w-12 rounded-xl bg-primary flex items-center justify-center">
          <Sparkles className="h-6 w-6 text-primary-foreground" />
        </div>
      </div>
      <h1 className="text-2xl font-bold text-foreground mb-1">Fmc AI</h1>
      <p className="text-muted-foreground text-sm mb-8">How can I help you today?</p>

      <div className="grid grid-cols-1 sm:grid-cols-3 gap-3 max-w-2xl w-full">
        {suggestions.map((s) => (
          <Card
            key={s.label}
            className="glass-subtle p-4 cursor-pointer hover:bg-accent/50 transition-colors group"
            onClick={() => onSuggestion(s.prompt)}
          >
            <s.icon className="h-5 w-5 text-muted-foreground group-hover:text-foreground mb-2 transition-colors" />
            <p className="text-sm font-medium text-foreground">{s.label}</p>
            <p className="text-xs text-muted-foreground mt-1 line-clamp-2">{s.prompt}</p>
          </Card>
        ))}
      </div>
    </div>
  );
}
