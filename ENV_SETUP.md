# Environment Variables Setup

To enable portal switching functionality, you need to set up environment variables in your `.env.local` file.

## Required Environment Variables

Create a `.env.local` file in the `frontend` directory with the following variables:

```env
# Frontend Portal URL
NEXT_PUBLIC_FRONTEND_URL=http://localhost:3000

# Organization Portal URL
NEXT_PUBLIC_ORGANIZATION_PORTAL_URL=http://localhost:3001
```

## Notes

- Replace `http://localhost:3000` with your actual frontend portal URL
- Replace `http://localhost:3001` with your actual organization portal URL
- These URLs should match the ports where your Next.js applications are running
- For production, use your production domain URLs
