import { useChat as useChatShared } from '@ajoti/shared'
import { getChatBaseUrl, getChatMessages, type ChatMessage } from '@/utils/api'

export function useChat(circleId: string | null) {
  return useChatShared<ChatMessage>(circleId, {
    chatBaseUrl: getChatBaseUrl(),
    fetchMessages: getChatMessages,
  })
}
