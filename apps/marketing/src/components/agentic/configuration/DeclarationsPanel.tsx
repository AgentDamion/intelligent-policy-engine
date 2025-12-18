import { useState } from 'react';
import { DeclarationFilters } from './DeclarationFilters';
import { DeclarationList } from './DeclarationList';
import { DeclarationDetail } from './DeclarationDetail';

export function DeclarationsPanel() {
  const [selectedDeclarationId, setSelectedDeclarationId] = useState<string | null>(null);
  const [filters, setFilters] = useState({
    partnerId: '',
    projectId: '',
    status: '',
    dateRange: { from: '', to: '' },
    fileType: '',
    riskTier: '',
  });

  return (
    <div className="grid grid-cols-12 gap-4 h-full">
      {/* Left Panel: Filters */}
      <div className="col-span-3">
        <DeclarationFilters filters={filters} onFiltersChange={setFilters} />
      </div>

      {/* Center Panel: List */}
      <div className="col-span-4">
        <DeclarationList
          filters={filters}
          selectedId={selectedDeclarationId}
          onSelect={setSelectedDeclarationId}
        />
      </div>

      {/* Right Panel: Detail */}
      <div className="col-span-5">
        {selectedDeclarationId ? (
          <DeclarationDetail declarationId={selectedDeclarationId} />
        ) : (
          <div className="h-full flex items-center justify-center text-muted-foreground">
            Select a declaration to view details
          </div>
        )}
      </div>
    </div>
  );
}
