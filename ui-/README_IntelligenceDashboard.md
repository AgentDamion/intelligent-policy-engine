# AIComplyr Intelligence Dashboard

A modern, real-time dashboard for visualizing AI agent activity, workflow metrics, and live insights in the AIComplyr platform.

---

## 🚀 Features
- Brand-aligned, geometric, energetic UI
- Sidebar navigation with agent icons
- Header with action button
- Agent cards grid (Context, Policy, Audit, etc.)
- User activity bar graph
- Marketplace/tools preview
- Metrics and workflow distribution
- Live agent insights feed (WebSocket-powered)
- Polygonal watermarks and soft shadows

---

## 📦 File Location
- `ui/IntelligenceDashboard.jsx` (React component)
- `ui/intelligence-dashboard.html` (static HTML version, optional)

---

## 🛠️ Integration Steps

### 1. **Backend Requirements**
- Your backend must expose:
  - WebSocket server on `ws://localhost:3001` (for live routing/insights)
  - API endpoint `/api/metrics/workflows` (for metrics and workflow stats)

### 2. **Install Dependencies**
If you use Create React App or similar, you already have React. Otherwise:
```bash
npm install react
```

### 3. **Add the Component**
Copy `IntelligenceDashboard.jsx` into your React project (e.g., `src/` or `ui/`).

### 4. **Import and Use**
In your main app file (e.g., `App.js`):
```jsx
import IntelligenceDashboard from './ui/IntelligenceDashboard';

function App() {
  return (
    <div>
      <IntelligenceDashboard />
    </div>
  );
}
export default App;
```

### 5. **Start Your Backend**
Make sure your Node.js/Express backend is running and serving the required endpoints and WebSocket.

### 6. **Start Your React App**
```bash
npm start
```

### 7. **Open the Dashboard**
Visit `http://localhost:3000` (or your React dev server port) to see the dashboard in action.

---

## 🎨 Customization
- Update agent icons, colors, and layout in `IntelligenceDashboard.jsx` as needed.
- Add more agent cards, metrics, or insights by extending the component.
- For a static HTML version, use `ui/intelligence-dashboard.html`.

---

## 🧠 Live Data
- The dashboard listens for real-time routing decisions and agent insights via WebSocket.
- Metrics and workflow stats are polled every 5 seconds from the backend.

---

## 🦜 Brand Colors
- Orange: `#f18c25`
- Blue-gray: `#7d8eb2`, `#9daac5`
- Accent: `#f4a555`
- Background: `#f0f2f7`

---

## 📝 License
This dashboard is part of the AIComplyr platform. For internal use and demo purposes. 