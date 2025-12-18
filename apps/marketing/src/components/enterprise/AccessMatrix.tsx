import React, { useState, useEffect } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Badge } from '@/components/ui/badge';
import { Download, Plus, X, Filter } from 'lucide-react';
import { useToast } from '@/hooks/use-toast';
import { supabase } from '@/integrations/supabase/client';

interface AccessMatrixProps {
  enterpriseId: string;
}

interface RoleAssignment {
  userId: string;
  userName: string;
  scopeId: string;
  scopeName: string;
  scopePath: string;
  role: string;
  isDirect: boolean;
  inheritedFrom?: string;
}

export default function AccessMatrix({ enterpriseId }: AccessMatrixProps) {
  const [assignments, setAssignments] = useState<RoleAssignment[]>([]);
  const [scopes, setScopes] = useState<any[]>([]);
  const [users, setUsers] = useState<any[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [filterScopeType, setFilterScopeType] = useState<string>('all');
  const [filterRole, setFilterRole] = useState<string>('all');
  const [filterUser, setFilterUser] = useState<string>('');
  const { toast } = useToast();

  useEffect(() => {
    loadAccessMatrix();
  }, [enterpriseId]);

  const loadAccessMatrix = async () => {
    try {
      setIsLoading(true);

      // Load scopes
      const { data: scopesData } = await supabase
        .from('scopes')
        .select('*')
        .eq('enterprise_id', enterpriseId)
        .order('scope_path');

      // Load user roles from access_matrix view
      const { data: matrixData } = await supabase
        .from('access_matrix_scope_first')
        .select('*')
        .eq('enterprise_id', enterpriseId);

      setScopes(scopesData || []);
      
      // Transform matrix data into assignments
      const assignmentsData: RoleAssignment[] = (matrixData || []).map((row: any) => ({
        userId: row.user_id,
        userName: row.user_name,
        scopeId: row.scope_id,
        scopeName: row.scope_name,
        scopePath: row.scope_path,
        role: row.role,
        isDirect: true, // Simplified - would need additional logic to detect inheritance
      }));

      setAssignments(assignmentsData);

      // Get unique users
      const uniqueUsers = Array.from(
        new Map(assignmentsData.map(a => [a.userId, { id: a.userId, name: a.userName }])).values()
      );
      setUsers(uniqueUsers);

    } catch (error) {
      console.error('Error loading access matrix:', error);
      toast({
        title: 'Error',
        description: 'Failed to load access matrix',
        variant: 'destructive',
      });
    } finally {
      setIsLoading(false);
    }
  };

  const filteredScopes = scopes.filter(scope => 
    filterScopeType === 'all' || scope.scope_type === filterScopeType
  );

  const filteredUsers = users.filter(user =>
    filterUser === '' || user.name.toLowerCase().includes(filterUser.toLowerCase())
  );

  const getRoleForUserScope = (userId: string, scopeId: string) => {
    return assignments.find(a => a.userId === userId && a.scopeId === scopeId);
  };

  const exportToCSV = () => {
    const headers = ['User', 'Scope', 'Scope Path', 'Role', 'Type'];
    const rows = assignments.map(a => [
      a.userName,
      a.scopeName,
      a.scopePath,
      a.role,
      a.isDirect ? 'Direct' : 'Inherited'
    ]);

    const csv = [headers, ...rows].map(row => row.join(',')).join('\n');
    const blob = new Blob([csv], { type: 'text/csv' });
    const url = URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.href = url;
    link.download = 'access-matrix.csv';
    link.click();
    URL.revokeObjectURL(url);

    toast({
      title: 'Success',
      description: 'Access matrix exported to CSV',
    });
  };

  const addRoleAssignment = async (userId: string, scopeId: string, role: string) => {
    try {
      const { error } = await supabase
        .from('user_roles')
        .insert([{
          user_id: userId,
          role: role as any,
          enterprise_id: enterpriseId,
          scope_id: scopeId,
        }]);

      if (error) throw error;

      toast({
        title: 'Success',
        description: 'Role assignment added',
      });

      loadAccessMatrix();
    } catch (error) {
      console.error('Error adding role:', error);
      toast({
        title: 'Error',
        description: 'Failed to add role assignment',
        variant: 'destructive',
      });
    }
  };

  const removeRoleAssignment = async (userId: string, scopeId: string) => {
    try {
      const { error } = await supabase
        .from('user_roles')
        .delete()
        .eq('user_id', userId)
        .eq('enterprise_id', enterpriseId);

      if (error) throw error;

      toast({
        title: 'Success',
        description: 'Role assignment removed',
      });

      loadAccessMatrix();
    } catch (error) {
      console.error('Error removing role:', error);
      toast({
        title: 'Error',
        description: 'Failed to remove role assignment',
        variant: 'destructive',
      });
    }
  };

  return (
    <Card>
      <CardHeader>
        <div className="flex items-center justify-between">
          <CardTitle>Access Control Matrix</CardTitle>
          <Button onClick={exportToCSV} variant="outline" size="sm">
            <Download className="h-4 w-4 mr-2" />
            Export CSV
          </Button>
        </div>
        
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mt-4">
          <div>
            <label className="text-sm font-medium mb-2 block">Filter by Scope Type</label>
            <Select value={filterScopeType} onValueChange={setFilterScopeType}>
              <SelectTrigger className="bg-background">
                <SelectValue />
              </SelectTrigger>
              <SelectContent className="bg-popover z-50">
                <SelectItem value="all">All Scope Types</SelectItem>
                <SelectItem value="enterprise">Enterprise</SelectItem>
                <SelectItem value="region">Region</SelectItem>
                <SelectItem value="country">Country</SelectItem>
                <SelectItem value="brand">Brand</SelectItem>
              </SelectContent>
            </Select>
          </div>

          <div>
            <label className="text-sm font-medium mb-2 block">Filter by Role</label>
            <Select value={filterRole} onValueChange={setFilterRole}>
              <SelectTrigger className="bg-background">
                <SelectValue />
              </SelectTrigger>
              <SelectContent className="bg-popover z-50">
                <SelectItem value="all">All Roles</SelectItem>
                <SelectItem value="admin">Admin</SelectItem>
                <SelectItem value="member">Member</SelectItem>
                <SelectItem value="viewer">Viewer</SelectItem>
              </SelectContent>
            </Select>
          </div>

          <div>
            <label className="text-sm font-medium mb-2 block">Search User</label>
            <Input
              placeholder="Search by name..."
              value={filterUser}
              onChange={(e) => setFilterUser(e.target.value)}
            />
          </div>
        </div>
      </CardHeader>

      <CardContent>
        {isLoading ? (
          <div className="text-center py-8 text-muted-foreground">Loading access matrix...</div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full border-collapse">
              <thead>
                <tr className="border-b">
                  <th className="text-left p-3 font-medium bg-muted">User</th>
                  {filteredScopes.map(scope => (
                    <th key={scope.id} className="text-left p-3 font-medium bg-muted min-w-[150px]">
                      <div className="flex flex-col gap-1">
                        <span>{scope.scope_name}</span>
                        <Badge variant="outline" className="text-xs w-fit">
                          {scope.scope_type}
                        </Badge>
                      </div>
                    </th>
                  ))}
                </tr>
              </thead>
              <tbody>
                {filteredUsers.map(user => (
                  <tr key={user.id} className="border-b hover:bg-muted/50">
                    <td className="p-3 font-medium">{user.name}</td>
                    {filteredScopes.map(scope => {
                      const assignment = getRoleForUserScope(user.id, scope.id);
                      return (
                        <td key={`${user.id}-${scope.id}`} className="p-3">
                          {assignment ? (
                            <div className="flex items-center gap-2">
                              <Badge 
                                className={assignment.isDirect ? 'bg-green-500' : 'bg-blue-500'}
                              >
                                {assignment.role}
                              </Badge>
                              <Button
                                size="sm"
                                variant="ghost"
                                onClick={() => removeRoleAssignment(user.id, scope.id)}
                              >
                                <X className="h-3 w-3" />
                              </Button>
                            </div>
                          ) : (
                            <Button
                              size="sm"
                              variant="ghost"
                              onClick={() => addRoleAssignment(user.id, scope.id, 'viewer')}
                            >
                              <Plus className="h-3 w-3" />
                            </Button>
                          )}
                        </td>
                      );
                    })}
                  </tr>
                ))}
              </tbody>
            </table>

            <div className="mt-4 flex items-center gap-4 text-sm">
              <div className="flex items-center gap-2">
                <Badge className="bg-green-500">Direct</Badge>
                <span className="text-muted-foreground">Direct assignment</span>
              </div>
              <div className="flex items-center gap-2">
                <Badge className="bg-blue-500">Inherited</Badge>
                <span className="text-muted-foreground">Inherited from parent</span>
              </div>
              <div className="flex items-center gap-2">
                <div className="w-6 h-6 bg-muted rounded" />
                <span className="text-muted-foreground">No access</span>
              </div>
            </div>
          </div>
        )}
      </CardContent>
    </Card>
  );
}
