import React from 'react';
import MetaLoopStatusRing from './MetaLoopStatusRing';
import useUserContext from '../stores/useUserContext';

const AgentCard = ({ 
  name, 
  role, 
  status = 'idle', 
  confidence = 0, 
  showDetailsButton = false,
  onViewDetails
}) => {
  const { userRole } = useUserContext();

  const getConfidenceColor = (confidence) => {
    if (confidence > 90) return 'text-brand-teal';
    if (confidence < 70) return 'text-brand-orange';
    return 'text-slate-700';
  };

  const getConfidenceLabel = (confidence) => {
    if (confidence > 90) return 'Excellent';
    if (confidence > 80) return 'Good';
    if (confidence > 70) return 'Fair';
    return 'Poor';
  };

  const getRoleContextStyles = () => {
    if (userRole === 'pharma') {
      return {
        borderLeft: 'border-l-4 border-brand-indigo',
        badge: 'Pharma Policy Agent',
        badgeColor: 'bg-brand-indigo text-white',
        hoverBg: 'hover:bg-brand-sky/5',
        tone: 'formal'
      };
    } else if (userRole === 'agency') {
      return {
        borderLeft: 'border-l-4 border-brand-teal',
        badge: 'Agency Ops Agent',
        badgeColor: 'bg-brand-teal text-white',
        hoverBg: 'hover:bg-brand-sky/5',
        tone: 'collaborative'
      };
    } else if (userRole === 'innovation') {
      return {
        borderLeft: '',
        badge: 'Innovation Agent',
        badgeColor: 'bg-gradient-brand text-white',
        hoverBg: 'hover:bg-brand-sky/5',
        tone: 'creative'
      };
    }
    return {
      borderLeft: '',
      badge: null,
      badgeColor: '',
      hoverBg: '',
      tone: 'neutral'
    };
  };

  const roleStyles = getRoleContextStyles();

  return (
    <div className={`bg-white rounded-2xl shadow-meta p-6 hover:shadow-lg transition-all duration-300 hover:scale-105 relative ${roleStyles.borderLeft} ${roleStyles.hoverBg}`}>
      {/* Role Context Badge */}
      {roleStyles.badge && (
        <div className={`absolute top-4 left-4 px-2 py-1 rounded-md text-xs font-medium ${roleStyles.badgeColor}`}>
          {roleStyles.badge}
        </div>
      )}

      <div className="space-y-4">
        {/* Top Row - Status Ring and Name */}
        <div className="flex items-center space-x-3">
          <MetaLoopStatusRing status={status} size="small" />
          <h3 className="text-lg font-semibold text-slate-800 flex-1">
            {name}
          </h3>
        </div>

        {/* Role Description */}
        <p className="text-sm text-slate-500 leading-relaxed">
          {role}
        </p>

        {/* Confidence Indicator */}
        <div className="space-y-2">
          <div className="flex items-center justify-between">
            <span className="text-sm font-medium text-slate-600">Confidence</span>
            <span className={`text-sm font-bold ${getConfidenceColor(confidence)}`}>
              {confidence}%
            </span>
          </div>
          
          {/* Confidence Bar */}
          <div className="w-full bg-slate-200 rounded-full h-2">
            <div 
              className={`h-2 rounded-full transition-all duration-300 ${
                confidence > 90 
                  ? 'bg-brand-teal' 
                  : confidence < 70 
                    ? 'bg-brand-orange' 
                    : 'bg-brand-indigo'
              }`}
              style={{ width: `${confidence}%` }}
            />
          </div>
          
          {/* Confidence Label */}
          <p className={`text-xs font-medium ${getConfidenceColor(confidence)}`}>
            {getConfidenceLabel(confidence)}
          </p>
        </div>

        {/* Optional View Details Button */}
        {showDetailsButton && (
          <button 
            className="btn-primary w-full mt-4"
            onClick={onViewDetails}
          >
            View Details
          </button>
        )}
      </div>
    </div>
  );
};

export default AgentCard; 