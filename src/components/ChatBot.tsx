import { useState, useRef, useEffect } from 'react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardFooter, CardHeader, CardTitle } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { ScrollArea } from '@/components/ui/scroll-area';
import { MessageCircle, X, Send, Bot } from 'lucide-react';
import { cn } from '@/lib/utils';
import { useLocation } from 'react-router-dom';

const GROQ_API_KEY = import.meta.env.VITE_GROQ_API_KEY || "";

type Message = {
  role: 'user' | 'assistant';
  content: string;
};

export function ChatBot() {
  const [isOpen, setIsOpen] = useState(false);
  const [messages, setMessages] = useState<Message[]>([
    { role: 'assistant', content: "Hi! How can I help you today?" }
  ]);
  const [input, setInput] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const scrollRef = useRef<HTMLDivElement>(null);
  const location = useLocation();

  useEffect(() => {
    if (scrollRef.current) {
      const scrollElement = scrollRef.current.querySelector('[data-radix-scroll-area-viewport]');
      if (scrollElement) {
        scrollElement.scrollTop = scrollElement.scrollHeight;
      }
    }
  }, [messages, isLoading]);

  const handleSend = async () => {
    if (!input.trim()) return;

    const userMessage = input.trim();
    setInput('');
    setMessages((prev) => [...prev, { role: 'user', content: userMessage }]);
    setIsLoading(true);

    try {
      const systemPrompt = `You are a helpful support bot for TechConnect, a job board and job matching platform. 
The user is currently on the ${location.pathname} page.
You can guide them on using the site, applying to jobs, generating resumes, or navigating to other pages.
Available pages: /, /dashboard, /jobs, /applications, /my-jobs, /post-job, /notifications, /profile, /job-matching, /resume-center.
Answer concisely. Maintain a friendly and helpful tone.`;

      const response = await fetch('https://api.groq.com/openai/v1/chat/completions', {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${GROQ_API_KEY}`,
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          model: 'llama-3.1-8b-instant',
          messages: [
            { role: 'system', content: systemPrompt },
            ...messages.map(m => ({ role: m.role, content: m.content })),
            { role: 'user', content: userMessage }
          ],
        }),
      });

      const data = await response.json();
      if (data.error) {
        console.error("API Error:", data.error);
        setMessages((prev) => [...prev, { role: 'assistant', content: `Error: ${data.error.message || "Something went wrong"}` }]);
      } else if (data.choices && data.choices[0]) {
        setMessages((prev) => [...prev, { role: 'assistant', content: data.choices[0].message.content }]);
      }
    } catch (error) {
      console.error("Error communicating with Groq:", error);
      setMessages((prev) => [...prev, { role: 'assistant', content: "Sorry, I'm having trouble connecting right now." }]);
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <>
      {isOpen ? (
        <Card className="fixed bottom-6 right-6 w-80 sm:w-96 shadow-2xl z-[100] flex flex-col h-[500px] border-primary/20">
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-3 border-b bg-muted/50">
            <CardTitle className="text-lg font-bold flex items-center gap-2">
              <Bot className="w-5 h-5 text-primary" />
              Support Bot
            </CardTitle>
            <Button variant="ghost" size="icon" onClick={() => setIsOpen(false)} className="h-8 w-8">
              <X className="w-4 h-4" />
            </Button>
          </CardHeader>
          <CardContent className="flex-1 p-0 overflow-hidden relative">
            <ScrollArea className="h-[calc(500px-130px)] w-full" ref={scrollRef}>
              <div className="flex flex-col gap-3 p-4">
                {messages.map((msg, idx) => (
                  <div 
                    key={idx} 
                    className={cn(
                      "flex w-fit max-w-[85%] flex-col gap-2 rounded-2xl px-4 py-2 text-sm", 
                      msg.role === 'user' 
                        ? "ml-auto bg-primary text-primary-foreground rounded-br-sm" 
                        : "bg-muted rounded-bl-sm"
                    )}
                  >
                    {msg.content}
                  </div>
                ))}
                {isLoading && (
                  <div className="flex w-fit max-w-[80%] flex-col gap-2 rounded-2xl px-4 py-2 text-sm bg-muted rounded-bl-sm">
                    <div className="flex gap-1 items-center h-5">
                      <div className="w-2 h-2 bg-foreground/40 rounded-full animate-bounce [animation-delay:-0.3s]"></div>
                      <div className="w-2 h-2 bg-foreground/40 rounded-full animate-bounce [animation-delay:-0.15s]"></div>
                      <div className="w-2 h-2 bg-foreground/40 rounded-full animate-bounce"></div>
                    </div>
                  </div>
                )}
              </div>
            </ScrollArea>
          </CardContent>
          <CardFooter className="p-3 border-t bg-background">
            <form onSubmit={(e) => { e.preventDefault(); handleSend(); }} className="flex w-full items-center space-x-2">
              <Input 
                id="message" 
                placeholder="Type your message..." 
                className="flex-1 focus-visible:ring-1" 
                autoComplete="off"
                value={input}
                onChange={(e) => setInput(e.target.value)}
                disabled={isLoading}
              />
              <Button type="submit" size="icon" disabled={isLoading || !input.trim()} className="h-10 w-10 shrink-0">
                <Send className="w-4 h-4" />
              </Button>
            </form>
          </CardFooter>
        </Card>
      ) : (
        <Button 
          className="fixed bottom-6 right-6 rounded-full w-14 h-14 shadow-xl z-[100] transition-transform hover:scale-105" 
          onClick={() => setIsOpen(true)}
        >
          <MessageCircle className="w-6 h-6" />
        </Button>
      )}
    </>
  );
}
