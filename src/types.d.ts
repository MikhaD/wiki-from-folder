import type { Dirent } from "fs";

type DirectoryContents = {
	path: string,
	dirs: DirectoryContents[],
	files: Dirent[],
};