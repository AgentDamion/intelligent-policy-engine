# Modern Authentication Hub

This is the implementation of the Modern Authentication Hub for aicomplyr.io, providing enterprise-grade authentication with SSO support, organization management, and role-based access control.

## Usage

### Basic Integration

```tsx
import React from 'react';
import { BrowserRouter, Routes, Route } from 'react-router-dom';
import { AuthProvider } from '../../context/AuthProvider';
import { AuthHubPage } from './AuthHubPage';

function App() {
  return (
    <BrowserRouter>
      <AuthProvider>
        <Routes>
          <Route path="/auth" element={<AuthHubPage />} />
          {/* Other routes */}
        </Routes>
      </AuthProvider>
    </BrowserRouter>
  );
}
```

### Features

1. **Sign In**
   - SSO with Google, Microsoft, and Okta
   - Email/password authentication
   - Magic link option
   - Remember me functionality

2. **Create Organization**
   - Organization type selection (Enterprise/Partner/Both)
   - Region selection
   - Optional email domain restriction
   - SSO configuration
   - Initial role assignment

3. **Join Organization**
   - Email-based access requests
   - Optional invite code support
   - Admin approval workflow

### API Endpoints Required

The authentication hub expects these backend endpoints [[memory:4543327]]:

```
POST   /api/auth/signin
POST   /api/auth/logout
GET    /api/auth/session
GET    /api/oauth/start/:provider
POST   /api/oauth/callback/:provider
GET    /api/saml/start
POST   /api/saml/callback
GET    /api/saml/metadata
GET    /api/saml/check-config
POST   /api/org/create
POST   /api/org/request-access
POST   /api/analytics/track
```

### Analytics Events

The authentication hub tracks these events:

- `auth.sso_clicked` - When SSO button is clicked
- `auth.signin_submitted` - When sign in form is submitted
- `auth.signin_success` - When sign in succeeds
- `auth.signin_failed` - When sign in fails
- `auth.magic_link_requested` - When magic link is requested
- `org.type_selected` - When organization type is selected
- `org.role_selected` - When role is toggled
- `org.sso_enabled` - When SSO is enabled
- `org.created` - When organization is created
- `org.access_requested` - When access is requested

### Accessibility

All components include:
- ARIA labels and roles
- Keyboard navigation support
- Focus management
- Screen reader announcements
- 2px focus rings for visibility

### Customization

To customize the theme, update the Tailwind classes in the components or override the default styles:

```css
/* Custom theme overrides */
.auth-hub {
  --primary-color: #0066cc;
  --focus-ring-color: #0066cc;
}
```

### Security Considerations

1. **Session Management**: Uses HttpOnly, SameSite=Strict cookies
2. **MFA Support**: Redirects to `/auth/mfa` when required
3. **CSRF Protection**: Implement on backend endpoints
4. **Rate Limiting**: Implement on authentication endpoints
5. **Password Requirements**: Enforces strong passwords (8+ chars, mixed case, numbers, special chars)

### Testing

Run the included tests:

```bash
npm test -- --testPathPattern=auth
```

Key test scenarios:
- Form validation
- SSO provider selection
- Organization creation flow
- Access request submission
- Error handling
- Accessibility compliance
