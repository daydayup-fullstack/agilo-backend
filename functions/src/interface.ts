export interface HomepageDataType {
    user: User;
    workspace: Workspace;
    allProjects: Project[];
}

export interface User {
    id: string;
    avatar: string;
    colorIndex: number;
    email: string;
    firstName: string;
    lastName: string;
    privateProjects: string[];
    starredProjects: string[];
    workspaces: string[];
}

export interface Project {
    id: string;
    name: string;
    colorIndex: number;
    iconIndex: number;
    createdOn: number;
    dueDate: number;
    columnOrder: string[];
    activeUsers: string[];
}

export interface Workspace {
    id: string;
    type: string;
    projectsInOrder: string[];
    members: [];
    description?: string;
    name: string;
}

export interface Column {
    title: string;
    taskIds: string[];
}

export interface Task {
    id: string;
    name: string;
    description: string;
    isCompleted: boolean;
    createdOn: any;
    dueDate?: any;
    authorId: string;
    assignedUserIds: string[];
    projectIds: string[];
    likedBy: string[];
    attachments: string[];
}
