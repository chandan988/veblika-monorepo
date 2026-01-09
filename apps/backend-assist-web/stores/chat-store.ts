import { create } from 'zustand';
import { devtools } from 'zustand/middleware';
import { type Priority } from '@/types/chat';

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

export interface Conversation {
  _id: string;
  orgId: string;
  integrationId: string;
  contactId: any;
  channel: string;
  status: 'open' | 'pending' | 'closed';
  priority: Priority;
  lastMessageAt: string;
  lastMessagePreview: string;
  tags: string[];
  assignedMemberId?: string | null;
  sourceMetadata?: any;
}

export interface PaginationInfo {
  total: number;
  page: number;
  limit: number;
  totalPages: number;
}

interface ChatStore {
  // Conversation state
  conversations: Conversation[];
  conversationsLoaded: boolean;
  paginationInfo: PaginationInfo | null;
  activeChannel: string | null; // Track active channel
  
  // Message state by conversation
  messagesByConversation: Record<string, Message[]>;
  
  // Conversation Actions
  setConversations: (conversations: Conversation[], channel: string) => void;
  appendConversations: (conversations: Conversation[]) => void;
  addConversation: (conversation: Conversation) => void;
  updateConversation: (conversationId: string, updates: Partial<Conversation>) => void;
  removeConversation: (conversationId: string) => void;
  updateConversationMessage: (conversationId: string, messagePreview: string, timestamp: string) => void;
  setPaginationInfo: (pagination: PaginationInfo) => void;
  setActiveChannel: (channel: string) => void;
  clearConversations: () => void;
  
  // Message Actions
  addMessage: (conversationId: string, message: Message) => void;
  addMessages: (conversationId: string, messages: Message[]) => void;
  updateMessage: (conversationId: string, messageId: string, updates: Partial<Message>) => void;
  clearMessages: (conversationId: string) => void;
  
  // Getters
  getMessages: (conversationId: string) => Message[];
  getConversations: (channel?: string) => Conversation[];
  getConversation: (conversationId: string) => Conversation | undefined;
}

export const useChatStore = create<ChatStore>()(
  devtools(
    (set, get) => ({
      // Conversation state
      conversations: [],
      conversationsLoaded: false,
      paginationInfo: null,
      activeChannel: null,
      
      // Message state
      messagesByConversation: {},

      // Conversation actions
      setConversations: (conversations, channel) => {
        set({ conversations, conversationsLoaded: true, activeChannel: channel });
      },

      setActiveChannel: (channel) => {
        set({ activeChannel: channel });
      },

      clearConversations: () => {
        set({ conversations: [], conversationsLoaded: false, paginationInfo: null });
      },

      appendConversations: (newConversations) => {
        set((state) => {
          // Get existing IDs to avoid duplicates
          const existingIds = new Set(state.conversations.map((c) => c._id));
          const uniqueNewConversations = newConversations.filter(
            (c) => !existingIds.has(c._id)
          );
          
          return {
            conversations: [...state.conversations, ...uniqueNewConversations],
          };
        });
      },

      setPaginationInfo: (pagination) => {
        set({ paginationInfo: pagination });
      },

      addConversation: (conversation) => {
        set((state) => {
          // Check if conversation already exists
          const exists = state.conversations.some((c) => c._id === conversation._id);
          if (exists) {
            return state;
          }
          
          // Add new conversation at the beginning
          return {
            conversations: [conversation, ...state.conversations],
          };
        });
      },

      updateConversation: (conversationId, updates) => {
        set((state) => ({
          conversations: state.conversations.map((conv) =>
            conv._id === conversationId ? { ...conv, ...updates } : conv
          ),
        }));
      },

      removeConversation: (conversationId) => {
        set((state) => ({
          conversations: state.conversations.filter((c) => c._id !== conversationId),
        }));
      },

      updateConversationMessage: (conversationId, messagePreview, timestamp) => {
        set((state) => {
          const updatedConversations = state.conversations.map((conv) => {
            if (conv._id === conversationId) {
              return {
                ...conv,
                lastMessagePreview: messagePreview,
                lastMessageAt: timestamp,
              };
            }
            return conv;
          });

          // Sort by lastMessageAt (newest first)
          updatedConversations.sort(
            (a, b) => new Date(b.lastMessageAt).getTime() - new Date(a.lastMessageAt).getTime()
          );

          return { conversations: updatedConversations };
        });
      },

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

      getConversations: (channel?: string) => {
        const conversations = get().conversations;
        if (!channel) return conversations;
        return conversations.filter((c) => c.channel === channel);
      },

      getConversation: (conversationId) => {
        return get().conversations.find((c) => c._id === conversationId);
      },
    }),
    { name: 'ChatStore' }
  )
);
