import { useState } from 'react'
import { useAgentTask } from '../../../hooks/useAgentTask'
import { Button } from '../../ui/button'
import LoadingSpinner from '../../ui/LoadingSpinner'

interface ACChatWidgetProps {
  enterpriseId?: string
}

export function ACChatWidget({ enterpriseId }: ACChatWidgetProps) {
  const [input, setInput] = useState('')
  const [messages, setMessages] = useState<Array<{
    id: string
    type: 'user' | 'agent'
    content: string
    timestamp: Date
  }>>([])

  const { submitTask, isSubmitting, isProcessing, currentTask, error } = useAgentTask({
    enterpriseId,
    onComplete: (response) => {
      const answer = response.response_payload?.answer || 'No response received'
      setMessages(prev => [...prev, {
        id: response.id,
        type: 'agent',
        content: answer,
        timestamp: new Date(response.updated_at)
      }])
      setInput('') // Clear input on success
    },
    onError: (err) => {
      console.error('Agent task failed:', err)
      setMessages(prev => [...prev, {
        id: Date.now().toString(),
        type: 'agent',
        content: `Error: ${err.message}`,
        timestamp: new Date()
      }])
    },
    onStatusChange: (status) => {
      console.log('Task status:', status)
    }
  })

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!input.trim() || isSubmitting || isProcessing) return

    // Add user message to chat
    const userMessage = {
      id: Date.now().toString(),
      type: 'user' as const,
      content: input.trim(),
      timestamp: new Date()
    }
    setMessages(prev => [...prev, userMessage])

    try {
      await submitTask({
        prompt: input.trim(),
        enterprise_id: enterpriseId
      })
    } catch (err) {
      console.error('Failed to submit task:', err)
    }
  }

  return (
    <div className="flex flex-col h-full bg-white rounded-lg shadow-lg border border-gray-200">
      {/* Header */}
      <div className="px-4 py-3 border-b border-gray-200 bg-gray-50 rounded-t-lg">
        <h3 className="text-lg font-semibold text-gray-800">Agent Chat</h3>
        {isProcessing && (
          <div className="text-xs text-gray-500 mt-1 flex items-center gap-2">
            <LoadingSpinner size="sm" />
            Processing...
          </div>
        )}
      </div>

      {/* Messages Area */}
      <div className="flex-1 overflow-y-auto p-4 space-y-4">
        {messages.length === 0 ? (
          <div className="text-center text-gray-500 text-sm py-8">
            Start a conversation with the agent...
          </div>
        ) : (
          messages.map((message) => (
            <div
              key={message.id}
              className={`flex ${message.type === 'user' ? 'justify-end' : 'justify-start'}`}
            >
              <div
                className={`max-w-[80%] rounded-lg px-4 py-2 ${
                  message.type === 'user'
                    ? 'bg-blue-500 text-white'
                    : 'bg-gray-100 text-gray-800'
                }`}
              >
                <div className="text-sm">{message.content}</div>
                <div className={`text-xs mt-1 ${
                  message.type === 'user' ? 'text-blue-100' : 'text-gray-500'
                }`}>
                  {message.timestamp.toLocaleTimeString()}
                </div>
              </div>
            </div>
          ))
        )}

        {/* Show current task response if completed */}
        {currentTask?.status === 'completed' && currentTask.response_payload && 
         !messages.some(m => m.id === currentTask.id) && (
          <div className="flex justify-start">
            <div className="max-w-[80%] rounded-lg px-4 py-2 bg-gray-100 text-gray-800">
              <div className="text-sm">{currentTask.response_payload.answer}</div>
              {currentTask.response_payload.steps && (
                <div className="text-xs mt-2 text-gray-500">
                  Steps: {currentTask.response_payload.steps.join(' → ')}
                </div>
              )}
            </div>
          </div>
        )}
      </div>

      {/* Error Display */}
      {error && (
        <div className="px-4 py-2 bg-red-50 border-t border-red-200">
          <div className="text-sm text-red-600">
            ❌ Error: {error.message}
          </div>
        </div>
      )}

      {/* Input Form */}
      <div className="border-t border-gray-200 p-4">
        <form onSubmit={handleSubmit} className="flex gap-2">
          <input
            type="text"
            value={input}
            onChange={(e) => setInput(e.target.value)}
            placeholder="Type your message..."
            className="flex-1 px-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
            disabled={isSubmitting || isProcessing}
          />
          <Button 
            type="submit" 
            disabled={!input.trim() || isSubmitting || isProcessing}
            className="px-6"
          >
            {isSubmitting || isProcessing ? (
              <span className="flex items-center gap-2">
                <LoadingSpinner size="sm" />
                Sending...
              </span>
            ) : (
              'Send'
            )}
          </Button>
        </form>
      </div>
    </div>
  )
}

