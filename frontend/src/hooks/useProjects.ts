import { useEffect, useState } from 'react';
import * as projectsService from '../services/projects';
import { Project } from '../types';

export function useProjects() {
  const [projects, setProjects] = useState<Project[]>([]);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    projectsService
      .listProjects({ page: 1, pageSize: 100 })
      .then((res) => setProjects(res.items))
      .catch(() => setProjects([]))
      .finally(() => setIsLoading(false));
  }, []);

  return { projects, isLoading };
}
