import type { Dirent } from "fs";

type DirectoryContents = {
	path: string,
	/** The total number of files in this directory and all subdirectories. `totalFiles == files.length` if `dirs == []` */
	totalFiles: number,
	dirs: DirectoryContents[],
	files: Dirent[],
};

type MainInputs = {
	folders: string[],
	sidebar: boolean,
	prefixFilesWithDir: boolean,
	sidebarFileTypes: string[],
	branchToLinkTo: string,
	clearWiki: boolean,
	editWarning: boolean,
	repo: string,
	host: string,
	generatedFilesDir: string,
	sectionsOpenDepth: number,
	makeWikiDirsSections: boolean,
};