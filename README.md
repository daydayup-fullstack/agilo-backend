# Backend for Agilo (Temporary)

### Hosted on Firebase cloud function

- [x] `GET /api`
  - Handshake
- [x] `GET /user/:id` - Depth 1
  - Load user, default workspace & projects basic information

### Workspace

- [x] `GET /workspaces/:workspaceId/members`
  - Load all the member under workspace

### Project

- [x] `POST /projects`
  - Create a new project
- [x] `DELETE /projects/:projectId`
- [x] `PUT /projects/:projectId`
- [x] `GET /projects/:id` - Depth 2
  - Load all columns & tasks under a project

### Column

- [x] `POST /projects/:projectId/columns`
- [x] `DELETE /projects/:projectId/columns/:columnId`
- [x] `PUT /columns/:columnId`

### Task

- [x] `POST /projects/:projectId/tasks`
- [x] `DELETE /projects/:projectId/columns/:columnId/tasks/:taskId`
- [x] `PUT /tasks/:taskId`
