import { prisma } from './prisma';

/**
 * Validates whether a target folder or file is accessible within the permitted scope.
 * 
 * Isolation Rules:
 * 1. Root Access (permittedFolderId === null):
 *    - User has full access to the entire workspace and any folder/file inside it.
 * 
 * 2. Subfolder Isolation (permittedFolderId !== null):
 *    - User is restricted strictly to permittedFolderId and its descendants.
 *    - Accessing workspace root (null) is FORBIDDEN.
 *    - Accessing any parent folder above permittedFolderId is FORBIDDEN.
 *    - Accessing any sibling or unrelated folder is FORBIDDEN.
 */
export async function isFolderWithinPermittedScope(
  targetFolderId: string | null | undefined,
  permittedFolderId: string | null,
  workspaceId: string
): Promise<boolean> {
  // If no isolation rule (Root Access), user can access any folder belonging to this workspace
  if (!permittedFolderId) {
    if (!targetFolderId) return true; // Workspace root
    const folder = await prisma.folder.findUnique({
      where: { id: targetFolderId },
      select: { workspaceId: true },
    });
    return folder?.workspaceId === workspaceId;
  }

  // Under Subfolder Isolation:
  // Cannot view workspace root if limited to a subfolder
  if (!targetFolderId) {
    return false;
  }

  // Exact match: the permitted folder itself
  if (targetFolderId === permittedFolderId) {
    return true;
  }

  // Check ancestry: walk up from targetFolderId until we reach permittedFolderId or root
  let currentId: string | null = targetFolderId;
  const visited = new Set<string>();

  while (currentId) {
    if (visited.has(currentId)) {
      // Prevent circular loops
      return false;
    }
    visited.add(currentId);

    const currentFolder: { id: string; parentId: string | null; workspaceId: string } | null =
      await prisma.folder.findUnique({
        where: { id: currentId },
        select: { id: true, parentId: true, workspaceId: true },
      });

    if (!currentFolder || currentFolder.workspaceId !== workspaceId) {
      return false;
    }

    if (currentFolder.parentId === permittedFolderId) {
      return true;
    }

    currentId = currentFolder.parentId;
  }

  return false;
}

/**
 * Validates whether a file is accessible within the permitted scope
 */
export async function isFileWithinPermittedScope(
  fileId: string,
  permittedFolderId: string | null,
  workspaceId: string
): Promise<boolean> {
  const file = await prisma.fileItem.findUnique({
    where: { id: fileId },
    select: { id: true, workspaceId: true, folderId: true },
  });

  if (!file || file.workspaceId !== workspaceId) {
    return false;
  }

  if (!permittedFolderId) {
    return true; // Root access permitted
  }

  // File must reside inside permitted folder or one of its descendants
  return await isFolderWithinPermittedScope(
    file.folderId,
    permittedFolderId,
    workspaceId
  );
}
