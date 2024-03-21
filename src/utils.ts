import type { DirectoryContents } from "./types";
import path from "path";
import fs from "fs";

import { fromMarkdown } from "mdast-util-from-markdown";
import { toMarkdown } from "mdast-util-to-markdown";
import type { Image, Link, Definition } from "mdast";
import { visit } from "unist-util-visit";
import ac from "@actions/core";

/** Match a valid email address */
export const EMAIL_REGEX = /^[a-zA-Z0-9_.+-]+@[a-zA-Z0-9-]+\.[a-zA-Z0-9-.]+$/m;

/**
 * Convert a string containing a list of comma separated values, optionally enclosed in brackets or
 * square brackets to a list of strings.
 * @param s The string to parse
 */
export function formatAsList(str: string) {
	let s = str.trim();
	s = s.replace(/^[\[(]|[\])]$/gm, "");
	if (s === "") return [];
	let items = s.split(",").map((s) => s.trim()).filter(s => s !== "");
	return items;
}

/**
 * Take a directory path and return a DirectoryContents object containing the path, a list of
 * subdirectories as DirectoryContents objects, and a list of files that match the specified
 * extensions.
 * @param dir - The path to the directory to parse
 * @param extensions - A list of file extensions to include in the files list
 */
export function parseDirectoryContents(dir: string, extensions: string[]): DirectoryContents {
	const data = fs.readdirSync(dir, { withFileTypes: true });
	const contents: DirectoryContents = {
		path: dir,
		dirs: [],
		files: [],
	};

	for (const file of data) {
		if (file.isDirectory()) {
			contents.dirs.push(parseDirectoryContents(path.join(dir, file.name), extensions));
		} else if (file.isFile()) {
			contents.files.push(file);
		}
	}
	return contents;
}

/**
 * Recursively traverse a DirectoryContents object, calling a callback on each DirectoryContents
 * object.
 * @param contents - The DirectoryContents object to traverse.
 * @param data - Any data you'd like accessible in the callback.
 * @param callback - The callback to call on each DirectoryContents object.
 */
export function traverseDirs<T>(
	contents: DirectoryContents,
	data: T,
	callback: (dir: DirectoryContents, data: T) => void
): void {
	callback(contents, data);
	for (const dir of contents.dirs) {
		traverseDirs(dir, data, callback);
	}
}

/**
 * Remove the file extension from a file name. If it has multiple extensions, such as `main.test.ts`
 * only the last one will be removed.
 * @param name - The file name to remove the extension from.
 */
export function removeFileExtension(name: string) {
	if (path.extname(name).length > 0) {
		name = name.slice(0, -path.extname(name).length);
	}
	return name;
}

/**
 * Format a file name as a easy to read header by replacing underscores and hyphens with spaces,
 * capitalizing the first letter, and removing the file extension.
 * @param name - The file name to format as a header.
 */
export function headerFromFileName(name: string) {
	name = name.replace(/[-_]/g, " ");
	name = removeFileExtension(name);
	return name.charAt(0).toUpperCase() + name.slice(1).toLowerCase();
}

/**
 * Standardize a file name by replacing spaces and underscores with hyphens and converting it to
 * lowercase.
 * @param name - The file name to standardize.
 * @param file_path - The path to the file to standardize. If specified, the file name will be
 * joined to the path using a pipe character. The result will look like `path|to|file-name.md`.
 */
export function standardizeFileName(name: string, file_path?: string) {
	name = name.replace(/[ _]/g, "-");
	if (file_path) {
		name = path.join(file_path, name);
		name = name.replace(/\//g, "|");
	}
	return name.toLowerCase();

}

/**
 * Determine if a URL is a local file path or a web URL.
 * @param url - The URL string to check.
 */
export function isLocalUrl(url: string): boolean {
	try {
		const parsedUrl = new URL(url);
		// if it is a file link || a windows absolute path
		return parsedUrl.protocol.startsWith("file") || parsedUrl.protocol.length <= 2;
	}
	catch (e) {
		return true;
	}
}

/**
 * Determine the highest level directory in a file path.
 * @param file - The file path to find the highest level directory of.
 */
export function highestLevelDir(file: string): string {
	let result = path.normalize(file).split(path.sep).shift();
	if (result === file) {
		result = ".";
	}
	if (result === "") {
		result = "/";
	}
	return result!;
}

/**
 * Format a link to a local file to work with github wikis. If the file is in one of the folders
 * that the wiki is being generated from, and is one of the file types being turned into wiki pages,
 * the link will be formatted as a wiki link. If it is not one of the file types being turned into
 * wiki pages, or is in the repo but not in one of the folders the wiki is being generated from, the
 * link will be formatted as a link to the file in the repo. If the file is not in the repo, the
 * link will be left as is.
 * @param url - The link to format.
 * @param repo - The name of the repo the action is running in in the form `owner/repo`.
 * @param currentDir - The current directory of the file being formatted.
 * @param extensions - A list of file extensions to be be considered wiki files (linked to the wiki instead of the repo).
 * @param prefixWithDir - Whether to prefix the file name being linked to with the directory it is in.
 */
export function formatLocalLink(url: string, repo: string, currentDir: string, extensions: string[], prefixWithDir: boolean): string {
	if (isLocalUrl(url)) {
		const newPath = path.join(currentDir, url);
		if (highestLevelDir(newPath) === highestLevelDir(currentDir)) {
			let fileName = path.basename(url);
			// This is a link to another wiki page
			if (extensions.includes(path.extname(fileName))) {
				fileName = standardizeFileName(fileName, prefixWithDir ? currentDir : undefined);
				return wikiURL(fileName, repo);
			}
			// This is in the dir the wiki is being generated from, but not a wiki page
			return path.join("/", repo, "blob/main", newPath);
		}
		if (newPath.startsWith("../")) {
			// this links to something outside the project directory
			ac.warning(`[WARN] ${url} is not in the project directory, leaving as is.`);
		} else {
			// This is in the repo itself
			return path.join("/", repo, "blob/main", newPath);
		}
	}
	// this is an external url to a web resource or something else
	return url;
}

/**
 * Open the markdown file at the given path, parse it, and prefix all local links with
 * owner/repo/wiki so they work with github wikis, and change all linked file names to match the
 * formatted file names.
 * @param path - The path to the markdown file to format.
 * @param repo - The name of the repo the action is running in in the form `owner/repo`.
 * @param currentDir - The current directory of the file being formatted.
 * @param extensions - A list of file extensions to be be considered wiki files (linked to the wiki instead of the repo).
 * @param prefixWithFileWithDir - Whether to prefix the file name with the directory it is in.
 */
export function formatLinksInFile(text: string, repo: string, currentDir: string, extensions: string[], prefixWithFileWithDir: boolean) {
	const tree = fromMarkdown(text);
	visit(tree, ["image", "link", "definition"], function(node) {
		node = node as Image | Link | Definition;
		node.url = formatLocalLink(node.url, repo, currentDir, extensions, prefixWithFileWithDir);
	});

	return toMarkdown(tree);
}

/**
 * Generate a local wiki URL for a file in the repo.
 * @param fileName - The name of the file to generate a URL for. It will be standardized.
 * @param repo - The name of the repo the action is running in in the form `owner/repo`.
 */
export function wikiURL(fileName: string, repo: string) {
	return path.join("/", repo, "wiki", removeFileExtension(standardizeFileName(fileName)));
}