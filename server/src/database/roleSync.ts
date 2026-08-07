import Role from '../models/Role';
import { PERMISSION_PRESETS } from '../constants';

const ROLE_DEFS = [
  { name: 'Admin', slug: 'admin', description: 'Full access' },
  { name: 'Manager', slug: 'manager', description: 'Manage content & orders' },
  { name: 'Employee', slug: 'employee', description: 'Orders & reviews' },
  { name: 'Customer', slug: 'customer', description: 'Customer account' },
];

export const ensureRolePermissions = async (): Promise<void> => {
  for (const r of ROLE_DEFS) {
    await Role.updateOne(
      { slug: r.slug },
      {
        $set: {
          name: r.name,
          description: r.description,
          permissions: PERMISSION_PRESETS[r.slug as keyof typeof PERMISSION_PRESETS],
        },
      },
      { upsert: true },
    );
  }
  console.log('[roles] permissions synced from presets');
};