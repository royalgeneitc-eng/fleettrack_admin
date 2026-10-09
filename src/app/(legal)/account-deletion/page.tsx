import type { Metadata } from 'next';
import { LEGAL } from '@/lib/legal';

export const metadata: Metadata = { title: 'Delete your account · FleetTrack' };

export default function AccountDeletionPage() {
  const { product, email } = LEGAL;
  const subject = encodeURIComponent(`${product} account deletion request`);
  return (
    <>
      <h1>Delete your {product} account</h1>
      <p>You can ask us to delete your {product} account, or your whole workspace, at any time.</p>

      <h2>How to request deletion</h2>
      <ul>
        <li>
          Email <a className="font-medium text-brand-600" href={`mailto:${email}?subject=${subject}`}>{email}</a> from the email address on your
          account, with the subject &quot;{product} account deletion request&quot;.
        </li>
        <li>Say whether you want to delete <b>your user account</b> only, or the <b>entire workspace</b> (owners only).</li>
        <li>Drivers and managers can also ask their workspace owner, who can remove them under <b>Team</b> in the web portal.</li>
      </ul>
      <p>We confirm by email and complete the deletion within 30 days.</p>

      <h2>What is deleted</h2>
      <ul>
        <li><b>User account:</b> your name, email, phone number, password and vehicle assignments are deleted. Entries you recorded stay in the workspace as the business&apos;s financial records, no longer linked to your name.</li>
        <li><b>Entire workspace:</b> the workspace, all its users, vehicles, daily entries, expenses and logo are permanently deleted.</li>
      </ul>
      <p>Signing out of the app removes the data stored on your phone.</p>
    </>
  );
}
