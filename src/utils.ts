import type { DirectoryContents } from "./types";
import cp from "child_process";
import path from "path";
import fs from "fs";

import { fromMarkdown } from "mdast-util-from-markdown";
import { toMarkdown } from "mdast-util-to-markdown";
import type { Image, Link, Definition } from "mdast";
import { visit } from "unist-util-visit";

/** Match a valid email address */
export const EMAIL_REGEX = /^[a-zA-Z0-9_.+-]+@[a-zA-Z0-9-]+\.[a-zA-Z0-9-.]+$/m;
/**
 * Initialize git to commit by setting user.email and user.name
 * @param email default: `action@github.com`
 * @param name default: `action`
 */
export function initializeGit(email = "action@github.com", name = "actions-user") {
	if (!EMAIL_REGEX.test(email)) throw new SyntaxError("Invalid email syntax");
	cp.execSync(`git config --global user.email ${email}`);
	cp.execSync(`git config --global user.name ${name}`);
}
/**
 * Add, commit and push a list of files with the given message
 * @param files The list of files to push
 * @param message The commit message
 */
export function commitAndPush(files: string[], message: string) {
	cp.execSync(`git add ${files.join(" ")}`);
	cp.execSync(`git commit -m "${message}"`);
	cp.execSync("git push");
}

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
			contents.dirs.push(parseDirectoryContents(`${dir}/${file.name}`, extensions));
		} else if (file.isFile() && extensions.includes(path.extname(file.name).toLowerCase())) {
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
	callback: (dir: DirectoryContents) => void
): void {
	callback(contents);
	for (const dir of contents.dirs) {
		traverseDirs(dir, data, callback);
	}
}

/**
 * Format a file name as a easy to read header by replacing underscores and hyphens with spaces,
 * capitalizing the first letter, and removing the file extension.
 * @param name - The file name to format as a header.
 */
export function headerFromFileName(name: string) {
	name = name.replace(/[-_]/g, " ");
	if (path.extname(name).length > 0) {
		name = name.slice(0, -path.extname(name).length);
	}
	return name.charAt(0).toUpperCase() + name.slice(1).toLowerCase();
}

/**
 * Standardize a file name by replacing spaces and underscores with hyphens and converting it to
 * lowercase.
 * @param name - The file name to standardize.
 */
export function standardizeFileName(name: string) {
	name = name.replace(/[ _]/g, "-");
	return name.toLowerCase();

}

/**
 * Determine if a URL is a local file path or a web URL.
 * @param url - The URL string to check.
 */
export function isLocalUrl(url: string): boolean {
	try {
		const parsedUrl = new URL(url);
		// if it is a file link or a windows absolute path
		return parsedUrl.protocol.startsWith("file") || parsedUrl.protocol.length < 3;
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
	return path.normalize(file).split(path.sep).shift()!;
}

export function formatLocalLink(url: string, repo: string, currentDir: string, extensions: string[]): string {
	if (isLocalUrl(url)) {
		const newPath = path.join(currentDir, url);
		if (highestLevelDir(newPath) === highestLevelDir(currentDir)) {
			let fileName = path.basename(url);
			if (extensions.includes(path.extname(fileName))) {
				fileName = standardizeFileName(fileName);
				return path.join("/", repo, "wiki", fileName);
			}
			return path.join("/", repo, "blob/main", newPath);
		}
		if (newPath.startsWith("../")) {
			console.warn(`[WARN] ${url} is not in the project directory, leaving as is.`);
		} else {
			// This is in the repo itself
			return path.join("/", repo, "blob/main", newPath);
		}
	}
	return url;
}

/**
 * Open the markdown file at the given path, parse it, and prefix all local links with
 * owner/repo/wiki so they work with github wikis, and change all linked file names to match the
 * formatted file names.
 * @param path - The path to the markdown file to format.
 * @param repoName - The name of the repo the action is running in in the form `owner/repo`.
 */
export function formatLinksInFile(text: string, repo: string, currentDir: string, extensions: string[]) {
	const tree = fromMarkdown(text);
	visit(tree, ["image", "link", "definition"], function(node) {
		node = node as Image | Link | Definition;
		node.url = formatLocalLink(node.url, repo, currentDir, extensions);
	});

	console.log(toMarkdown(tree));
}
