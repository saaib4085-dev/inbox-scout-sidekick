import { createClientFromRequest } from 'npm:@base44/sdk@0.8.54';
import { ensureCreditAccount, purgeUserData } from '../../shared/credits.ts';

export default async function (req) {
  try {
    const base44 = createClientFromRequest(req);
    const user = await base44.auth
      .me()
      .catch((e) => (e.status === 401 ? null : Promise.reject(e)));
    if (!user) return Response.json({ error: 'Unauthorized' }, { status: 401 });

    const { action } = await req.json().catch(() => ({}));

    if (action === 'ensure') {
      const account = await ensureCreditAccount(base44, user);
      return Response.json({ account });
    }

    if (action === 'export') {
      const serviceRole = base44.asServiceRole;
      const [account, leadPage, purchasePage] = await Promise.all([
        serviceRole.entities.CreditAccount.filter({ user_email: user.email }),
        serviceRole.entities.Lead.filter({ user_email: user.email }, { limit: 500 }),
        serviceRole.entities.Purchase.filter({ user_email: user.email }, { limit: 500 }),
      ]);

      return Response.json({
        exported_at: new Date().toISOString(),
        profile: { email: user.email, full_name: user.full_name ?? null, role: user.role ?? null },
        credit_account: account[0] ?? null,
        leads: leadPage.items ?? [],
        purchases: purchasePage.items ?? [],
      });
    }

    if (action === 'delete') {
      const purged = await purgeUserData(base44, user.email);

      let profileDeleted = false;
      try {
        await base44.asServiceRole.entities.User.delete(user.id);
        profileDeleted = true;
      } catch (error) {
        profileDeleted = false;
      }

      return Response.json({
        deleted: true,
        profile_deleted: profileDeleted,
        profile_email: user.email,
        purged,
      });
    }

    return Response.json({ error: 'Unknown action' }, { status: 400 });
  } catch (error) {
    return Response.json({ error: error.message }, { status: 500 });
  }
}