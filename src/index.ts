import main from "./main.js";
import ac from "@actions/core";
import * as utils from "./utils.js";

try {
	const inputs = {
		folders: utils.formatAsList(ac.getInput("folders")),
		sidebar: ac.getBooleanInput("sidebar"),
		prefixFilesWithDir: ac.getBooleanInput("prefix-files-with-directory"),
		sidebarFileTypes: [".md", ".markdown"],
		// sidebarFileTypes:	utils.formatAsList(ac.getInput("sidebar-file-types")).map((s) => {
		// 						if (!s.startsWith(".")) s = `.${s}`;
		// 						return s.toLowerCase();
		// 					}),
		branchToLinkTo: ac.getInput("branch-to-link-to"),
		clearWiki: ac.getBooleanInput("clear-wiki"),
		editWarning: ac.getBooleanInput("edit-warning"),
		host: ac.getInput("host"),
		repo: process.env.GITHUB_REPOSITORY!,
	};

	process.env.GH_TOKEN = ac.getInput("token");
	await main(inputs);
} catch (e) {
	console.error(e.stack);
	ac.setFailed("Action failed");
}