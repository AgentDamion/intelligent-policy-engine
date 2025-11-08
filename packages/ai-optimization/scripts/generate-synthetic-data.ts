#!/usr/bin/env tsx

import { createClient } from '@supabase/supabase-js'
import * as dotenv from 'dotenv'
import { fileURLToPath } from 'url'
import { dirname, resolve } from 'path'

// Load environment from root
const __filename = fileURLToPath(import.meta.url)
const __dirname = dirname(__filename)
dotenv.config({ path: resolve(__dirname, '../../../.env.local') })
dotenv.config({ path: resolve(__dirname, '../../../.env') })

interface SyntheticExample {
  agent: string
  action: string
  status: string
  details: {
    input: {
      tool: string
      vendor: string
      usage: string
      dataHandling: string[]
      content?: string
    }
    output: {
      decision: {
        status: 'approved' | 'rejected' | 'needs_review'
        confidence: number
      }
      riskLevel: string
    }
    metadata: {
      human_review: {
        final_decision: 'approved' | 'rejected' | 'needs_review'
        reasoning: string
        correct_risk_level?: string
      }
    }
  }
}

const SYNTHETIC_EXAMPLES: SyntheticExample[] = [
  // Clear Approvals (5 examples)
  {
    agent: 'PolicyAgent',
    action: 'policy_evaluation',
    status: 'success',
    details: {
      input: {
        tool: 'Canva Pro',
        vendor: 'Canva',
        usage: 'Creating client presentation graphics',
        dataHandling: ['design_files', 'client_logos']
      },
      output: {
        decision: { status: 'approved', confidence: 0.92 },
        riskLevel: 'low'
      },
      metadata: {
        human_review: {
          final_decision: 'approved',
          reasoning: 'Low risk design tool with proper data handling. No sensitive data involved.',
          correct_risk_level: 'low'
        }
      }
    }
  },
  {
    agent: 'PolicyAgent',
    action: 'policy_evaluation',
    status: 'success',
    details: {
      input: {
        tool: 'Grammarly Business',
        vendor: 'Grammarly',
        usage: 'Document editing and proofreading',
        dataHandling: ['text_content', 'writing_suggestions']
      },
      output: {
        decision: { status: 'approved', confidence: 0.88 },
        riskLevel: 'low'
      },
      metadata: {
        human_review: {
          final_decision: 'approved',
          reasoning: 'Approved writing tool with enterprise agreement. Standard business use case.',
          correct_risk_level: 'low'
        }
      }
    }
  },
  {
    agent: 'PolicyAgent',
    action: 'policy_evaluation',
    status: 'success',
    details: {
      input: {
        tool: 'Slack Enterprise',
        vendor: 'Slack Technologies',
        usage: 'Team communication and collaboration',
        dataHandling: ['messages', 'file_sharing', 'integrations']
      },
      output: {
        decision: { status: 'approved', confidence: 0.95 },
        riskLevel: 'low'
      },
      metadata: {
        human_review: {
          final_decision: 'approved',
          reasoning: 'Enterprise-grade communication tool with proper security controls.',
          correct_risk_level: 'low'
        }
      }
    }
  },
  {
    agent: 'PolicyAgent',
    action: 'policy_evaluation',
    status: 'success',
    details: {
      input: {
        tool: 'Notion',
        vendor: 'Notion Labs',
        usage: 'Project documentation and knowledge base',
        dataHandling: ['documents', 'project_plans', 'meeting_notes']
      },
      output: {
        decision: { status: 'approved', confidence: 0.85 },
        riskLevel: 'low'
      },
      metadata: {
        human_review: {
          final_decision: 'approved',
          reasoning: 'Approved collaboration tool for non-sensitive project documentation.',
          correct_risk_level: 'low'
        }
      }
    }
  },
  {
    agent: 'PolicyAgent',
    action: 'policy_evaluation',
    status: 'success',
    details: {
      input: {
        tool: 'Zoom Business',
        vendor: 'Zoom Video Communications',
        usage: 'Client meetings and internal calls',
        dataHandling: ['video_recordings', 'meeting_transcripts']
      },
      output: {
        decision: { status: 'approved', confidence: 0.90 },
        riskLevel: 'low'
      },
      metadata: {
        human_review: {
          final_decision: 'approved',
          reasoning: 'Enterprise video conferencing with appropriate security settings.',
          correct_risk_level: 'low'
        }
      }
    }
  },

  // Clear Rejections (5 examples)
  {
    agent: 'PolicyAgent',
    action: 'policy_evaluation',
    status: 'success',
    details: {
      input: {
        tool: 'UnknownAI Medical Analyzer',
        vendor: 'Startup LLC',
        usage: 'Analyzing patient medical records for insights',
        dataHandling: ['medical_records', 'patient_data', 'health_information']
      },
      output: {
        decision: { status: 'approved', confidence: 0.65 },
        riskLevel: 'medium'
      },
      metadata: {
        human_review: {
          final_decision: 'rejected',
          reasoning: 'HIPAA violation risk. Unvetted vendor handling protected health information. Should be rejected.',
          correct_risk_level: 'high'
        }
      }
    }
  },
  {
    agent: 'PolicyAgent',
    action: 'policy_evaluation',
    status: 'success',
    details: {
      input: {
        tool: 'DataMiner Pro',
        vendor: 'Unknown',
        usage: 'Scraping competitor websites for pricing data',
        dataHandling: ['web_scraping', 'competitor_data', 'pricing_information']
      },
      output: {
        decision: { status: 'needs_review', confidence: 0.55 },
        riskLevel: 'medium'
      },
      metadata: {
        human_review: {
          final_decision: 'rejected',
          reasoning: 'Potential legal and ethical violations. Web scraping may violate terms of service.',
          correct_risk_level: 'high'
        }
      }
    }
  },
  {
    agent: 'PolicyAgent',
    action: 'policy_evaluation',
    status: 'success',
    details: {
      input: {
        tool: 'FreeChatGPT Clone',
        vendor: 'Unknown Developer',
        usage: 'Processing confidential client contracts',
        dataHandling: ['contracts', 'legal_documents', 'client_pii']
      },
      output: {
        decision: { status: 'approved', confidence: 0.70 },
        riskLevel: 'low'
      },
      metadata: {
        human_review: {
          final_decision: 'rejected',
          reasoning: 'Unauthorized AI tool handling confidential data. Major security and compliance risk.',
          correct_risk_level: 'high'
        }
      }
    }
  },
  {
    agent: 'PolicyAgent',
    action: 'policy_evaluation',
    status: 'success',
    details: {
      input: {
        tool: 'CryptoMiner Extension',
        vendor: 'Anonymous',
        usage: 'Browser productivity enhancement',
        dataHandling: ['browsing_data', 'system_resources']
      },
      output: {
        decision: { status: 'needs_review', confidence: 0.60 },
        riskLevel: 'medium'
      },
      metadata: {
        human_review: {
          final_decision: 'rejected',
          reasoning: 'Suspicious browser extension that may mine cryptocurrency. Clear security threat.',
          correct_risk_level: 'high'
        }
      }
    }
  },
  {
    agent: 'PolicyAgent',
    action: 'policy_evaluation',
    status: 'success',
    details: {
      input: {
        tool: 'ShadowIT Database',
        vendor: 'Unauthorized',
        usage: 'Storing customer financial records',
        dataHandling: ['financial_data', 'customer_pii', 'payment_information']
      },
      output: {
        decision: { status: 'approved', confidence: 0.50 },
        riskLevel: 'medium'
      },
      metadata: {
        human_review: {
          final_decision: 'rejected',
          reasoning: 'Unauthorized database storing sensitive financial data. PCI-DSS and data protection violations.',
          correct_risk_level: 'high'
        }
      }
    }
  },

  // Edge Cases - Needs Review (10 examples)
  {
    agent: 'PolicyAgent',
    action: 'policy_evaluation',
    status: 'success',
    details: {
      input: {
        tool: 'ChatGPT Plus',
        vendor: 'OpenAI',
        usage: 'Drafting marketing emails with customer names',
        dataHandling: ['customer_names', 'email_content', 'marketing_copy']
      },
      output: {
        decision: { status: 'approved', confidence: 0.75 },
        riskLevel: 'low'
      },
      metadata: {
        human_review: {
          final_decision: 'needs_review',
          reasoning: 'OpenAI is reputable but using customer data requires DPA review and opt-out verification.',
          correct_risk_level: 'medium'
        }
      }
    }
  },
  {
    agent: 'PolicyAgent',
    action: 'policy_evaluation',
    status: 'success',
    details: {
      input: {
        tool: 'Midjourney',
        vendor: 'Midjourney Inc',
        usage: 'Generating pharmaceutical advertisement images',
        dataHandling: ['image_generation', 'brand_assets']
      },
      output: {
        decision: { status: 'approved', confidence: 0.80 },
        riskLevel: 'low'
      },
      metadata: {
        human_review: {
          final_decision: 'needs_review',
          reasoning: 'FDA regulated pharma advertising requires compliance review before approval.',
          correct_risk_level: 'medium'
        }
      }
    }
  },
  {
    agent: 'PolicyAgent',
    action: 'policy_evaluation',
    status: 'success',
    details: {
      input: {
        tool: 'Salesforce Einstein',
        vendor: 'Salesforce',
        usage: 'AI-powered sales predictions using EU customer data',
        dataHandling: ['customer_data', 'sales_history', 'eu_resident_data']
      },
      output: {
        decision: { status: 'rejected', confidence: 0.65 },
        riskLevel: 'high'
      },
      metadata: {
        human_review: {
          final_decision: 'needs_review',
          reasoning: 'GDPR considerations for EU data. Needs legal review but not outright rejection - Salesforce is compliant.',
          correct_risk_level: 'medium'
        }
      }
    }
  },
  {
    agent: 'PolicyAgent',
    action: 'policy_evaluation',
    status: 'success',
    details: {
      input: {
        tool: 'Microsoft Copilot',
        vendor: 'Microsoft',
        usage: 'Code generation for internal tools processing user data',
        dataHandling: ['source_code', 'user_data_schemas', 'api_designs']
      },
      output: {
        decision: { status: 'approved', confidence: 0.85 },
        riskLevel: 'low'
      },
      metadata: {
        human_review: {
          final_decision: 'needs_review',
          reasoning: 'Enterprise Microsoft product but needs security review for data exposure in code suggestions.',
          correct_risk_level: 'medium'
        }
      }
    }
  },
  {
    agent: 'PolicyAgent',
    action: 'policy_evaluation',
    status: 'success',
    details: {
      input: {
        tool: 'Hugging Face Inference API',
        vendor: 'Hugging Face',
        usage: 'Sentiment analysis on customer support tickets',
        dataHandling: ['support_tickets', 'customer_feedback', 'sentiment_data']
      },
      output: {
        decision: { status: 'needs_review', confidence: 0.70 },
        riskLevel: 'medium'
      },
      metadata: {
        human_review: {
          final_decision: 'needs_review',
          reasoning: 'Correct decision. Third-party AI service needs vendor assessment and data handling review.',
          correct_risk_level: 'medium'
        }
      }
    }
  },
  {
    agent: 'PolicyAgent',
    action: 'policy_evaluation',
    status: 'success',
    details: {
      input: {
        tool: 'Zapier AI',
        vendor: 'Zapier',
        usage: 'Automating workflows that include HR data',
        dataHandling: ['employee_information', 'workflow_automation', 'hr_data']
      },
      output: {
        decision: { status: 'approved', confidence: 0.78 },
        riskLevel: 'low'
      },
      metadata: {
        human_review: {
          final_decision: 'needs_review',
          reasoning: 'HR data is sensitive. Needs HR and compliance approval even for trusted vendors.',
          correct_risk_level: 'medium'
        }
      }
    }
  },
  {
    agent: 'PolicyAgent',
    action: 'policy_evaluation',
    status: 'success',
    details: {
      input: {
        tool: 'Anthropic Claude',
        vendor: 'Anthropic',
        usage: 'Analyzing financial reports for insights',
        dataHandling: ['financial_reports', 'company_financials', 'strategic_data']
      },
      output: {
        decision: { status: 'rejected', confidence: 0.60 },
        riskLevel: 'high'
      },
      metadata: {
        human_review: {
          final_decision: 'needs_review',
          reasoning: 'Too conservative. Anthropic is reputable. Should review data sensitivity but not auto-reject.',
          correct_risk_level: 'medium'
        }
      }
    }
  },
  {
    agent: 'PolicyAgent',
    action: 'policy_evaluation',
    status: 'success',
    details: {
      input: {
        tool: 'GitHub Copilot',
        vendor: 'GitHub/Microsoft',
        usage: 'Code completion for healthcare application',
        dataHandling: ['source_code', 'code_patterns', 'healthcare_logic']
      },
      output: {
        decision: { status: 'approved', confidence: 0.82 },
        riskLevel: 'low'
      },
      metadata: {
        human_review: {
          final_decision: 'needs_review',
          reasoning: 'Healthcare applications require additional scrutiny. Copilot is safe but project needs compliance review.',
          correct_risk_level: 'medium'
        }
      }
    }
  },
  {
    agent: 'PolicyAgent',
    action: 'policy_evaluation',
    status: 'success',
    details: {
      input: {
        tool: 'Jasper AI',
        vendor: 'Jasper AI',
        usage: 'Creating clinical trial recruitment materials',
        dataHandling: ['marketing_content', 'clinical_trial_info', 'recruitment_copy']
      },
      output: {
        decision: { status: 'approved', confidence: 0.75 },
        riskLevel: 'low'
      },
      metadata: {
        human_review: {
          final_decision: 'needs_review',
          reasoning: 'Clinical trials are heavily regulated. FDA/IRB compliance review required for recruitment materials.',
          correct_risk_level: 'medium'
        }
      }
    }
  },
  {
    agent: 'PolicyAgent',
    action: 'policy_evaluation',
    status: 'success',
    details: {
      input: {
        tool: 'Replicate AI',
        vendor: 'Replicate',
        usage: 'Running custom ML models on customer behavioral data',
        dataHandling: ['customer_behavior', 'ml_models', 'analytics_data']
      },
      output: {
        decision: { status: 'needs_review', confidence: 0.68 },
        riskLevel: 'medium'
      },
      metadata: {
        human_review: {
          final_decision: 'needs_review',
          reasoning: 'Correct assessment. Custom ML on customer data needs thorough privacy and security review.',
          correct_risk_level: 'medium'
        }
      }
    }
  }
]

async function generateSyntheticData() {
  console.log('🧪 Generating synthetic training data for PolicyAgent\n')

  const supabaseUrl = process.env.VITE_SUPABASE_URL || process.env.SUPABASE_URL
  const supabaseKey = process.env.SUPABASE_SERVICE_ROLE_KEY

  if (!supabaseUrl || !supabaseKey) {
    console.error('❌ Missing environment variables:')
    console.error('   Required: VITE_SUPABASE_URL (or SUPABASE_URL) and SUPABASE_SERVICE_ROLE_KEY')
    process.exit(1)
  }

  const supabase = createClient(supabaseUrl, supabaseKey)

  console.log(`📝 Preparing to insert ${SYNTHETIC_EXAMPLES.length} examples...`)

  // Check if examples already exist
  const { data: existing, error: checkError } = await supabase
    .from('agent_activities')
    .select('id')
    .eq('agent', 'PolicyAgent')
    .limit(1)

  if (checkError) {
    console.error('❌ Error checking existing data:', checkError)
    process.exit(1)
  }

  if (existing && existing.length > 0) {
    console.log('\n⚠️  Warning: agent_activities already contains PolicyAgent data')
    console.log('   Proceeding will add more examples...\n')
  }

  // Insert examples
  let successCount = 0
  let errorCount = 0

  for (let i = 0; i < SYNTHETIC_EXAMPLES.length; i++) {
    const example = SYNTHETIC_EXAMPLES[i]
    
    const { error } = await supabase
      .from('agent_activities')
      .insert(example)

    if (error) {
      console.error(`   ❌ Example ${i + 1} failed:`, error.message)
      errorCount++
    } else {
      console.log(`   ✅ Example ${i + 1}/${SYNTHETIC_EXAMPLES.length} inserted`)
      successCount++
    }
  }

  console.log(`\n✅ Synthetic data generation complete!`)
  console.log(`   Success: ${successCount}`)
  console.log(`   Errors: ${errorCount}`)
  
  // Show distribution
  const approved = SYNTHETIC_EXAMPLES.filter(e => 
    e.details.metadata.human_review.final_decision === 'approved'
  ).length
  const rejected = SYNTHETIC_EXAMPLES.filter(e => 
    e.details.metadata.human_review.final_decision === 'rejected'
  ).length
  const review = SYNTHETIC_EXAMPLES.filter(e => 
    e.details.metadata.human_review.final_decision === 'needs_review'
  ).length

  console.log(`\n📊 Distribution:`)
  console.log(`   Approved: ${approved}`)
  console.log(`   Rejected: ${rejected}`)
  console.log(`   Needs Review: ${review}`)
  console.log(`\n🎯 Ready for optimization! Run: npm run test`)
}

generateSyntheticData()

