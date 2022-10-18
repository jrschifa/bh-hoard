import {
  formatFiles,
  GeneratorCallback,
  getWorkspaceLayout,
  names,
  Tree,
} from '@nrwl/devkit';
import { UtilLibGeneratorSchema } from './schema';
import { libraryGenerator } from '@nrwl/workspace';
import { runTasksInSerial } from '@nrwl/workspace/src/utilities/run-tasks-in-serial';

interface NormalizedSchema extends UtilLibGeneratorSchema {
  projectName: string;
  projectRoot: string;
  projectDirectory: string;
  parsedTags: string[];
}

function normalizeOptions(tree: Tree, options: UtilLibGeneratorSchema): NormalizedSchema {
  const name = names(options.name).fileName;
  const projectDirectory = options.directory
    ? `${names(options.directory).fileName}/${name}`
    : name;
  const projectName = projectDirectory.replace(new RegExp('/', 'g'), '-');
  const projectRoot = `${getWorkspaceLayout(tree).libsDir}/${projectDirectory}`;
  const parsedTags = options.tags
    ? options.tags.split(',').map((s) => s.trim())
    : [];

  return {
    ...options,
    projectName,
    projectRoot,
    projectDirectory,
    parsedTags: [...parsedTags.filter(t => !t.indexOf('scope')), `scope:${projectDirectory}`],
    name: `util-${name}`,
  };
}

export default async function (tree: Tree, options: UtilLibGeneratorSchema) {
  const normalizedOptions = normalizeOptions(tree, options);

  const tasks: GeneratorCallback[] = [];
  const libraryTask = await libraryGenerator(tree, {
    ...normalizedOptions,
    tags: normalizedOptions.parsedTags.join(', ')
  });
  tasks.push(libraryTask);

  await formatFiles(tree);
  return runTasksInSerial(...tasks);

}
