import { SecuritySettings } from '@/components/security/SecuritySettings';
import { SecurityDashboard } from '@/components/security/SecurityDashboard';
import { PasswordResetApproval } from '@/components/admin/PasswordResetApproval';

export function AccessSecurityManager() {
  return (
    <div className="space-y-4">
      <SecurityDashboard />
      <PasswordResetApproval />
      <SecuritySettings />
    </div>
  );
}
