# Next.js Project Manager

Automated Next.js project deployment system for Ubuntu servers with PM2 process management.

## Features

- **POST API** to create new Next.js projects automatically
- **Auto-dependency installation** and project building
- **Port management** - assigns available ports automatically
- **Process management** with PM2 - auto-restart, monitoring
- **REST API** for project management
- **Production-ready** with logging and persistence

## Quick Deployment

### 1. Clone and Deploy
```bash
git clone https://github.com/owari-hash/serverControl.git
cd serverControl
chmod +x deploy.sh
./deploy.sh
```

### 2. Manual Setup
```bash
# Install PM2 globally
npm install -g pm2

# Create directories
mkdir -p /home/projects logs

# Install dependencies
npm install

# Start with PM2
pm2 start ecosystem.config.js

# Save PM2 configuration
pm2 save

# Setup PM2 to start on boot
pm2 startup
pm2 save
```

## API Endpoints

### Create New Project
```bash
POST /api/create-project
Content-Type: application/json

{
  "projectName": "my-app"
}
```

**Response:**
```json
{
  "success": true,
  "projectName": "my-app",
  "port": 3000,
  "url": "http://localhost:3000",
  "message": "Project my-app created and running on port 3000"
}
```

### List All Projects
```bash
GET /api/projects
```

**Response:**
```json
[
  {
    "name": "my-app",
    "port": 3000,
    "url": "http://localhost:3000",
    "createdAt": "2024-01-01T12:00:00.000Z"
  }
]
```

### Stop a Project
```bash
DELETE /api/projects/my-app
```

## PM2 Management

### Basic Commands
```bash
pm2 status              # Check status
pm2 logs                # View logs
pm2 logs nextjs-project-manager  # View specific app logs
pm2 restart all         # Restart all apps
pm2 stop all            # Stop all apps
pm2 monit               # Open monitoring dashboard
pm2 delete all          # Remove all apps
```

### Log Management
```bash
# View real-time logs
pm2 logs

# View error logs
pm2 logs --err

# View logs for last 100 lines
pm2 logs --lines 100

# Clear logs
pm2 flush
```

### Process Management
```bash
# Restart the manager
pm2 restart nextjs-project-manager

# Reload without downtime
pm2 reload nextjs-project-manager

# Get detailed info
pm2 show nextjs-project-manager
```

## Usage Examples

### Using curl
```bash
# Create a new project
curl -X POST http://your-server-ip:3001/api/create-project \
  -H "Content-Type: application/json" \
  -d '{"projectName": "dashboard"}'

# List projects
curl http://your-server-ip:3001/api/projects

# Stop a project
curl -X DELETE http://your-server-ip:3001/api/projects/dashboard
```

### Using JavaScript
```javascript
// Create project
const response = await fetch('http://your-server-ip:3001/api/create-project', {
  method: 'POST',
  headers: { 'Content-Type': 'application/json' },
  body: JSON.stringify({ projectName: 'my-new-app' })
});
const result = await response.json();
console.log(result.url); // http://your-server-ip:3000
```

## Port Assignment

- Projects are automatically assigned ports starting from 3000
- Each project gets a unique port
- When a project stops, its port becomes available again

## Project Structure

Each created project follows the standard Next.js structure:
```
/home/projects/my-app/
├── src/
├── public/
├── package.json
├── next.config.js
└── ... (standard Next.js files)
```

## Monitoring and Logs

### PM2 Monitoring
```bash
# Open monitoring dashboard
pm2 monit

# Check CPU/Memory usage
pm2 status

# View process details
pm2 show nextjs-project-manager
```

### Log Files
- **Error logs:** `./logs/err.log`
- **Output logs:** `./logs/out.log`
- **Combined logs:** `./logs/combined.log`

### Web Monitoring (Optional)
```bash
# Install PM2 Plus monitoring
pm2 install pm2-server-monit

# Access web dashboard at
# http://your-server-ip:9615
```

## Production Considerations

### Security
- Configure firewall rules for ports 3001 and project ports
- Consider adding API authentication
- Use HTTPS in production

### Performance
- Monitor memory usage with `pm2 monit`
- Adjust `max_memory_restart` in ecosystem.config.js
- Consider using clustering for high load

### Backup
```bash
# Backup PM2 configuration
pm2 save

# Export configuration
pm2 ecosystem > ecosystem.backup.js

# Backup projects directory
tar -czf projects-backup.tar.gz /home/projects
```

## Troubleshooting

### Common Issues

**Manager not starting:**
```bash
# Check PM2 status
pm2 status

# View logs
pm2 logs nextjs-project-manager

# Check Node.js version
node --version  # Should be 16+
```

**Port conflicts:**
```bash
# Check what's using ports
sudo netstat -tlnp | grep :3001

# Kill conflicting processes
sudo kill -9 <PID>
```

**Build failures:**
```bash
# Check disk space
df -h

# Check memory
free -h

# View detailed logs
pm2 logs --lines 50
```

### Recovery
```bash
# Complete restart
pm2 delete all
pm2 start ecosystem.config.js
pm2 save

# Reset PM2
pm2 kill
pm2 start ecosystem.config.js
pm2 save
```

## Environment Variables

Create `.env` file for configuration:
```env
NODE_ENV=production
PORT=3001
PROJECTS_DIR=/home/projects
BASE_PORT=3000
MAX_PROJECTS=50
```

## Postman Collection

Import `Postman_Collection.json` for ready-to-use API testing.

## Support

- Check PM2 logs for errors
- Monitor system resources
- Ensure sufficient disk space for projects
- Verify network connectivity for API access
