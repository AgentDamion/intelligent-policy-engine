const EventBus = require('./core/event-bus');

console.log('?? Triggering AI Agent Activity...\n');

// Simulate a submission state change
EventBus.emit('submission-state-changed', {
    submissionId: 'test-123',
    state: 'policy_review',
    agent: 'System',
    data: {
        content: 'New diabetes drug shows amazing results!'
    }
});

// Simulate routing decision
setTimeout(() => {
    EventBus.emit('routing-decision', {
        submissionId: 'test-123',
        analysis: {
            type: { primary: 'promotional' },
            riskLevel: { level: 'medium' }
        },
        workflow: { name: 'standard-review' },
        confidence: 85
    });
}, 1000);

console.log('? Check your dashboard - agents should be active!');

// Keep process alive for a bit
setTimeout(() => {
    console.log('\n?? Test complete!');
    process.exit(0);
}, 5000);
