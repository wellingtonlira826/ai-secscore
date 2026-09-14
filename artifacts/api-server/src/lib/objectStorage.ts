import fs from "fs/promises";
import path from "path";
import { randomUUID } from "crypto";
import {
  type LocalFile,
  ObjectAclPolicy,
  ObjectPermission,
  canAccessObject,
  getObjectAclPolicy,
  setObjectAclPolicy,
} from "./objectAcl";

function getStorageDir(): string {
  return path.resolve(process.env.STORAGE_DIR ?? "./storage");
}

export class ObjectNotFoundError extends Error {
  constructor() {
    super("Object not found");
    this.name = "ObjectNotFoundError";
    Object.setPrototypeOf(this, ObjectNotFoundError.prototype);
  }
}

export class ObjectStorageService {
  private resolveObjectPath(objectPath: string): LocalFile {
    if (!objectPath.startsWith("/objects/")) {
      throw new ObjectNotFoundError();
    }
    const relative = objectPath.slice("/objects/".length);
    const absPath = path.join(getStorageDir(), relative);
    return { absPath, name: path.basename(absPath) };
  }

  getPublicObjectSearchPaths(): string[] {
    return (process.env.PUBLIC_OBJECT_SEARCH_PATHS ?? "")
      .split(",")
      .map((p) => p.trim())
      .filter(Boolean);
  }

  async searchPublicObject(filePath: string): Promise<LocalFile | null> {
    for (const dir of this.getPublicObjectSearchPaths()) {
      const absPath = path.join(getStorageDir(), dir, filePath);
      try {
        await fs.access(absPath);
        return { absPath, name: path.basename(absPath) };
      } catch {
        // not found in this search path
      }
    }
    return null;
  }

  async downloadObject(file: LocalFile, cacheTtlSec = 3600): Promise<Response> {
    let data: Buffer;
    try {
      data = await fs.readFile(file.absPath);
    } catch {
      throw new ObjectNotFoundError();
    }
    const stat = await fs.stat(file.absPath);
    return new Response(data, {
      headers: {
        "Content-Type": file.contentType ?? "application/octet-stream",
        "Content-Length": String(stat.size),
        "Cache-Control": `private, max-age=${cacheTtlSec}`,
      },
    });
  }

  async getObjectEntityUploadURL(userId: string): Promise<string> {
    const objectId = randomUUID();
    const relative = `uploads/${userId}/${objectId}`;
    const absPath = path.join(getStorageDir(), relative);
    await fs.mkdir(path.dirname(absPath), { recursive: true });
    const apiBase = (process.env.API_BASE_URL ?? "http://localhost:5000").replace(/\/$/, "");
    return `${apiBase}/api/storage/raw-upload/${relative}`;
  }

  normalizeObjectEntityPath(rawPath: string): string {
    try {
      const url = new URL(rawPath);
      const match = url.pathname.match(/^\/api\/storage\/raw-upload\/(.+)$/);
      if (match) return `/objects/${match[1]}`;
    } catch {
      // not a URL
    }
    return rawPath;
  }

  async getObjectEntityFile(objectPath: string): Promise<LocalFile> {
    if (!objectPath.startsWith("/objects/")) {
      throw new ObjectNotFoundError();
    }
    const parts = objectPath.slice(1).split("/");
    if (parts.length < 2) throw new ObjectNotFoundError();

    const relative = parts.slice(1).join("/");
    const absPath = path.join(getStorageDir(), relative);
    try {
      await fs.access(absPath);
    } catch {
      throw new ObjectNotFoundError();
    }
    return { absPath, name: path.basename(absPath) };
  }

  async trySetObjectEntityAclPolicy(rawPath: string, aclPolicy: ObjectAclPolicy): Promise<string> {
    const normalizedPath = this.normalizeObjectEntityPath(rawPath);
    if (!normalizedPath.startsWith("/")) return normalizedPath;
    try {
      const objectFile = await this.getObjectEntityFile(normalizedPath);
      await setObjectAclPolicy(objectFile, aclPolicy);
    } catch {
      // file may not exist yet during ACL pre-set; ignore
    }
    return normalizedPath;
  }

  async canAccessObjectEntity({
    userId,
    objectFile,
    requestedPermission,
  }: {
    userId?: string;
    objectFile: LocalFile;
    requestedPermission?: ObjectPermission;
  }): Promise<boolean> {
    return canAccessObject({
      userId,
      objectFile,
      requestedPermission: requestedPermission ?? ObjectPermission.READ,
    });
  }
}
