import { setFailed, info, getBooleanInput, getInput } from "@actions/core";
import { commitAndPush, initializeGit, parseDirectoryContents, formatAsList, headerFromFileName, standardizeFileName, formatLinksInFile, traverseDirs } from "./utils.js";
import { DirectoryContents } from "./types";
import fs from "fs";

import SidebarBuilder from "./SidebarBuilder";
import path from "path";

/** The name of the repo the action is running in in the form `owner/repo` */
const repoName = process.env.GITHUB_REPOSITORY!;

/** The main function, executed in index.ts, exported to make it testable */
export default function main() {
	const inputs = {
		"directories": formatAsList(getInput("directories")),
		"sidebar": getBooleanInput("sidebar"),
		"ignoreFooter": getBooleanInput("ignore-footer"),
		"sidebarFileTypes": formatAsList(getInput("sidebar-file-types")).map((s) => {
			if (!s.startsWith(".")) s = `.${s}`;
			return s.toLowerCase();
		}),
		"prefixFilesWithDirectory": getBooleanInput("prefix-files-with-directory"),
	};

	let contents: DirectoryContents = {
		path: inputs.directories[0],
		dirs: [],
		files: [],
	};

	if (inputs.directories.length > 1) {
		contents.path = "";
		for (const dir of inputs.directories) {
			contents.dirs.push(parseDirectoryContents(dir, inputs.sidebarFileTypes));
		}
	} else {
		contents = parseDirectoryContents(inputs.directories[0], inputs.sidebarFileTypes);
	}
	const tempDir = `wiki-temp-${Date.now()}`;
	fs.mkdirSync(tempDir);
	const data = {
		sidebar: new SidebarBuilder(repoName, inputs.sidebarFileTypes),
	};
	traverseDirs(contents, data, (dir) => {
		if (inputs.sidebar && dir.path) {
			data.sidebar.openSection(path.basename(dir.path), true);
		}
		for (const file of dir.files) {
			const fileName = standardizeFileName(file.name);
			// test if the file path is the full path
			const fileContents = formatLinksInFile(path.join(dir.path, file.name), repoName, file.path, inputs.sidebarFileTypes);
			// fs.writeFileSync(path.join(tempDir, fileName), fileContents);

			if (inputs.sidebar) {
				data.sidebar.addLink(headerFromFileName(file.name), fileName);
			}
		}
		if (inputs.sidebar && dir.path) {
			data.sidebar.closeSection();
		}
	});



	try {
		initializeGit();
		commitAndPush(inputs.directories, ":memo: updated wiki");
	} catch (e) {
		info(e as string);
		setFailed("Action failed");
	}
}