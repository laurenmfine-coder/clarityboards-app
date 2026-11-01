/** @type {import('next').NextConfig} */
module.exports = {
  async rewrites() {
    return { beforeFiles: [{ source: '/', destination: '/chorebank.html' }, { source: '/chores', destination: '/chorebank.html' }] }
  },
}
