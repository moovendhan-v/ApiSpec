// AWS IAM-like managed policies for workspace access control

export interface PolicyStatement {
  Effect: 'Allow' | 'Deny';
  Action: string[];
  Resource: string[];
  Condition?: Record<string, any>;
}

export interface ManagedPolicy {
  id: string;
  name: string;
  description: string;
  statements: PolicyStatement[];
}

// Available actions
export const ACTIONS = {
  // Document actions
  'documents:Create': 'Create new documents',
  'documents:Read': 'View documents',
  'documents:Update': 'Edit documents',
  'documents:Delete': 'Delete documents',
  'documents:Publish': 'Publish documents',
  'documents:Version': 'Manage document versions',
  
  // Workspace actions
  'workspace:InviteMembers': 'Invite new members',
  'workspace:RemoveMembers': 'Remove members',
  'workspace:ManageSettings': 'Manage workspace settings',
  'workspace:ManagePolicies': 'Manage policies',
  'workspace:ViewMembers': 'View member list',
  
  // Policy actions
  'policies:Create': 'Create policies',
  'policies:Update': 'Update policies',
  'policies:Delete': 'Delete policies',
  'policies:Attach': 'Attach policies to members',
  'policies:Detach': 'Detach policies from members',
};

// Managed Policies (similar to AWS managed policies)
export const MANAGED_POLICIES: ManagedPolicy[] = [
  {
    id: 'admin-access',
    name: 'Administrator Access',
    description: 'Full access to all workspace resources',
    statements: [
      {
        Effect: 'Allow',
        Action: ['*'],
        Resource: ['*'],
      },
    ],
  },
  {
    id: 'power-user',
    name: 'Power User',
    description: 'Full access to documents but limited workspace management',
    statements: [
      {
        Effect: 'Allow',
        Action: [
          'documents:*',
          'workspace:ViewMembers',
        ],
        Resource: ['*'],
      },
    ],
  },
  {
    id: 'read-only',
    name: 'Read Only Access',
    description: 'View-only access to all documents',
    statements: [
      {
        Effect: 'Allow',
        Action: ['documents:Read'],
        Resource: ['*'],
      },
    ],
  },
  {
    id: 'document-editor',
    name: 'Document Editor',
    description: 'Create and edit documents',
    statements: [
      {
        Effect: 'Allow',
        Action: [
          'documents:Create',
          'documents:Read',
          'documents:Update',
          'documents:Version',
        ],
        Resource: ['*'],
      },
    ],
  },
  {
    id: 'document-publisher',
    name: 'Document Publisher',
    description: 'Create, edit, and publish documents',
    statements: [
      {
        Effect: 'Allow',
        Action: [
          'documents:Create',
          'documents:Read',
          'documents:Update',
          'documents:Publish',
          'documents:Version',
        ],
        Resource: ['*'],
      },
    ],
  },
  {
    id: 'team-manager',
    name: 'Team Manager',
    description: 'Manage team members and view documents',
    statements: [
      {
        Effect: 'Allow',
        Action: [
          'documents:Read',
          'workspace:InviteMembers',
          'workspace:RemoveMembers',
          'workspace:ViewMembers',
        ],
        Resource: ['*'],
      },
    ],
  },
];

// Helper function to check if a member has permission
export function hasPermission(
  memberPolicies: any[],
  action: string,
  resource: string
): boolean {
  let allowed = false;
  let denied = false;

  for (const policy of memberPolicies) {
    if (!policy.isActive) continue;

    const statements = Array.isArray(policy.statements) 
      ? policy.statements 
      : JSON.parse(policy.statements || '[]');

    for (const statement of statements) {
      // Check if action matches
      const actionMatches = statement.Action.some((a: string) => {
        if (a === '*') return true;
        if (a.endsWith(':*')) {
          const prefix = a.replace(':*', '');
          return action.startsWith(prefix);
        }
        return a === action;
      });

      if (!actionMatches) continue;

      // Check if resource matches
      const resourceMatches = statement.Resource.some((r: string) => {
        if (r === '*') return true;
        // Support wildcards like "api-doc-*"
        const pattern = r.replace(/\*/g, '.*');
        const regex = new RegExp(`^${pattern}$`);
        return regex.test(resource);
      });

      if (!resourceMatches) continue;

      // Apply effect
      if (statement.Effect === 'Allow') {
        allowed = true;
      } else if (statement.Effect === 'Deny') {
        denied = true;
      }
    }
  }

  // Deny always takes precedence
  return allowed && !denied;
}

// Helper to create custom policy statement
export function createPolicyStatement(
  effect: 'Allow' | 'Deny',
  actions: string[],
  resources: string[],
  conditions?: Record<string, any>
): PolicyStatement {
  return {
    Effect: effect,
    Action: actions,
    Resource: resources,
    ...(conditions && { Condition: conditions }),
  };
}

// Example custom policies
export const CUSTOM_POLICY_EXAMPLES = [
  {
    name: 'API Doc V1 Editor',
    description: 'Edit only documents starting with api-doc-v1-',
    statements: [
      {
        Effect: 'Allow' as const,
        Action: ['documents:Read', 'documents:Update'],
        Resource: ['api-doc-v1-*'],
      },
    ],
  },
  {
    name: 'Production Publisher',
    description: 'Publish only production documents',
    statements: [
      {
        Effect: 'Allow' as const,
        Action: ['documents:Read', 'documents:Publish'],
        Resource: ['*-prod', '*-production'],
      },
    ],
  },
  {
    name: 'Restricted Editor',
    description: 'Edit all except production documents',
    statements: [
      {
        Effect: 'Allow' as const,
        Action: ['documents:Read', 'documents:Update'],
        Resource: ['*'],
      },
      {
        Effect: 'Deny' as const,
        Action: ['documents:Update', 'documents:Delete'],
        Resource: ['*-prod', '*-production'],
      },
    ],
  },
];
