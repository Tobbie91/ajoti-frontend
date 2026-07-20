import { useChat as useChatShared } from '@ajoti/shared'
import { getChatBaseUrl, getAccessToken, getChatMessages, type ChatMessage } from '@/utils/api'

export function useChat(circleId: string | null) {
  return useChatShared<ChatMessage>(circleId, {
    chatBaseUrl: getChatBaseUrl(),
    getAccessToken,
    fetchMessages: getChatMessages,
  })
}
