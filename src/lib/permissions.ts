/**
 * Permission System
 *
 * Manages user permissions for tool usage with "once" or "always" approval.
 * Based on Anthropic's permissions guide.
 */

export interface PermissionDecision {
  behavior: 'allow' | 'deny';
  updatedInput?: any;
  message?: string;
  interrupt?: boolean;
}

export interface PermissionRecord {
  tool_name: string;
  approved: boolean;
  always: boolean; //  If true, always approve this tool
  timestamp: Date;
}

class PermissionManager {
  private permissions = new Map<string, PermissionRecord>();
  private onPermissionRequest?: (toolName: string, input: any) => Promise<{ approve: boolean; always: boolean }>;

  /**
   * Set the callback for requesting user permission
   */
  setPermissionRequestHandler(handler: (toolName: string, input: any) => Promise<{ approve: boolean; always: boolean }>) {
    this.onPermissionRequest = handler;
  }

  /**
   * Check if a tool is approved (either once or always)
   */
  async checkPermission(toolName: string, input: any): Promise<PermissionDecision> {
    // Check if we have an "always" approval for this tool
    const record = this.permissions.get(toolName);
    if (record && record.approved && record.always) {
      console.log(`✅ Tool ${toolName} auto-approved (always)`);
      return {
        behavior: 'allow',
        updatedInput: input,
      };
    }

    // Need to ask for permission
    if (!this.onPermissionRequest) {
      // No handler set - deny by default
      return {
        behavior: 'deny',
        message: 'Permission required but no permission handler configured',
      };
    }

    const { approve, always } = await this.onPermissionRequest(toolName, input);

    // Store the decision
    this.permissions.set(toolName, {
      tool_name: toolName,
      approved: approve,
      always: always,
      timestamp: new Date(),
    });

    if (approve) {
      console.log(`✅ Tool ${toolName} approved (${always ? 'always' : 'once'})`);
      return {
        behavior: 'allow',
        updatedInput: input,
      };
    } else {
      console.log(`❌ Tool ${toolName} denied`);
      return {
        behavior: 'deny',
        message: 'User denied permission for this tool',
      };
    }
  }

  /**
   * Get canUseTool callback for SDK
   */
  getCanUseToolCallback() {
    return async (toolName: string, input: any): Promise<PermissionDecision> => {
      return this.checkPermission(toolName, input);
    };
  }

  /**
   * Clear all permissions (useful for testing or session reset)
   */
  clearPermissions() {
    this.permissions.clear();
  }

  /**
   * Get all stored permissions
   */
  getPermissions(): PermissionRecord[] {
    return Array.from(this.permissions.values());
  }
}

export const permissionManager = new PermissionManager();
