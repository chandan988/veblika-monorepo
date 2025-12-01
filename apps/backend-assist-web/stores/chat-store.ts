import { create } from 'zustand';
import { devtools } from 'zustand/middleware';

export interface Message {
  _id: string;
  conversationId: string;
  sender: {
    id: string;
    type: 'visitor' | 'agent';
    name?: string;
  };
  content: string;
  timestamp: Date;
  status?: 'sending' | 'sent' | 'failed';
}

interface ChatStore {
  // Message state by conversation
  messagesByConversation: Record<string, Message[]>;
  
  // Actions
  addMessage: (conversationId: string, message: Message) => void;
  addMessages: (conversationId: string, messages: Message[]) => void;
  updateMessage: (conversationId: string, messageId: string, updates: Partial<Message>) => void;
  clearMessages: (conversationId: string) => void;
  
  // Getters
  getMessages: (conversationId: string) => Message[];
}

export const useChatStore = create<ChatStore>()(
  devtools(
    (set, get) => ({
      messagesByConversation: {},

      addMessage: (conversationId, message) => {
        set((state) => {
          const existing = state.messagesByConversation[conversationId] || [];
          
          // Deduplication: Check if message with same _id already exists
          const isDuplicate = existing.some((m) => m._id === message._id);
          if (isDuplicate) {
            return state;
          }

          return {
            messagesByConversation: {
              ...state.messagesByConversation,
              [conversationId]: [...existing, message],
            },
          };
        });
      },

      addMessages: (conversationId, messages) => {
        set((state) => {
          const existing = state.messagesByConversation[conversationId] || [];
          const existingIds = new Set(existing.map((m) => m._id));
          
          // Only add messages that don't already exist
          const newMessages = messages.filter((m) => !existingIds.has(m._id));
          
          if (newMessages.length === 0) {
            return state;
          }

          return {
            messagesByConversation: {
              ...state.messagesByConversation,
              [conversationId]: [...existing, ...newMessages],
            },
          };
        });
      },

      updateMessage: (conversationId, messageId, updates) => {
        set((state) => {
          const existing = state.messagesByConversation[conversationId];
          if (!existing) return state;

          const updatedMessages = existing.map((msg) =>
            msg._id === messageId ? { ...msg, ...updates } : msg
          );

          return {
            messagesByConversation: {
              ...state.messagesByConversation,
              [conversationId]: updatedMessages,
            },
          };
        });
      },

      clearMessages: (conversationId) => {
        set((state) => {
          // eslint-disable-next-line @typescript-eslint/no-unused-vars
          const { [conversationId]: _, ...rest } = state.messagesByConversation;
          return { messagesByConversation: rest };
        });
      },

      getMessages: (conversationId) => {
        return get().messagesByConversation[conversationId] || [];
      },
    }),
    { name: 'ChatStore' }
  )
);
