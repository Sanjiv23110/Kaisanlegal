import { MessageCircle } from "lucide-react";
import { useNavigate } from "react-router-dom";
import { Button } from "./ui/button";

export function FloatingAIButton() {
  const navigate = useNavigate();

  return (
    <Button
      onClick={() => navigate("/chatbot")}
      size="lg"
      className="fixed bottom-6 right-6 h-14 w-14 rounded-full shadow-lg hover:shadow-xl transition-all duration-200 z-50 p-0"
      aria-label="Open AI Legal Assistant"
    >
      <MessageCircle size={24} />
    </Button>
  );
}
