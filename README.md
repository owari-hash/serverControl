# Next.js Project Manager

Automated Next.js project deployment system for Ubuntu servers.

## Features

- **POST API** to create new Next.js projects automatically
- **Auto-dependency installation** and project building
- **Port management** - assigns available ports automatically
- **Process management** - start/stop projects
- **REST API** for project management

## Setup

### 1. Install Dependencies
```bash
npm install
```

### 2. Create Projects Directory
```bash
sudo mkdir -p /home/projects
sudo chown $USER:$USER /home/projects
```

### 3. Start the Manager
```bash
npm start
```

The manager will run on port 3001.

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

## Security Notes

- The API runs on all interfaces (0.0.0.0) - consider firewall rules
- Projects run as the same user as the manager
- Consider adding authentication for production use

## Monitoring

Check the manager logs to see:
- Project creation progress
- Build status
- Running project logs
- Error messages

## Troubleshooting

### Port Already in Use
If a port is already in use by another service, the manager will skip it and use the next available port.

### Build Failures
Check the manager logs for build errors. Common issues:
- Missing dependencies
- Syntax errors in generated code
- Insufficient system resources

### Projects Not Starting
Ensure:
- Sufficient system memory
- Available disk space
- No conflicting processes on assigned ports
