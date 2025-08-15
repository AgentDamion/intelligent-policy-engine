// File: database/seed-hierarchical-data.js

const db = require('./connection');

async function seedHierarchicalData() {
  console.log('🌱 Seeding hierarchical multi-tenant data...');

  try {
    // Create sample enterprises
    const enterprises = [
      {
        name: 'Ogilvy Health',
        slug: 'ogilvy-health',
        type: 'agency',
        subscription_tier: 'premium',
        settings: { branding: { primaryColor: '#1e40af' } }
      },
      {
        name: 'Pfizer',
        slug: 'pfizer',
        type: 'pharma',
        subscription_tier: 'enterprise',
        settings: { compliance: { strictMode: true } }
      },
      {
        name: 'McCann Health',
        slug: 'mccann-health',
        type: 'agency',
        subscription_tier: 'standard',
        settings: { features: { advancedAnalytics: true } }
      },
      {
        name: 'Novartis',
        slug: 'novartis',
        type: 'pharma',
        subscription_tier: 'enterprise',
        settings: { security: { enhancedAudit: true } }
      }
    ];

    const createdEnterprises = [];
    for (const enterprise of enterprises) {
      const result = await db.query(`
        INSERT INTO enterprises (name, slug, type, subscription_tier, settings)
        VALUES ($1, $2, $3, $4, $5)
        RETURNING *
      `, [
        enterprise.name,
        enterprise.slug,
        enterprise.type,
        enterprise.subscription_tier,
        JSON.stringify(enterprise.settings)
      ]);
      createdEnterprises.push(result.rows[0]);
      console.log(`✅ Created enterprise: ${enterprise.name}`);
    }

    // Create sample users
    const users = [
      { email: 'admin@aicomplyr.io', name: 'Platform Super Admin' },
      { email: 'john@ogilvy.com', name: 'John Smith' },
      { email: 'sarah@pfizer.com', name: 'Sarah Johnson' },
      { email: 'mike@mccann.com', name: 'Mike Wilson' },
      { email: 'lisa@novartis.com', name: 'Lisa Brown' },
      { email: 'david@ogilvy.com', name: 'David Lee' },
      { email: 'emma@pfizer.com', name: 'Emma Davis' }
    ];

    const createdUsers = [];
    for (const user of users) {
      const result = await db.query(`
        INSERT INTO users (email, name)
        VALUES ($1, $2)
        RETURNING *
      `, [user.email, user.name]);
      createdUsers.push(result.rows[0]);
      console.log(`✅ Created user: ${user.name}`);
    }

    // Create agency seats
    const agencySeats = [
      {
        enterprise_id: createdEnterprises[0].id, // Ogilvy Health
        name: 'Pfizer Account Team',
        slug: 'pfizer-account',
        description: 'Dedicated team for Pfizer marketing campaigns',
        seat_type: 'premium'
      },
      {
        enterprise_id: createdEnterprises[0].id, // Ogilvy Health
        name: 'Novartis Account Team',
        slug: 'novartis-account',
        description: 'Dedicated team for Novartis marketing campaigns',
        seat_type: 'standard'
      },
      {
        enterprise_id: createdEnterprises[2].id, // McCann Health
        name: 'Pfizer Creative Team',
        slug: 'pfizer-creative',
        description: 'Creative team for Pfizer campaigns',
        seat_type: 'standard'
      }
    ];

    const createdSeats = [];
    for (const seat of agencySeats) {
      const result = await db.query(`
        INSERT INTO agency_seats (enterprise_id, name, slug, description, seat_type)
        VALUES ($1, $2, $3, $4, $5)
        RETURNING *
      `, [
        seat.enterprise_id,
        seat.name,
        seat.slug,
        seat.description,
        seat.seat_type
      ]);
      createdSeats.push(result.rows[0]);
      console.log(`✅ Created agency seat: ${seat.name}`);
    }

    // Create user contexts
    const userContexts = [
      // Platform Super Admin
      {
        user_id: createdUsers[0].id,
        enterprise_id: createdEnterprises[0].id,
        role: 'platform_super_admin',
        is_default: true,
        permissions: ['*']
      },
      {
        user_id: createdUsers[0].id,
        enterprise_id: createdEnterprises[1].id,
        role: 'platform_super_admin',
        is_default: false,
        permissions: ['*']
      },

      // Ogilvy Health - Enterprise Owner
      {
        user_id: createdUsers[1].id,
        enterprise_id: createdEnterprises[0].id,
        role: 'enterprise_owner',
        is_default: true,
        permissions: ['enterprise_manage', 'seat_create', 'policy_manage', 'user_invite']
      },

      // Pfizer - Enterprise Admin
      {
        user_id: createdUsers[2].id,
        enterprise_id: createdEnterprises[1].id,
        role: 'enterprise_admin',
        is_default: true,
        permissions: ['policy_manage', 'seat_oversight', 'user_manage']
      },

      // McCann Health - Enterprise Admin
      {
        user_id: createdUsers[3].id,
        enterprise_id: createdEnterprises[2].id,
        role: 'enterprise_admin',
        is_default: true,
        permissions: ['policy_manage', 'seat_oversight', 'user_manage']
      },

      // Novartis - Enterprise Admin
      {
        user_id: createdUsers[4].id,
        enterprise_id: createdEnterprises[3].id,
        role: 'enterprise_admin',
        is_default: true,
        permissions: ['policy_manage', 'seat_oversight', 'user_manage']
      },

      // Multi-context user: Ogilvy Health + Pfizer Seat
      {
        user_id: createdUsers[5].id,
        enterprise_id: createdEnterprises[0].id,
        agency_seat_id: createdSeats[0].id,
        role: 'seat_admin',
        is_default: true,
        permissions: ['seat_manage', 'policy_assign', 'user_invite']
      },
      {
        user_id: createdUsers[5].id,
        enterprise_id: createdEnterprises[1].id,
        role: 'seat_user',
        is_default: false,
        permissions: ['submission_create', 'workflow_access']
      },

      // Multi-context user: Pfizer + McCann Seat
      {
        user_id: createdUsers[6].id,
        enterprise_id: createdEnterprises[1].id,
        role: 'enterprise_admin',
        is_default: true,
        permissions: ['policy_manage', 'seat_oversight', 'user_manage']
      },
      {
        user_id: createdUsers[6].id,
        enterprise_id: createdEnterprises[2].id,
        agency_seat_id: createdSeats[2].id,
        role: 'seat_user',
        is_default: false,
        permissions: ['submission_create', 'workflow_access']
      }
    ];

    for (const context of userContexts) {
      await db.query(`
        INSERT INTO user_contexts (user_id, enterprise_id, agency_seat_id, role, permissions, is_default)
        VALUES ($1, $2, $3, $4, $5, $6)
      `, [
        context.user_id,
        context.enterprise_id,
        context.agency_seat_id || null,
        context.role,
        JSON.stringify(context.permissions),
        context.is_default
      ]);
      console.log(`✅ Created user context: ${context.role} for user ${context.user_id}`);
    }

    // Create sample policies
    const policies = [
      {
        name: 'Pharma Compliance Standard',
        description: 'Standard compliance policy for pharmaceutical marketing',
        enterprise_id: createdEnterprises[1].id, // Pfizer
        policy_type: 'compliance',
        rules: {
          riskThreshold: 0.7,
          requiredApprovals: ['medical_review', 'legal_review'],
          restrictedTerms: ['cure', 'miracle', 'breakthrough']
        }
      },
      {
        name: 'Creative Review Process',
        description: 'Standard creative review process for agencies',
        enterprise_id: createdEnterprises[0].id, // Ogilvy Health
        policy_type: 'workflow',
        rules: {
          stages: ['concept', 'design', 'final'],
          approvers: ['creative_director', 'account_director']
        }
      },
      {
        name: 'Pfizer Brand Guidelines',
        description: 'Brand-specific guidelines for Pfizer campaigns',
        enterprise_id: createdEnterprises[1].id, // Pfizer
        agency_seat_id: createdSeats[0].id, // Pfizer Account Team
        policy_type: 'brand',
        rules: {
          brandColors: ['#0066cc', '#ffffff'],
          logoUsage: 'strict',
          typography: 'approved_fonts_only'
        }
      }
    ];

    for (const policy of policies) {
      const result = await db.query(`
        INSERT INTO policies (name, description, enterprise_id, agency_seat_id, policy_type, rules, created_by)
        VALUES ($1, $2, $3, $4, $5, $6, $7)
        RETURNING *
      `, [
        policy.name,
        policy.description,
        policy.enterprise_id,
        policy.agency_seat_id || null,
        policy.policy_type,
        JSON.stringify(policy.rules),
        createdUsers[0].id // Platform super admin
      ]);
      console.log(`✅ Created policy: ${policy.name}`);
    }

    // Create sample permissions
    const permissions = [
      { name: 'enterprise_manage', description: 'Manage enterprise settings', category: 'enterprise', resource: 'enterprises', action: 'manage' },
      { name: 'seat_create', description: 'Create agency seats', category: 'seats', resource: 'agency_seats', action: 'create' },
      { name: 'seat_manage', description: 'Manage agency seats', category: 'seats', resource: 'agency_seats', action: 'manage' },
      { name: 'policy_manage', description: 'Manage policies', category: 'policies', resource: 'policies', action: 'manage' },
      { name: 'policy_assign', description: 'Assign policies to seats', category: 'policies', resource: 'policies', action: 'assign' },
      { name: 'user_invite', description: 'Invite users to seats', category: 'users', resource: 'users', action: 'invite' },
      { name: 'user_manage', description: 'Manage users', category: 'users', resource: 'users', action: 'manage' },
      { name: 'submission_create', description: 'Create submissions', category: 'workflow', resource: 'submissions', action: 'create' },
      { name: 'workflow_access', description: 'Access workflows', category: 'workflow', resource: 'workflows', action: 'access' },
      { name: 'dashboard_read', description: 'Read dashboard data', category: 'analytics', resource: 'dashboard', action: 'read' }
    ];

    for (const permission of permissions) {
      await db.query(`
        INSERT INTO permissions (name, description, category, resource, action)
        VALUES ($1, $2, $3, $4, $5)
      `, [
        permission.name,
        permission.description,
        permission.category,
        permission.resource,
        permission.action
      ]);
      console.log(`✅ Created permission: ${permission.name}`);
    }

    console.log('🎉 Hierarchical data seeding completed successfully!');
    console.log('\n📊 Summary:');
    console.log(`- ${createdEnterprises.length} enterprises created`);
    console.log(`- ${createdUsers.length} users created`);
    console.log(`- ${createdSeats.length} agency seats created`);
    console.log(`- ${userContexts.length} user contexts created`);
    console.log(`- ${policies.length} policies created`);
    console.log(`- ${permissions.length} permissions created`);

    console.log('\n🔑 Test Credentials:');
    console.log('Platform Super Admin: admin@aicomplyr.io');
    console.log('Enterprise Owner: john@ogilvy.com');
    console.log('Enterprise Admin: sarah@pfizer.com');
    console.log('Multi-context User: david@ogilvy.com');

  } catch (error) {
    console.error('❌ Error seeding hierarchical data:', error);
    throw error;
  }
}

// Run the seed function if this file is executed directly
if (require.main === module) {
  seedHierarchicalData()
    .then(() => {
      console.log('✅ Seeding completed');
      process.exit(0);
    })
    .catch((error) => {
      console.error('❌ Seeding failed:', error);
      process.exit(1);
    });
}

module.exports = { seedHierarchicalData }; 