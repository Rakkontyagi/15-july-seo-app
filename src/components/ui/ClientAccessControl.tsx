
import React, { useState } from 'react';
import { Input } from './Input'; // Assuming an Input component exists
import { Button } from './Button'; // Assuming a Button component exists

export interface UserAccess {
  id: string;
  name: string;
  email: string;
  role: 'admin' | 'editor' | 'viewer';
}

interface ClientAccessControlProps {
  projectId: string;
  currentUsers: UserAccess[];
  onAddUser: (email: string, role: UserAccess['role']) => void;
  onUpdateUserRole: (userId: string, role: UserAccess['role']) => void;
  onRemoveUser: (userId: string) => void;
  className?: string;
}

const roles = [
  { label: 'Admin', value: 'admin' },
  { label: 'Editor', value: 'editor' },
  { label: 'Viewer', value: 'viewer' },
];

const ClientAccessControl: React.FC<ClientAccessControlProps> = ({
  projectId,
  currentUsers,
  onAddUser,
  onUpdateUserRole,
  onRemoveUser,
  className,
}) => {
  const [newUserEmail, setNewUserEmail] = useState('');
  const [newUserRole, setNewUserRole] = useState<UserAccess['role']>(roles[0].value as UserAccess['role']);

  const handleAddUser = (e: React.FormEvent) => {
    e.preventDefault();
    if (newUserEmail.trim()) {
      onAddUser(newUserEmail.trim(), newUserRole);
      setNewUserEmail('');
    }
  };

  return (
    <div className={`p-4 border border-gray-200 rounded-md shadow-sm ${className}`}>
      <h3 className="text-lg font-semibold mb-4">Project Access Control</h3>
      <p className="text-sm text-gray-600 mb-4">Manage who has access to Project ID: {projectId}</p>

      {/* Add New User */}
      <form onSubmit={handleAddUser} className="flex space-x-2 mb-6">
        <Input
          type="email"
          placeholder="User email"
          value={newUserEmail}
          onChange={(e) => setNewUserEmail(e.target.value)}
          required
          className="flex-grow"
        />
        <select
          value={newUserRole}
          onChange={(e) => setNewUserRole(e.target.value as UserAccess['role'])}
          className="p-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
        >
          {roles.map(role => (
            <option key={role.value} value={role.value}>{role.label}</option>
          ))}
        </select>
        <Button type="submit">Add User</Button>
      </form>

      {/* Current Users List */}
      <div>
        <h4 className="text-md font-medium text-gray-700 mb-2">Current Users</h4>
        {
          currentUsers.length === 0 ? (
            <p className="text-gray-500 text-sm">No users with access yet.</p>
          ) : (
            <ul className="space-y-2">
              {currentUsers.map(user => (
                <li key={user.id} className="flex justify-between items-center p-2 bg-gray-50 rounded-md">
                  <div>
                    <p className="text-sm font-medium text-gray-800">{user.name} ({user.email})</p>
                    <p className="text-xs text-gray-600">Role: {user.role}</p>
                  </div>
                  <div className="flex space-x-2">
                    <select
                      value={user.role}
                      onChange={(e) => onUpdateUserRole(user.id, e.target.value as UserAccess['role'])}
                      className="p-1 border border-gray-300 rounded-md text-xs"
                    >
                      {roles.map(role => (
                        <option key={role.value} value={role.value}>{role.label}</option>
                      ))}
                    </select>
                    <Button onClick={() => onRemoveUser(user.id)} variant="destructive" size="sm">
                      Remove
                    </Button>
                  </div>
                </li>
              ))}
            </ul>
          )
        }
      </div>
    </div>
  );
};

export default ClientAccessControl;
