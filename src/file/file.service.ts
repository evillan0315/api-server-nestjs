import { Injectable, NotFoundException, InternalServerErrorException, Inject } from '@nestjs/common';
import * as fs from 'fs-extra';
import * as path from 'path';


@Injectable()
export class FileService {


  constructor(
    @Inject('EXCLUDED_FOLDERS') private readonly EXCLUDED_FOLDERS: string[],
  ) {}

  private getFileTree(dir: string, recursive: boolean = false): any[] {
    if (!fs.existsSync(dir)) return [];

    const files = fs.readdirSync(dir);
    return files
      .filter((file) => !this.EXCLUDED_FOLDERS.includes(file))
      .map((file) => {
        const filePath = path.join(dir, file);
        const isDirectory = fs.statSync(filePath).isDirectory();
        return {
          name: file,
          isDirectory,
          path: filePath,
          type: isDirectory ? 'folder' : 'file',
          children: isDirectory && recursive ? this.getFileTree(filePath, true) : null,
        };
      });
  }

  async getFilesByDirectory(directory: string = '', recursive: boolean = false): Promise<any> {
    try {
      const directoryPath = directory ? directory : process.cwd();
      return this.getFileTree(directoryPath, recursive);
    } catch (error) {
      return { error: (error as Error).message };
    }
  }

  async getFileContent(filePath: string): Promise<any> {
    try {
      if (!filePath) return { error: "File path is required" };

      const fileExtension = path.extname(filePath).toLowerCase();
      const imageExtensions = [".png", ".jpg", ".jpeg", ".gif", ".bmp", ".webp"];

      if (imageExtensions.includes(fileExtension)) {
        const imageData = fs.readFileSync(filePath);
        return { content: imageData.toString("base64"), type: "image" };
      }

      const fileContent = await fs.promises.readFile(filePath, "utf-8");
      return { content: fileContent, type: "text" };
    } catch (error) {
      return { error: (error as Error).message };
    }
  }

  async createFile(filePath: string, content: string) {
    try {
      await fs.promises.writeFile(filePath, content, "utf-8");
      return { message: "File saved successfully", path: filePath };
    } catch (error) {
      return { error: (error as Error).message };
    }
  }
  /**
   * Creates or updates a file recursively.
   * @param filePath - File path.
   * @param content - File content.
   * @returns Success message.
   */
  async createOrUpdateFile(filePath: string, content?: string): Promise<{ path: string; message: string }> {
    try {
      const resolvedPath = path.resolve(filePath);
      await fs.ensureFile(resolvedPath);
      if (content) {
        await fs.writeFile(resolvedPath, content);
      }
      return { path: resolvedPath, message: 'File created/updated successfully' };
    } catch (error) {
      throw new InternalServerErrorException(`Error creating/updating file: ${error.message}`);
    }
  }

  /**
   * Reads a file's contents.
   * @param filePath - Path to the file.
   * @returns File content.
   */
  async readFile(filePath: string): Promise<{ path: string; content: string }> {
    try {
      const resolvedPath = path.resolve(filePath);
      if (!(await fs.pathExists(resolvedPath))) {
        throw new NotFoundException('File not found');
      }
      const content = await fs.readFile(resolvedPath, 'utf8');
      return { path: resolvedPath, content };
    } catch (error) {
      throw new InternalServerErrorException(`Error reading file: ${error.message}`);
    }
  }

  /**
   * Deletes a file or directory.
   * @param filePath - Path to the file/folder.
   * @returns Success message.
   */
  async deleteFileOrFolder(filePath: string): Promise<{ path: string; message: string }> {
    try {
      const resolvedPath = path.resolve(filePath);
      if (!(await fs.pathExists(resolvedPath))) {
        throw new NotFoundException('File/Folder not found');
      }
      await fs.remove(resolvedPath);
      return { path: resolvedPath, message: 'File/Folder deleted successfully' };
    } catch (error) {
      throw new InternalServerErrorException(`Error deleting file/folder: ${error.message}`);
    }
  }
}

