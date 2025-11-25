# Employee Portal Frontend

This is the frontend application for the Employee Portal built with React and Vite.

## Deployment Instructions

### Environment Variables

Create a `.env` file in the frontend directory with the following variables:

```
VITE_API_URL=https://your-backend-url.com
```

### Vercel Deployment

1. Push your code to a GitHub repository
2. Connect the repository to Vercel
3. Set the build command to `npm run build`
4. Set the output directory to `dist`
5. Set the root directory to `frontend`
6. Add the `VITE_API_URL` environment variable in Vercel project settings

### Local Development

1. Install dependencies: `npm install`
2. Start the development server: `npm run dev`

## Backend Deployment

The backend needs to be deployed separately. You can use services like Render, Heroku, or any cloud provider that supports Node.js applications.
