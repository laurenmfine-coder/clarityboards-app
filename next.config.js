const createNextIntlPlugin = require('next-intl/plugin')

const withNextIntl = createNextIntlPlugin('./i18n.ts')

/** @type {import('next').NextConfig} */
const nextConfig = {
  experimental: {
    missingSuspenseWithCSRBailout: false,
  },
  async rewrites() {
    return {
      beforeFiles: [
        // Chore Bank: caseclinica.com opens straight to it
        { source: '/', has: [{ type: 'host', value: '(www\\.)?caseclinica\\.com' }], destination: '/chorebank.html' },
      ],
      afterFiles: [
        { source: '/chores', destination: '/chorebank.html' },
      ],
    }
  },
}

module.exports = withNextIntl(nextConfig)

