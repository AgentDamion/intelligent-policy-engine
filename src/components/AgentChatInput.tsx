// Example component showing how to use the async worker pattern for agent tasks
import { useState } from 'react'
import { useAgentTask } from '../hooks/useAgentTask'
import { Button } from './ui/button'

interface AgentChatInputProps {
  enterpriseId?: string
  onResponse?: (response: string) => void
}

export function AgentChatInput({ enterpriseId, onResponse }: AgentChatInputProps) {
  const [input, setInput] = useState('')
  
  const { submitTask, isSubmitting, isProcessing, error, currentTask } = useAgentTask({
    enterpriseId,
    onComplete: (response) => {
      const answer = response.response_payload?.answer || 'No response received'
      onResponse?.(answer)
      setInput('') // Clear input on success
    },
    onError: (err) => {
      console.error('Agent task failed:', err)
    },
    onStatusChange: (status) => {
      console.log('Task status:', status)
    }
  })

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!input.trim() || isSubmitting || isProcessing) return

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
    <div className="space-y-2">
      <form onSubmit={handleSubmit} className="flex gap-2">
        <input
          type="text"
          value={input}
          onChange={(e) => setInput(e.target.value)}
          placeholder="Ask the agent a question..."
          className="flex-1 px-4 py-2 border rounded-lg"
          disabled={isSubmitting || isProcessing}
        />
        <Button 
          type="submit" 
          disabled={!input.trim() || isSubmitting || isProcessing}
        >
          {isSubmitting || isProcessing ? 'Processing...' : 'Send'}
        </Button>
      </form>

      {isProcessing && (
        <div className="text-sm text-gray-500">
          ⚙️ Agent is processing your request...
        </div>
      )}

      {error && (
        <div className="text-sm text-red-500">
          ❌ Error: {error.message}
        </div>
      )}

      {currentTask?.status === 'completed' && currentTask.response_payload && (
        <div className="mt-4 p-4 bg-green-50 rounded-lg">
          <div className="text-sm font-semibold text-green-800 mb-2">
            ✅ Agent Response:
          </div>
          <div className="text-sm text-green-700">
            {currentTask.response_payload.answer}
          </div>
          {currentTask.response_payload.steps && (
            <div className="mt-2 text-xs text-green-600">
              Steps: {currentTask.response_payload.steps.join(' → ')}
            </div>
          )}
        </div>
      )}
    </div>
  )
}

