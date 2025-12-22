# AIComplyr Policy Studio

A comprehensive enterprise policy management platform built with React, TypeScript, and Supabase.

## 🚀 Features

- **Multi-tenant Architecture**: Enterprise and workspace isolation
- **Policy Management**: Create, version, and distribute policies
- **Role-based Access Control**: Owner, Admin, Editor, Viewer roles
- **Real-time Updates**: Live collaboration and notifications
- **Audit Logging**: Complete activity tracking and compliance
- **Responsive Design**: Mobile-first, modern UI/UX
- **Enterprise Security**: Row-level security and data isolation

## 🛠️ Tech Stack

- **Frontend**: React 18 + TypeScript + Vite
- **Styling**: Tailwind CSS + Custom Design System
- **State Management**: React Context + React Query
- **Database**: Supabase (PostgreSQL)
- **Authentication**: Supabase Auth
- **Real-time**: Supabase Realtime
- **Icons**: Lucide React
- **Forms**: React Hook Form + Zod validation

## 📋 Prerequisites

- Node.js 18+ (20+ recommended)
- npm or yarn
- Supabase account and project
- Git

## 🚀 Quick Start

### 1. Clone the Repository

```bash
git clone <your-repo-url>
cd aicomplyr-policy-studio
```

### 2. Install Dependencies

```bash
npm install
```

### 3. Environment Setup

Create a `.env.local` file in the root directory:

```bash
VITE_SUPABASE_URL=your_supabase_project_url
VITE_SUPABASE_ANON_KEY=your_supabase_anon_key
VITE_API_URL=your_api_url
VITE_WS_URL=your_websocket_url
```

### 4. Database Setup

Make sure you have applied the database migrations:

```bash
# Apply the policy studio core migration
node supabase/run-migrations-direct.js run 20250829140812_policy_studio_core.sql

# Apply the schema standardization migration
node supabase/run-migrations-direct.js run 20250829140813_schema_standardization_and_improvements.sql
```

### 5. Start Development Server

```bash
npm run dev
```

The application will be available at `http://localhost:3000`

## 🏗️ Project Structure

```
src/
├── components/          # Reusable UI components
│   ├── ui/             # Basic UI components
│   └── Layout.tsx      # Main layout component
├── contexts/            # React contexts
│   ├── AuthContext.tsx # Authentication state
│   └── EnterpriseContext.tsx # Enterprise/workspace state
├── pages/               # Page components
│   ├── DashboardPage.tsx
│   ├── LoginPage.tsx
│   ├── PoliciesPage.tsx
│   ├── WorkspacesPage.tsx
│   └── SettingsPage.tsx
├── lib/                 # Utility libraries
│   └── supabase.ts     # Supabase client configuration
├── App.tsx             # Main app component
├── main.tsx            # Application entry point
└── index.css           # Global styles
```

## 🔐 Authentication Flow

1. **Sign Up**: Users create accounts with email/password
2. **Enterprise Creation**: First user creates an enterprise
3. **Workspace Setup**: Create workspaces within the enterprise
4. **Member Invitation**: Invite team members with specific roles
5. **Access Control**: RLS policies ensure data isolation

## 🎯 Core Features

### Enterprise Management
- Create and manage enterprises
- Multi-workspace support
- Role-based permissions
- Team member management

### Policy Management
- Policy creation and editing
- Version control
- Status tracking (draft, review, published, archived)
- Distribution to workspaces

### Security Features
- Row-level security (RLS)
- Enterprise data isolation
- Audit logging
- Role-based access control

## 🚀 Available Scripts

- `npm run dev` - Start development server
- `npm run build` - Build for production
- `npm run preview` - Preview production build
- `npm run lint` - Run ESLint
- `npm run type-check` - Run TypeScript type checking

## 🔧 Configuration

### Tailwind CSS
Custom design system with:
- Color palette (primary, secondary, success, warning, danger)
- Component classes (buttons, inputs, cards)
- Responsive utilities
- Custom animations

### Supabase
- Real-time subscriptions
- Row-level security policies
- Database triggers and functions
- File storage (if needed)

## 📱 Responsive Design

- Mobile-first approach
- Responsive sidebar navigation
- Adaptive layouts for all screen sizes
- Touch-friendly interactions

## 🧪 Testing

```bash
# Run type checking
npm run type-check

# Run linting
npm run lint
```

### Architecture: Marketing vs Platform

This monorepo contains two distinct frontend applications with strict separation of concerns:

#### Marketing Site (`apps/marketing`)
- **Domain**: `www.aicomplyr.io` (production)
- **Purpose**: Education, demos, lead capture
- **Routes**:
  - `/` - Homepage
  - `/vera` - Demo VERA conversation (mock responses)
  - `/workflows` - Workflow template library
  - `/pricing`, `/contact`, `/about` - Lead capture
  - `/governance-lab`, `/boundary-lab` - Interactive demos
  - `/terms`, `/privacy` - Legal pages
- **E2E Tests**: `pnpm test:e2e:marketing`
  - Tests public marketing pages only
  - Set `NO_API=true` to skip backend health check

#### Platform App (`apps/platform`)  
- **Domain**: `app.aicomplyr.io` (production)
- **Purpose**: Authenticated governance (VERA+, Decisions, Inbox)
- **Routes**:
  - `/login`, `/onboarding` - Auth flows
  - `/vera-plus` - Main dashboard (default landing)
  - `/vera-settings` - VERA configuration
  - `/agentic` - Weave/Workbench
  - `/policies`, `/workspaces`, `/settings` - Management
- **E2E Tests**: `pnpm test:e2e:platform`
  - Tests authenticated flows
  - Requires platform dev server on :8080

#### Redirect Behavior
When users visit platform-only routes on the marketing site (e.g., `/enterprise/*`, `/governance/*`, `/vendor/*`, `/login`), they are automatically redirected to `app.aicomplyr.io`.

Set `VITE_PLATFORM_ORIGIN` in marketing `.env.local` to configure the redirect target.

## 🚀 Deployment

### Build for Production

```bash
npm run build
```

### Deploy to Vercel/Netlify

1. Connect your repository
2. Set environment variables
3. Deploy automatically on push

### Environment Variables for Production

```bash
VITE_SUPABASE_URL=your_production_supabase_url
VITE_SUPABASE_ANON_KEY=your_production_supabase_anon_key
```

## 🔒 Security Considerations

- All database queries use RLS policies
- User authentication required for all routes
- Enterprise data isolation enforced
- Input validation and sanitization
- HTTPS required in production

## 🤝 Contributing

1. Fork the repository
2. Create a feature branch
3. Make your changes
4. Add tests if applicable
5. Submit a pull request

## 📄 License

This project is proprietary and confidential.

## 🆘 Support

For support and questions:
- Check the documentation
- Review the code comments
- Contact the development team

## 🗺️ Roadmap

- [ ] Policy templates and workflows
- [ ] Advanced compliance reporting
- [ ] AI-powered policy suggestions
- [ ] Mobile app
- [ ] Advanced analytics dashboard
- [ ] Integration APIs
- [ ] Multi-language support

---

**Built with ❤️ by the AIComplyr Team** 