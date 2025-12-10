# Agent Worker Integration Guide

## Overview

The agent worker system uses an **async worker pattern** where:
1. Frontend submits tasks to `agent_task_requests` table
2. Python worker (`worker.py`) polls for pending tasks
3. Frontend listens for updates via Supabase Realtime
4. Worker processes tasks and updates status

## Architecture

```
Frontend (React) → Supabase Table → Python Worker → Supabase Table → Frontend (Realtime)
```

## Frontend Integration

### Option 1: Using the React Hook (Recommended)

```tsx
import { useAgentTask } from '../hooks/useAgentTask'

function MyComponent() {
  const { submitTask, isSubmitting, isProcessing, currentTask, error } = useAgentTask({
    enterpriseId: 'your-enterprise-id',
    onComplete: (response) => {
      console.log('Task completed:', response.response_payload?.answer)
    },
    onError: (err) => {
      console.error('Task failed:', err)
    }
  })

  const handleSubmit = async () => {
    await submitTask({
      prompt: 'Your question here',
      context: { /* optional context */ }
    })
  }

  return (
    <div>
      <button onClick={handleSubmit} disabled={isSubmitting}>
        {isSubmitting ? 'Processing...' : 'Submit'}
      </button>
      {currentTask?.response_payload?.answer && (
        <div>{currentTask.response_payload.answer}</div>
      )}
    </div>
  )
}
```

### Option 2: Using the Service Directly

```tsx
import { submitAgentTask } from '../services/AgentTaskService'

async function handleSubmit() {
  try {
    const response = await submitAgentTask({
      prompt: 'Your question here',
      context: { /* optional */ }
    }, (updatedTask) => {
      // Called on each status update
      console.log('Status:', updatedTask.status)
    })
    
    console.log('Final response:', response.response_payload?.answer)
  } catch (error) {
    console.error('Task failed:', error)
  }
}
```

## Backend Worker

### Running the Worker

```bash
cd agent-worker
python worker.py
```

The worker will:
- Poll every 2 seconds for pending tasks
- Process each task (currently simulates 3 seconds of work)
- Update task status: `pending` → `processing` → `completed`/`failed`
- Store response in `response_payload` column

### Worker Output

```
🟢 Agent Worker is ONLINE.
👀 Watching table 'agent_task_requests' for 'pending' tasks...
⏰ Started at: 2025-12-10 14:30:00
------------------------------------------------------------

⚡ Found Task a8b99081-adc5-44f1-9d08-57ea6b205a0b!
   User asking: Hello Agent, are you online?
✅ Task a8b99081-adc5-44f1-9d08-57ea6b205a0b Completed successfully.

💓 Worker heartbeat: 14:30:30 - Still watching for tasks...
```

## Database Schema

```sql
CREATE TABLE agent_task_requests (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    status VARCHAR(50) NOT NULL DEFAULT 'pending' 
        CHECK (status IN ('pending', 'processing', 'completed', 'failed')),
    request_payload JSONB NOT NULL DEFAULT '{}'::jsonb,
    response_payload JSONB DEFAULT NULL,
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW()
);
```

## Task Status Flow

1. **pending**: Task created, waiting for worker
2. **processing**: Worker picked up task, processing
3. **completed**: Task finished successfully
4. **failed**: Task encountered an error

## Realtime Subscription

The frontend automatically subscribes to task updates via Supabase Realtime:

```tsx
// This happens automatically in AgentTaskService
const channel = supabase
  .channel(`agent-task-${taskId}`)
  .on('postgres_changes', {
    event: 'UPDATE',
    schema: 'public',
    table: 'agent_task_requests',
    filter: `id=eq.${taskId}`
  }, (payload) => {
    // Handle update
  })
  .subscribe()
```

## Testing

### 1. Test Worker Connection

```bash
cd agent-worker
python test-worker-connection.py
```

### 2. Check Worker Status

```bash
python check-worker-status.py
```

### 3. Manual Test via Supabase Dashboard

1. Go to Supabase Dashboard → Table Editor → `agent_task_requests`
2. Insert a new row:
   ```json
   {
     "status": "pending",
     "request_payload": {
       "prompt": "Test message"
     }
   }
   ```
3. Watch your worker terminal - it should pick up the task within 2 seconds
4. Check the table - status should change to `completed` with `response_payload`

## Troubleshooting

### Worker Not Picking Up Tasks

1. **Check worker is running**: `Get-Process python`
2. **Check .env file**: Ensure `SUPABASE_URL` and `SUPABASE_SERVICE_KEY` are set
3. **Check table permissions**: Worker needs service role key
4. **Check task status**: Ensure task is `pending`, not already `completed`

### Frontend Not Receiving Updates

1. **Check Realtime is enabled**: Supabase Dashboard → Settings → API → Realtime
2. **Check subscription**: Look for subscription errors in browser console
3. **Check task ID**: Ensure you're subscribing to the correct task ID
4. **Check RLS policies**: Ensure authenticated users can read tasks

### Tasks Stuck in "processing"

1. **Worker crashed**: Restart the worker
2. **Worker timeout**: Check worker logs for errors
3. **Manual reset**: Update task status back to `pending` in Supabase Dashboard

## Next Steps

1. **Customize Worker Logic**: Edit `worker.py` → `process_task()` function
2. **Add AI Integration**: Replace the simulated work with actual LangChain/Phidata calls
3. **Add Error Handling**: Enhance error handling in both frontend and backend
4. **Add Retry Logic**: Implement retry for failed tasks
5. **Add Task Priority**: Add priority field and process high-priority tasks first

## Example: Adding LangChain Integration

```python
# In worker.py, replace the simulated work:
from langchain.llms import OpenAI
from langchain.prompts import PromptTemplate

def process_task(task):
    # ... existing code ...
    
    try:
        # Replace simulation with real AI
        llm = OpenAI(temperature=0.7)
        prompt = PromptTemplate(
            input_variables=["user_prompt"],
            template="You are a helpful AI assistant. User asks: {user_prompt}"
        )
        
        result_text = llm(prompt.format(user_prompt=task['request_payload'].get('prompt')))
        
        # ... rest of the code ...
```

