# NextGen WOM Deployment Environments

## Branch-Based Deployment Strategy

### Development Environment (dev branch)
- **Frontend URL**: https://vision-west.netlify.app/ (official)
- **Backend API**: https://visionwest-api.onrender.com/
- **Branch**: `dev`
- **Purpose**: Development testing and feature validation
- **Auto-deploy**: Yes (on push to dev branch)

### Production Environment (main branch)
- **Frontend URL**: https://visionwest.wom.wpsg.nz/
- **Backend API**: https://vw-womapi-prod.onrender.com/
- **Branch**: `main`
- **Purpose**: Live production environment
- **Auto-deploy**: Yes (on push to main branch)

## Environment Configuration

### CORS Origins Configuration
Backend servers must be configured to allow requests from their respective frontend domains:

**Development Backend** (`https://visionwest-api.onrender.com/`):
- https://vision-west.netlify.app (official dev domain)
- https://visionwest.netlify.app (alternative dev domain)
- http://localhost:5174 (local development)
- http://localhost:5175 (local development)

**Production Backend** (`https://vw-womapi-prod.onrender.com/`):
- https://visionwest.wom.wpsg.nz/
- https://vision-west.netlify.app (for testing)

### Environment Variables

#### Frontend (Netlify)
- **Dev Branch**: `VITE_API_URL=https://visionwest-api.onrender.com/api`
- **Main Branch**: `VITE_API_URL=https://vw-womapi-prod.onrender.com/api`

#### Backend (Render)
- Database connections and service configurations
- CORS origins whitelist
- JWT secrets and API keys

## Deployment Pipeline
1. **Feature Development**: Work on `dev` branch → Auto-deploy to vision-west.netlify.app
2. **Testing**: Validate features on dev environment
3. **Production Release**: Merge `dev` → `main` → Auto-deploy to visionwest.wom.wpsg.nz

## Troubleshooting
- Check CORS configuration matches frontend domains
- Verify environment variables in Netlify/Render dashboards
- Ensure backend services are running and accessible
- Validate API endpoints return proper responses