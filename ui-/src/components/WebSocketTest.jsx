import React, { useEffect, useState } from 'react';

const WebSocketTest = () => {
  const [connectionStatus, setConnectionStatus] = useState('Connecting...');
  const [messages, setMessages] = useState([]);

  useEffect(() => {
    console.log('🧪 WebSocketTest component mounted - testing direct connection');
    
    const ws = new WebSocket('ws://localhost:3000/ws');
    
    ws.onopen = () => {
      console.log('✅ Direct WebSocket connected successfully!');
      setConnectionStatus('Connected ✅');
    };
    
    ws.onmessage = (event) => {
      const data = JSON.parse(event.data);
      console.log('📨 Direct WebSocket message received:', data.type, data);
      setMessages(prev => [...prev, data].slice(-5));
    };
    
    ws.onerror = (error) => {
      console.log('❌ Direct WebSocket error:', error);
      setConnectionStatus('Error ❌');
    };
    
    ws.onclose = (event) => {
      console.log('🔌 Direct WebSocket closed. Code:', event.code, 'Reason:', event.reason);
      setConnectionStatus('Disconnected 🔴');
    };
    
    return () => {
      console.log('🧹 Cleaning up WebSocket connection');
      ws.close();
    };
  }, []);

  return (
    <div style={{ 
      padding: '20px', 
      background: '#e6f3ff', 
      margin: '10px', 
      borderRadius: '8px',
      border: '2px solid #0066cc',
      fontFamily: 'Arial, sans-serif'
    }}>
      <h2 style={{ margin: '0 0 10px 0', color: '#0066cc' }}>🧪 WebSocket Connection Test</h2>
      <p><strong>Status:</strong> {connectionStatus}</p>
      <p><strong>Messages received:</strong> {messages.length}</p>
      <div style={{ fontSize: '12px', marginTop: '10px', maxHeight: '150px', overflow: 'auto' }}>
        {messages.map((msg, i) => (
          <div key={i} style={{ marginBottom: '5px' }}>
            📨 <strong>{msg.type}</strong>: {JSON.stringify(msg).slice(0, 80)}...
          </div>
        ))}
      </div>
    </div>
  );
};

export default WebSocketTest;
