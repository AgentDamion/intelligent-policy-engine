fetch('http://localhost:5050/meta-loop/event', {
  method: 'POST',
  headers: { 'Content-Type': 'application/json' },
  body: JSON.stringify({
    tenant_id: '123e4567-e89b-12d3-a456-426614174000',
    domain: 'enterprise',
    event_type: 'policy_decision',
    metadata: {
      decision: 'approved',
      risk_score: 0.3,
      tool_name: 'TestGPT'
    }
  })
})
.then(r => r.json())
.then(data => console.log('✅ Success:', data))
.catch(err => console.error('❌ Error:', err));