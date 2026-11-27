import type { Project } from './dbService';

// Production builds start with an empty project catalog; projects are loaded from the live API.
export const SIGNATURE_PROJECTS: Project[] = [];

export function resolveSignatureProjects(projects?: Project[] | null): Project[] {
  if (Array.isArray(projects) && projects.length > 0) {
    return projects;
  }
  return [];
}
