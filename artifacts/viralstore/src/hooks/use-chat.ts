import { useState, useEffect, useRef } from "react";
import { useQueryClient } from "@tanstack/react-query";
import { 
  useListOpenrouterConversations, 
  useCreateOpenrouterConversation,
  useGetOpenrouterConversation
} from "@workspace/api-client-react";
import type { OpenrouterMessage } from "@workspace/api-client-react/src/generated/api.schemas";

export function useAIChat() {
  const queryClient = useQueryClient();
  const [activeConversationId, setActiveConversationId] = useState<number | null>(null);
  const [messages, setMessages] = useState<OpenrouterMessage[]>([]);
  const [isStreaming, setIsStreaming] = useState(false);
  const [streamingContent, setStreamingContent] = useState("");

  const { data: conversations, isLoading: isLoadingConvs } = useListOpenrouterConversations();
  const createConvMutation = useCreateOpenrouterConversation();

  // Initialize or fetch conversation
  useEffect(() => {
    if (!isLoadingConvs && conversations) {
      if (conversations.length > 0) {
        setActiveConversationId(conversations[0].id);
      } else if (!createConvMutation.isPending) {
        createConvMutation.mutate({ data: { title: "Coach ViralStore" } }, {
          onSuccess: (newConv) => setActiveConversationId(newConv.id)
        });
      }
    }
  }, [conversations, isLoadingConvs]);

  // Load history when active conv changes
  const { data: convData } = useGetOpenrouterConversation(activeConversationId as number, {
    query: { enabled: !!activeConversationId }
  });

  useEffect(() => {
    if (convData?.messages) {
      setMessages(convData.messages);
    }
  }, [convData]);

  const sendMessage = async (content: string) => {
    if (!activeConversationId || isStreaming) return;

    // Add user message optimistically
    const tempUserMsg: OpenrouterMessage = {
      id: Date.now(),
      conversationId: activeConversationId,
      role: "user",
      content,
      createdAt: new Date().toISOString()
    };
    
    setMessages(prev => [...prev, tempUserMsg]);
    setIsStreaming(true);
    setStreamingContent("");

    try {
      const token = localStorage.getItem("viralstore_token");
      const res = await fetch(`/api/openrouter/conversations/${activeConversationId}/messages`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          ...(token ? { "Authorization": `Bearer ${token}` } : {})
        },
        body: JSON.stringify({ content })
      });

      if (!res.ok) throw new Error("Failed to send message");
      
      const reader = res.body?.getReader();
      const decoder = new TextDecoder();
      
      if (!reader) throw new Error("No reader");

      let currentStreamText = "";

      while (true) {
        const { done, value } = await reader.read();
        if (done) break;
        
        const chunk = decoder.decode(value);
        const lines = chunk.split("\n\n");
        
        for (const line of lines) {
          if (line.startsWith("data: ")) {
            const dataStr = line.slice(6);
            if (!dataStr) continue;
            
            try {
              const data = JSON.parse(dataStr);
              if (data.done) {
                // Done streaming
                queryClient.invalidateQueries({ queryKey: [`/api/openrouter/conversations/${activeConversationId}`] });
                break;
              } else if (data.content) {
                currentStreamText += data.content;
                setStreamingContent(currentStreamText);
              }
            } catch (e) {
              console.error("Failed to parse SSE chunk", e);
            }
          }
        }
      }
    } catch (err) {
      console.error("Chat error:", err);
    } finally {
      setIsStreaming(false);
      setStreamingContent("");
    }
  };

  const reset = () => {
    setMessages([]);
    setStreamingContent("");
    setIsStreaming(false);
    // Create a fresh conversation
    createConvMutation.mutate({ data: { title: "Coach ViralStore" } }, {
      onSuccess: (newConv) => setActiveConversationId(newConv.id)
    });
  };

  return {
    messages,
    isStreaming,
    streamingContent,
    sendMessage,
    isReady: !!activeConversationId,
    reset,
  };
}
