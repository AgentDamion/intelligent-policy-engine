import React, { useState, useRef, useEffect } from 'react';

const templates = [
  {
    id: 'pharma_mlr',
    name: 'Pharma MLR Standard',
    description: 'Medical-Legal-Regulatory review workflow with external agency support',
    nodes: [
      { id: 'policy_check', type: 'policy_check', name: 'Initial Policy Check', position: { x: 50, y: 100 }, config: 'Auto-scan for prohibited content' },
      { id: 'mlr_review', type: 'content_review', name: 'MLR Review', position: { x: 300, y: 100 }, config: 'Medical-Legal-Regulatory team' },
      { id: 'final_approval', type: 'human_approval', name: 'Final Approval', position: { x: 550, y: 100 }, config: 'Brand Manager sign-off' },
      { id: 'risk_escalation', type: 'risk_alert', name: 'Risk Escalation', position: { x: 300, y: 250 }, config: 'High-risk content handling' }
    ],
    connections: [
      { from: 'policy_check', to: 'mlr_review', condition: 'approved' },
      { from: 'mlr_review', to: 'final_approval', condition: 'approved' },
      { from: 'policy_check', to: 'risk_escalation', condition: 'high_risk' }
    ]
  },
  {
    id: 'fin_services',
    name: 'Financial Services',
    description: 'FINRA-compliant workflow for marketing materials',
    nodes: [
      { id: 'finra_check', type: 'policy_check', name: 'FINRA Compliance Check', position: { x: 50, y: 100 }, config: 'Regulatory compliance validation' },
      { id: 'legal_review', type: 'content_review', name: 'Legal Review', position: { x: 300, y: 100 }, config: 'Legal team approval' },
      { id: 'regulatory_approval', type: 'human_approval', name: 'Regulatory Approval', position: { x: 550, y: 100 }, config: 'Final regulatory sign-off' }
    ],
    connections: [
      { from: 'finra_check', to: 'legal_review', condition: 'approved' },
      { from: 'legal_review', to: 'regulatory_approval', condition: 'approved' }
    ]
  },
  {
    id: 'creative_agency',
    name: 'Creative Agency Basic',
    description: 'Simple approval workflow for client work',
    nodes: [
      { id: 'content_review', type: 'content_review', name: 'Content Review', position: { x: 50, y: 100 }, config: 'Creative team review' },
      { id: 'client_approval', type: 'human_approval', name: 'Client Approval', position: { x: 300, y: 100 }, config: 'Client sign-off required' }
    ],
    connections: [
      { from: 'content_review', to: 'client_approval', condition: 'approved' }
    ]
  },
  {
    id: 'custom',
    name: 'Start from Scratch',
    description: 'Build your custom workflow from the ground up',
    nodes: [],
    connections: []
  },
];

const buildingBlocks = [
  { type: 'policy_check', name: 'Policy Check', icon: '📋', description: 'Validate against rules' },
  { type: 'human_approval', name: 'Human Approval', icon: '✓', description: 'Require sign-off' },
  { type: 'content_review', name: 'Content Review', icon: '👁', description: 'Manual inspection' },
  { type: 'risk_alert', name: 'Risk Alert', icon: '⚠️', description: 'Notify stakeholders' },
  { type: 'integration', name: 'System Integration', icon: '🔗', description: 'Connect external tools' },
];

const nodeTypes = {
  policy_check: { icon: '📋', color: 'blue', bgColor: 'bg-blue-50', borderColor: 'border-blue-400' },
  human_approval: { icon: '✓', color: 'green', bgColor: 'bg-green-50', borderColor: 'border-green-400' },
  content_review: { icon: '👁', color: 'purple', bgColor: 'bg-purple-50', borderColor: 'border-purple-400' },
  risk_alert: { icon: '⚠️', color: 'red', bgColor: 'bg-red-50', borderColor: 'border-red-400' },
  integration: { icon: '🔗', color: 'orange', bgColor: 'bg-orange-50', borderColor: 'border-orange-400' },
};

export default function WorkflowBuilder() {
  const [selectedTemplate, setSelectedTemplate] = useState('pharma_mlr');
  const [canvasBlocks, setCanvasBlocks] = useState([]);
  const [connections, setConnections] = useState([]);
  const [activeStep, setActiveStep] = useState(1);
  const [selectedNode, setSelectedNode] = useState(null);
  const [isEditingNode, setIsEditingNode] = useState(false);
  const [isCreatingConnection, setIsCreatingConnection] = useState(false);
  const [connectionStart, setConnectionStart] = useState(null);
  const [mousePosition, setMousePosition] = useState({ x: 0, y: 0 });
  const canvasRef = useRef(null);

  // Load template when selected
  useEffect(() => {
    const template = templates.find(t => t.id === selectedTemplate);
    if (template) {
      setCanvasBlocks(template.nodes);
      setConnections(template.connections || []);
    }
  }, [selectedTemplate]);

  // Track mouse position for connection preview
  useEffect(() => {
    const handleMouseMove = (e) => {
      if (canvasRef.current) {
        const rect = canvasRef.current.getBoundingClientRect();
        setMousePosition({
          x: e.clientX - rect.left,
          y: e.clientY - rect.top
        });
      }
    };

    if (isCreatingConnection) {
      document.addEventListener('mousemove', handleMouseMove);
      return () => document.removeEventListener('mousemove', handleMouseMove);
    }
  }, [isCreatingConnection]);

  // Drag and drop handlers
  const handleDragStart = (block) => (e) => {
    e.dataTransfer.setData('block', JSON.stringify(block));
  };

  const handleDrop = (e) => {
    e.preventDefault();
    const block = JSON.parse(e.dataTransfer.getData('block'));
    const rect = canvasRef.current.getBoundingClientRect();
    const x = e.clientX - rect.left;
    const y = e.clientY - rect.top;
    setCanvasBlocks((prev) => [
      ...prev,
      {
        ...block,
        id: `${block.type}_${Date.now()}`,
        position: { x, y },
        config: block.description,
        properties: {
          name: block.name,
          description: block.description,
          assignees: [],
          timeout: 24,
          conditions: []
        }
      },
    ]);
  };

  const handleDragOver = (e) => {
    e.preventDefault();
  };

  // Node selection and editing
  const handleNodeClick = (node) => {
    setSelectedNode(node);
    setIsEditingNode(true);
  };

  const handleNodeUpdate = (updatedNode) => {
    setCanvasBlocks(prev => 
      prev.map(node => node.id === updatedNode.id ? updatedNode : node)
    );
    setIsEditingNode(false);
    setSelectedNode(null);
  };

  // Connection creation
  const handleNodeMouseDown = (node) => {
    if (isCreatingConnection) return;
    
    setConnectionStart(node);
    setIsCreatingConnection(true);
  };

  const handleNodeMouseUp = (targetNode) => {
    if (!isCreatingConnection || !connectionStart || connectionStart.id === targetNode.id) {
      setIsCreatingConnection(false);
      setConnectionStart(null);
      return;
    }

    // Create new connection
    const newConnection = {
      id: `conn_${Date.now()}`,
      from: connectionStart.id,
      to: targetNode.id,
      condition: 'approved'
    };

    setConnections(prev => [...prev, newConnection]);
    setIsCreatingConnection(false);
    setConnectionStart(null);
  };

  // Draw connection lines
  const drawConnections = () => {
    return connections.map((connection) => {
      const fromNode = canvasBlocks.find(n => n.id === connection.from);
      const toNode = canvasBlocks.find(n => n.id === connection.to);
      
      if (!fromNode || !toNode) return null;

      const fromX = fromNode.position.x + 180; // Node width
      const fromY = fromNode.position.y + 25; // Node center
      const toX = toNode.position.x;
      const toY = toNode.position.y + 25;

      return (
        <svg
          key={connection.id}
          className="absolute pointer-events-none"
          style={{ left: 0, top: 0, width: '100%', height: '100%' }}
        >
          <line
            x1={fromX}
            y1={fromY}
            x2={toX}
            y2={toY}
            stroke="#d1d5db"
            strokeWidth="2"
            markerEnd="url(#arrowhead)"
          />
          <defs>
            <marker
              id="arrowhead"
              markerWidth="10"
              markerHeight="7"
              refX="9"
              refY="3.5"
              orient="auto"
            >
              <polygon points="0 0, 10 3.5, 0 7" fill="#d1d5db" />
            </marker>
          </defs>
        </svg>
      );
    });
  };

  // Draw connection preview
  const drawConnectionPreview = () => {
    if (!isCreatingConnection || !connectionStart) return null;

    const fromX = connectionStart.position.x + 180;
    const fromY = connectionStart.position.y + 25;

    return (
      <svg
        className="absolute pointer-events-none"
        style={{ left: 0, top: 0, width: '100%', height: '100%' }}
      >
        <line
          x1={fromX}
          y1={fromY}
          x2={mousePosition.x}
          y2={mousePosition.y}
          stroke="#059669"
          strokeWidth="2"
          strokeDasharray="5,5"
          markerEnd="url(#arrowhead-preview)"
        />
        <defs>
          <marker
            id="arrowhead-preview"
            markerWidth="10"
            markerHeight="7"
            refX="9"
            refY="3.5"
            orient="auto"
          >
            <polygon points="0 0, 10 3.5, 0 7" fill="#059669" />
          </marker>
        </defs>
      </svg>
    );
  };

  const handleContinueSetup = () => {
    setActiveStep(Math.min(activeStep + 1, 4));
  };

  const steps = [
    { step: 1, label: 'Choose Template' },
    { step: 2, label: 'Configure Workflow' },
    { step: 3, label: 'Set Permissions' },
    { step: 4, label: 'Test & Deploy' }
  ];

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Header */}
      <div className="bg-white shadow-sm border-b border-gray-200">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex justify-between items-center h-16">
            <div className="flex items-center space-x-3">
              <div className="h-8 w-8 rounded-full bg-gradient-to-r from-blue-500 to-teal-600 flex items-center justify-center">
                <span className="text-white text-sm font-bold">🐦</span>
              </div>
              <h1 className="text-xl font-semibold text-gray-900">AICOMPLYR.io</h1>
            </div>
            <div className="text-gray-600 text-sm">Enterprise Workflow Setup</div>
          </div>
        </div>
      </div>

      <div className="flex h-[calc(100vh-64px)]">
        {/* Sidebar */}
        <div className="w-80 bg-white border-r border-gray-200 p-6 overflow-y-auto">
          {/* Templates */}
          <div className="mb-8">
            <h3 className="text-sm font-semibold text-gray-700 uppercase tracking-wide mb-4">
              Quick Start Templates
            </h3>
            <div className="space-y-3">
              {templates.map((tpl) => (
                <div
                  key={tpl.id}
                  className={`p-4 border-2 rounded-lg cursor-pointer transition-all ${
                    selectedTemplate === tpl.id
                      ? 'border-green-500 bg-green-50'
                      : 'border-dashed border-gray-300 hover:border-green-400 hover:bg-green-50'
                  }`}
                  onClick={() => setSelectedTemplate(tpl.id)}
                >
                  <div className="font-medium text-gray-900">{tpl.name}</div>
                  <div className="text-sm text-gray-600 mt-1">{tpl.description}</div>
                </div>
              ))}
            </div>
          </div>
          {/* Building Blocks */}
          <div>
            <h3 className="text-sm font-semibold text-gray-700 uppercase tracking-wide mb-4">
              Building Blocks
            </h3>
            <div className="space-y-3">
              {buildingBlocks.map((block) => (
                <div
                  key={block.type}
                  className="p-3 bg-white border border-gray-200 rounded-lg cursor-grab hover:border-green-400 hover:shadow-md transition-all flex items-center space-x-3"
                  draggable
                  onDragStart={handleDragStart(block)}
                >
                  <div className="w-8 h-8 bg-blue-100 rounded flex items-center justify-center text-lg">
                    {block.icon}
                  </div>
                  <div>
                    <div className="font-medium text-gray-900">{block.name}</div>
                    <div className="text-sm text-gray-600">{block.description}</div>
                  </div>
                </div>
              ))}
            </div>
          </div>
        </div>

        {/* Main Canvas */}
        <div className="flex-1 p-6">
          {/* Progress Steps */}
          <div className="bg-white rounded-lg border border-gray-200 p-4 mb-6">
            <div className="flex items-center space-x-8">
              {steps.map(({ step, label }) => (
                <div key={step} className="flex items-center space-x-2">
                  <div className={`w-6 h-6 rounded-full flex items-center justify-center text-xs font-medium ${
                    activeStep >= step ? 'bg-green-500 text-white' : 'bg-gray-200 text-gray-600'
                  }`}>
                    {step}
                  </div>
                  <span className={`text-sm ${activeStep >= step ? 'text-green-600 font-medium' : 'text-gray-500'}`}>
                    {label}
                  </span>
                </div>
              ))}
            </div>
          </div>

          {/* Canvas Header */}
          <div className="flex justify-between items-center mb-4">
            <h2 className="text-xl font-semibold text-gray-900">New Compliance Workflow</h2>
            <div className="flex space-x-3">
              <button className="px-4 py-2 text-sm font-medium text-gray-700 bg-white border border-gray-300 rounded-md hover:bg-gray-50">
                Preview
              </button>
              <button className="px-4 py-2 text-sm font-medium text-gray-700 bg-white border border-gray-300 rounded-md hover:bg-gray-50">
                Save Draft
              </button>
              <button 
                className="px-4 py-2 text-sm font-medium text-white bg-green-600 rounded-md hover:bg-green-700"
                onClick={handleContinueSetup}
              >
                Continue Setup
              </button>
            </div>
          </div>

          {/* Workflow Canvas */}
          <div
            ref={canvasRef}
            className="relative min-h-[500px] bg-white rounded-lg border-2 border-dashed border-gray-300"
            onDrop={handleDrop}
            onDragOver={handleDragOver}
          >
            {/* Connection Lines */}
            {drawConnections()}
            {drawConnectionPreview()}

            {/* Workflow Nodes */}
            {canvasBlocks.map((block) => {
              const nodeType = nodeTypes[block.type];
              const isSelected = selectedNode?.id === block.id;
              const isConnectionStart = connectionStart?.id === block.id;
              
              return (
                <div
                  key={block.id}
                  className={`absolute ${nodeType.bgColor} ${nodeType.borderColor} border-2 rounded-lg shadow-md px-4 py-3 flex items-center space-x-3 cursor-pointer transition-all ${
                    isSelected ? 'ring-2 ring-blue-500 ring-offset-2' : ''
                  } ${isConnectionStart ? 'ring-2 ring-green-500 ring-offset-2' : ''}`}
                  style={{ left: block.position.x, top: block.position.y, minWidth: 180 }}
                  onClick={() => handleNodeClick(block)}
                  onMouseDown={() => handleNodeMouseDown(block)}
                  onMouseUp={() => handleNodeMouseUp(block)}
                >
                  <div className="w-8 h-8 bg-white rounded flex items-center justify-center text-lg">
                    {nodeType.icon}
                  </div>
                  <div>
                    <div className="font-semibold text-gray-900">{block.name}</div>
                    <div className="text-xs text-gray-500">{block.config}</div>
                  </div>
                </div>
              );
            })}

            {canvasBlocks.length === 0 && (
              <div className="absolute inset-0 flex items-center justify-center text-gray-500">
                <div className="text-center">
                  <h3 className="text-lg font-medium mb-2">Start Building Your Workflow</h3>
                  <p className="text-sm">Drag building blocks from the sidebar or choose a template to get started</p>
                </div>
              </div>
            )}
          </div>
        </div>
      </div>

      {/* Node Edit Modal */}
      {isEditingNode && selectedNode && (
        <NodeEditModal
          node={selectedNode}
          onSave={handleNodeUpdate}
          onCancel={() => {
            setIsEditingNode(false);
            setSelectedNode(null);
          }}
        />
      )}
    </div>
  );
}

// Node Edit Modal Component
function NodeEditModal({ node, onSave, onCancel }) {
  const [formData, setFormData] = useState({
    name: node.name || '',
    description: node.config || '',
    assignees: node.properties?.assignees || [],
    timeout: node.properties?.timeout || 24,
    conditions: node.properties?.conditions || []
  });

  const handleSubmit = (e) => {
    e.preventDefault();
    const updatedNode = {
      ...node,
      name: formData.name,
      config: formData.description,
      properties: {
        ...node.properties,
        ...formData
      }
    };
    onSave(updatedNode);
  };

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
      <div className="bg-white rounded-lg shadow-xl p-6 w-96 max-h-[80vh] overflow-y-auto">
        <div className="flex justify-between items-center mb-4">
          <h3 className="text-lg font-semibold text-gray-900">Edit Node</h3>
          <button
            onClick={onCancel}
            className="text-gray-400 hover:text-gray-600"
          >
            ✕
          </button>
        </div>

        <form onSubmit={handleSubmit} className="space-y-4">
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              Node Name
            </label>
            <input
              type="text"
              value={formData.name}
              onChange={(e) => setFormData(prev => ({ ...prev, name: e.target.value }))}
              className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
              required
            />
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              Description
            </label>
            <textarea
              value={formData.description}
              onChange={(e) => setFormData(prev => ({ ...prev, description: e.target.value }))}
              className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
              rows="3"
            />
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              Timeout (hours)
            </label>
            <input
              type="number"
              value={formData.timeout}
              onChange={(e) => setFormData(prev => ({ ...prev, timeout: parseInt(e.target.value) }))}
              className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
              min="1"
              max="168"
            />
          </div>

          <div className="flex justify-end space-x-3 pt-4">
            <button
              type="button"
              onClick={onCancel}
              className="px-4 py-2 text-sm font-medium text-gray-700 bg-white border border-gray-300 rounded-md hover:bg-gray-50"
            >
              Cancel
            </button>
            <button
              type="submit"
              className="px-4 py-2 text-sm font-medium text-white bg-blue-600 rounded-md hover:bg-blue-700"
            >
              Save Changes
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}