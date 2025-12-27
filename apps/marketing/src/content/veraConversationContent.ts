export const veraConversationContent = {
  systemStatus: {
    status: 'Shadow' as const,
    partnerCount: 42,
    autoClearRate: 94
  },
  
  welcomeMessages: [
    "Hello! I'm VERA, your AI governance assistant. I monitor AI tool usage at the enterprise-partner boundary, enforcing policy in real-time.",
    "I can help you understand policies, review decisions, check compliance status, or explore how boundary governance works.",
    "What would you like to know?"
  ],
  
  suggestedQuestions: [
    "How does policy enforcement work?",
    "What is a Proof Bundle?",
    "How do you handle escalations?",
    "What is Shadow Mode?"
  ],
  
  quickReplies: {
    policy: "I evaluate every AI tool usage request against your configured policies. When a request comes in, I check the tool version, user permissions, data scope, and brand context. Based on this, I recommend ALLOW, BLOCK, or ESCALATE to human review.",
    proofBundle: "A Proof Bundle is a cryptographic audit record I generate for every approved AI tool run. It captures: which tool and version was used, who ran it, for which brand/audience, under which policy snapshot, and when. This is what you show auditors—not raw prompts or creative assets.",
    escalation: "When I'm uncertain about a decision or the risk threshold is high, I escalate to human reviewers. I provide my reasoning, confidence level, and relevant policy context. Human decisions then train my future evaluations.",
    shadowMode: "Shadow Mode lets you observe my decisions without enforcing them. I still evaluate every request and log decisions, but I don't block anything. This is how you validate your policies before going live."
  }
};

export default veraConversationContent;










