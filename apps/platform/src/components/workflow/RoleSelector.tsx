import React, { useState } from 'react';
import { EdgeCard, EdgeCardHeader, EdgeCardBody } from '../ui/edge-card';
import { AICOMPLYRButton } from '../ui/aicomplyr-button';
import { useRoleArchetypes } from '@/hooks/useRoleArchetypes';
import { DEFAULT_ROLE_ARCHETYPES } from '@/services/workflow/roleArchetypeService';
import * as LucideIcons from 'lucide-react';
import { X } from 'lucide-react';

interface RoleSelectorProps {
  onSelect: (roleId: string) => void;
  onClose: () => void;
  excludeRoles?: string[];
}

const getIconComponent = (iconName: string) => {
  const IconComponent = (LucideIcons as any)[iconName] || LucideIcons.User;
  return IconComponent;
};

export const RoleSelector: React.FC<RoleSelectorProps> = ({
  onSelect,
  onClose,
  excludeRoles = [],
}) => {
  const { archetypes } = useRoleArchetypes();
  const [searchTerm, setSearchTerm] = useState('');

  const availableRoles = archetypes.filter(
    (a) => !excludeRoles.includes(a.id)
  );

  const filteredRoles = availableRoles.filter((role) =>
    role.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
    role.id.toLowerCase().includes(searchTerm.toLowerCase())
  );

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
      <EdgeCard className="w-full max-w-2xl max-h-[80vh] overflow-hidden flex flex-col">
        <EdgeCardHeader>
          <div className="flex items-center justify-between">
            <h3 className="text-lg font-semibold text-aicomplyr-black">Select Role</h3>
            <button
              onClick={onClose}
              className="p-1 hover:bg-neutral-100 transition-colors"
              aria-label="Close"
            >
              <X className="w-5 h-5 text-neutral-600" />
            </button>
          </div>
        </EdgeCardHeader>
        <EdgeCardBody className="flex-1 overflow-y-auto">
          <div className="mb-4">
            <input
              type="text"
              placeholder="Search roles..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="w-full px-3 py-2 border border-neutral-300 focus:outline-none focus:border-aicomplyr-black"
            />
          </div>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
            {filteredRoles.length === 0 ? (
              <div className="col-span-2 text-center py-8 text-neutral-500">
                No roles found
              </div>
            ) : (
              filteredRoles.map((role) => {
                const archetype = DEFAULT_ROLE_ARCHETYPES[role.id] || {
                  name: role.name,
                  icon: role.icon || 'user',
                  color: role.color || 'stone',
                };
                const IconComponent = getIconComponent(archetype.icon);

                return (
                  <button
                    key={role.id}
                    onClick={() => {
                      onSelect(role.id);
                      onClose();
                    }}
                    className="border-l-4 border-l-aicomplyr-black bg-white p-4 text-left hover:bg-neutral-50 transition-colors"
                  >
                    <div className="flex items-center gap-3">
                      <IconComponent className="w-5 h-5 text-aicomplyr-black" />
                      <div>
                        <div className="font-semibold text-sm text-aicomplyr-black">
                          {role.name}
                        </div>
                        {role.description && (
                          <div className="text-xs text-neutral-500 mt-1">
                            {role.description}
                          </div>
                        )}
                      </div>
                    </div>
                  </button>
                );
              })
            )}
          </div>
        </EdgeCardBody>
      </EdgeCard>
    </div>
  );
};

