/** @type {import('next').NextConfig} */
const nextConfig = {
    images: {
        domains: [
            'res.cloudinary.com',
            'ik.imagekit.io',
            'localhost',
            '127.0.0.1',
            'api.gosplash.ai',
        ],
    },
};

export default nextConfig;
