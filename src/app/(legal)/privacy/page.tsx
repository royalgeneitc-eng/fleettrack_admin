import type { Metadata } from 'next';
import { LEGAL } from '@/lib/legal';

export const metadata: Metadata = { title: 'Privacy policy · FleetTrack' };

export default function PrivacyPage() {
  const { company, product, email, updated } = LEGAL;
  return (
    <>
      <h1>Privacy policy</h1>
      <p className="text-slate-500">Last updated {updated}</p>
      <p>
        {product} (the web portal and the Android app) is provided by {company} (&quot;we&quot;). It lets public-transport and fleet businesses
        record daily vehicle collections, parcels and expenses and view reports. This policy explains what data we handle and why.
      </p>

      <h2>Data we collect</h2>
      <ul>
        <li><b>Account details:</b> name, email address, phone number (optional), role, and a password (stored only as a one-way hash).</li>
        <li><b>Workspace details:</b> business name, contact details, currency and, if uploaded, a company logo.</li>
        <li><b>Business records you enter:</b> vehicles (registration, route, sacco), daily collections, parcels, expenses, monthly fixed costs and notes.</li>
        <li><b>On your phone:</b> the app keeps your sign-in token (encrypted) and a copy of recent entries so you can work offline. This stays on the device and is removed when you sign out.</li>
      </ul>
      <p>We do <b>not</b> collect location, contacts, photos, advertising IDs or usage analytics, and the app contains no ads.</p>

      <h2>How we use it</h2>
      <ul>
        <li>To sign you in and show you only your own workspace&apos;s data.</li>
        <li>To calculate totals and produce dashboards and reports for your workspace.</li>
        <li>To deliver app updates and keep the service secure.</li>
      </ul>
      <p>We do not sell your data or share it for advertising.</p>

      <h2>Who processes it</h2>
      <p>Data is stored and served by our infrastructure providers, acting on our instructions:</p>
      <ul>
        <li>Supabase (PostgreSQL database, hosted in the EU, Frankfurt).</li>
        <li>Vercel (web hosting and API).</li>
        <li>GitHub (hosting of app installation files for the direct-download edition).</li>
      </ul>
      <p>Within a workspace, the owner and managers can see the records entered by drivers assigned to their vehicles.</p>

      <h2>Security</h2>
      <p>All traffic is encrypted with HTTPS, passwords are hashed, and each workspace&apos;s data is kept separate from other workspaces.</p>

      <h2>Retention and deletion</h2>
      <p>
        Business records are kept while the workspace is active, because they are the business&apos;s financial records. You can ask us to delete
        your account or your whole workspace at any time; see <a className="font-medium text-brand-600" href="/account-deletion">Account deletion</a>.
      </p>

      <h2>Children</h2>
      <p>{product} is a business tool and is not intended for children under 18.</p>

      <h2>Changes and contact</h2>
      <p>
        We will post any changes on this page. Questions or requests: <a className="font-medium text-brand-600" href={`mailto:${email}`}>{email}</a>.
      </p>
    </>
  );
}
