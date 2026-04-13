import { useState, useRef, useEffect } from "react";
import { Send, Scale, AlertCircle, FileText, X } from "lucide-react";
import { Card } from "./ui/card";
import { Button } from "./ui/button";
import { Input } from "./ui/input";
import { Alert, AlertDescription } from "./ui/alert";
import { api } from "../lib/api";
import { useLegal } from "../context/LegalContext";
import type { ScannedDocContext } from "../context/LegalContext";

interface ChatMessage {
  sender: 'user' | 'bot';
  message: string;
}

const GENERAL_WELCOME =
  "Hello! I'm your AI Legal Assistant. I can help you understand Indian Law, the Constitution, and BNS using the legal database. Ask me any legal question.";

const docWelcome = (doc: ScannedDocContext) =>
  `Hello! I've loaded **"${doc.fileName}"** into context. I can now answer questions about this specific document alongside the Indian Constitution and BNS. What would you like to know?`;

const SESSION_KEY = 'legalguide_doc_context';

/** Always reads the CURRENT doc from sessionStorage — bypasses all React closures */
function getCurrentDocFromSession(): ScannedDocContext | null {
  try {
    const raw = sessionStorage.getItem(SESSION_KEY);
    return raw ? JSON.parse(raw) : null;
  } catch {
    return null;
  }
}

/** Builds the context string directly from sessionStorage — 100% fresh every call */
function buildDocumentContext(): string | undefined {
  const doc = getCurrentDocFromSession();
  if (!doc) return undefined;

  const redFlagList =
    doc.redFlags.length > 0
      ? doc.redFlags.map((f) => `• ${f}`).join('\n')
      : 'None identified';

  return (
    `You are now discussing the following document: "${doc.fileName}"\n\n` +
    `DOCUMENT SUMMARY:\n${doc.summary}\n\n` +
    `RED FLAGS IDENTIFIED:\n${redFlagList}\n\n` +
    `LEGAL COMPLIANCE REPORT:\n${doc.complianceReport}\n\n` +
    `Answer user questions based on this document AND the Indian Constitution / BNS. ` +
    `If the user asks something unrelated to this document, you may still answer using the legal database.`
  );
}

export function ChatbotLawyer() {
  const { scannedDoc, clearScannedDoc } = useLegal();

  // Initialise messages based on whether a doc is loaded right now
  const [messages, setMessages] = useState<ChatMessage[]>(() => [
    { sender: 'bot', message: scannedDoc ? docWelcome(scannedDoc) : GENERAL_WELCOME }
  ]);
  const [inputMessage, setInputMessage] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const messagesEndRef = useRef<HTMLDivElement>(null);

  // When scannedDoc changes (set or cleared), reset the conversation
  const prevDocIdRef = useRef<string | null | undefined>(undefined);
  useEffect(() => {
    const newId = scannedDoc?.fileName ?? null;
    if (prevDocIdRef.current === undefined) {
      prevDocIdRef.current = newId; // first mount — skip reset
      return;
    }
    if (prevDocIdRef.current !== newId) {
      prevDocIdRef.current = newId;
      setMessages([{
        sender: 'bot',
        message: scannedDoc ? docWelcome(scannedDoc) : GENERAL_WELCOME
      }]);
    }
  }, [scannedDoc]);

  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [messages, isLoading]);

  const handleSendMessage = async (messageText?: string) => {
    const textToSend = messageText || inputMessage;
    if (!textToSend.trim() || isLoading) return;

    setMessages((prev) => [...prev, { sender: 'user', message: textToSend }]);
    setInputMessage('');
    setIsLoading(true);

    try {
      // ── NUCLEAR FIX: read context directly from sessionStorage at call time ──
      // This is 100% immune to React state batching or stale closures.
      const ctx = buildDocumentContext();
      const response = await api.legalQuery(textToSend, ctx);
      setMessages((prev) => [...prev, { sender: 'bot', message: response.answer }]);
    } catch (err: any) {
      setMessages((prev) => [
        ...prev,
        {
          sender: 'bot',
          message: `⚠️ Error: ${err.message || 'Failed to get an answer. Please try again.'}`
        }
      ]);
    } finally {
      setIsLoading(false);
    }
  };

  const handleClearContext = () => {
    // clearScannedDoc() writes null to sessionStorage first (synchronous),
    // THEN updates React state. buildDocumentContext() reads sessionStorage
    // directly, so the very next API call will read null immediately.
    clearScannedDoc();
    setMessages([
      {
        sender: 'bot',
        message:
          '✅ Document context cleared. I\'m back to general Indian Constitution & BNS mode. Ask me any legal question.'
      }
    ]);
  };

  const formatText = (text: string) => {
    if (!text) return null;
    const cleaned = text.replace(/#+\s*/g, '').trim();
    const parts = cleaned.split(/(\*\*.*?\*\*)/g);
    return parts.map((part, index) => {
      if (part.startsWith('**') && part.endsWith('**')) {
        return (
          <strong key={index} className="font-bold">
            {part.slice(2, -2)}
          </strong>
        );
      }
      return <span key={index}>{part}</span>;
    });
  };

  return (
    <div className="pt-20 min-h-screen bg-background pb-12">
      {/* Header */}
      <div className="bg-gradient-to-r from-purple-600 to-indigo-700 text-white">
        <div className="max-w-7xl mx-auto px-6 py-12">
          <div className="text-center max-w-3xl mx-auto">
            <div className="flex items-center justify-center mb-4">
              <Scale size={48} />
            </div>
            <h1 className="text-4xl font-bold mb-3">AI Legal Assistant</h1>
            <p className="text-lg text-purple-100">
              Get personalized legal guidance using Indian Law
            </p>
          </div>
        </div>
      </div>

      <div className="max-w-5xl mx-auto px-6 mt-8">
        {/* Document Context Banner */}
        {scannedDoc && (
          <div className="mb-4 flex items-center justify-between gap-3 p-4 bg-indigo-50 border border-indigo-200 rounded-xl shadow-sm">
            <div className="flex items-center gap-3">
              <FileText size={20} className="text-indigo-600 shrink-0" />
              <div>
                <p className="text-sm font-semibold text-indigo-900">
                  Document Context Active
                </p>
                <p className="text-xs text-indigo-700 truncate max-w-sm">
                  "{scannedDoc.fileName}" — AI is answering in the context of this document
                </p>
              </div>
            </div>
            <Button
              variant="outline"
              size="sm"
              onClick={handleClearContext}
              className="border-indigo-300 text-indigo-700 hover:bg-indigo-100 shrink-0 gap-1"
            >
              <X size={14} />
              Clear Document Context
            </Button>
          </div>
        )}

        <Card className="overflow-hidden shadow-lg flex flex-col h-[600px]">
          {/* Chat Header */}
          <div className="bg-gradient-to-r from-purple-500 to-indigo-600 text-white p-6 border-b shrink-0">
            <div className="flex items-center gap-3">
              <div className="p-3 bg-white/10 rounded-lg">
                <Scale size={24} />
              </div>
              <div>
                <h2 className="text-xl font-semibold">Your Legal AI Assistant</h2>
                <p className="text-sm text-purple-100">
                  {scannedDoc
                    ? `📄 Discussing: "${scannedDoc.fileName}"`
                    : 'Ask questions grounded in the Constitution & BNS'}
                </p>
              </div>
            </div>
          </div>

          {/* Messages */}
          <div className="bg-slate-50 p-6 overflow-y-auto flex-1">
            <div className="space-y-6 max-w-4xl mx-auto">
              {messages.map((message, index) => (
                <div
                  key={index}
                  className={`flex ${message.sender === 'user' ? 'justify-end' : 'justify-start'}`}
                >
                  <div
                    className={`max-w-[80%] p-4 rounded-xl shadow-sm ${
                      message.sender === 'user'
                        ? 'bg-primary text-primary-foreground rounded-tr-none'
                        : 'bg-white border rounded-tl-none text-slate-800'
                    }`}
                  >
                    <div className="text-sm pb-1 whitespace-pre-wrap leading-relaxed">
                      {formatText(message.message)}
                    </div>
                  </div>
                </div>
              ))}
              {isLoading && (
                <div className="flex justify-start">
                  <div className="bg-white border p-4 rounded-xl rounded-tl-none shadow-sm flex items-center gap-3">
                    <div className="flex gap-1">
                      <span className="w-2 h-2 rounded-full bg-slate-400 animate-bounce"></span>
                      <span className="w-2 h-2 rounded-full bg-slate-400 animate-bounce delay-100"></span>
                      <span className="w-2 h-2 rounded-full bg-slate-400 animate-bounce delay-200"></span>
                    </div>
                    <span className="text-sm text-slate-500">Searching legal database...</span>
                  </div>
                </div>
              )}
              <div ref={messagesEndRef} />
            </div>
          </div>

          {/* Input */}
          <div className="p-6 border-t bg-white shrink-0">
            <div className="flex gap-3 max-w-4xl mx-auto relative">
              {messages.length === 1 && !isLoading && !scannedDoc && (
                <div className="absolute -top-16 left-0 right-0 flex gap-2 flex-wrap justify-center text-sm">
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={() => handleSendMessage('What are my fundamental rights?')}
                    className="bg-white shadow-sm"
                  >
                    Fundamental Rights
                  </Button>
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={() => handleSendMessage('Explain Consumer Protection Act')}
                    className="bg-white shadow-sm"
                  >
                    Consumer Protection
                  </Button>
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={() => handleSendMessage('Penalty for cyber crime under BNS')}
                    className="bg-white shadow-sm"
                  >
                    Cyber Crime (BNS)
                  </Button>
                </div>
              )}
              <Input
                value={inputMessage}
                onChange={(e) => setInputMessage(e.target.value)}
                placeholder={
                  scannedDoc
                    ? `Ask about "${scannedDoc.fileName}"...`
                    : 'Type your legal question here...'
                }
                onKeyPress={(e) => {
                  if (e.key === 'Enter') {
                    e.preventDefault();
                    handleSendMessage();
                  }
                }}
                disabled={isLoading}
                className="flex-1 h-12 text-base"
              />
              <Button
                onClick={() => handleSendMessage()}
                size="lg"
                className="px-6 h-12"
                disabled={isLoading || !inputMessage.trim()}
              >
                <Send size={20} />
              </Button>
            </div>
          </div>
        </Card>

        {/* Disclaimer */}
        <Alert className="mt-6">
          <AlertCircle className="h-5 w-5 text-indigo-600" />
          <AlertDescription className="text-slate-600">
            <strong>Legal Disclaimer:</strong> This AI generates answers based on retrieved legal
            statutes. It provides general information only, not formal legal advice. Always consult
            a qualified attorney for specific legal matters.
          </AlertDescription>
        </Alert>
      </div>
    </div>
  );
}