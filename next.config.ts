import type { NextConfig } from 'next';

// FleetTrack's privacy policy (incl. account deletion) lives on the company site.
const POLICY = 'https://royalgenegroup.co.ke/privacy/fleettrack';

const nextConfig: NextConfig = {
  serverExternalPackages: ['postgres'],
  async redirects() {
    return [
      { source: '/privacy', destination: POLICY, permanent: false },
      { source: '/account-deletion', destination: `${POLICY}#delete`, permanent: false },
    ];
  },
};

export default nextConfig;
