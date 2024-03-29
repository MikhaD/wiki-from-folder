import main from "./main.js";
import ac from "@actions/core";
import * as utils from "./utils.js";

const inputs = {
	folders:			utils.formatAsList(ac.getInput("folders")),
	sidebar:			ac.getBooleanInput("sidebar"),
	prefixFilesWithDir:	ac.getBooleanInput("prefix-files-with-directory"),
	sidebarFileTypes:	[".md", ".markdown"],
	// sidebarFileTypes:	utils.formatAsList(ac.getInput("sidebar-file-types")).map((s) => {
	// 						if (!s.startsWith(".")) s = `.${s}`;
	// 						return s.toLowerCase();
	// 					}),
	branchToLinkTo:		ac.getInput("branch-to-link-to"),
	clearWiki:			ac.getBooleanInput("clear-wiki"),
	editWarning:		ac.getBooleanInput("edit-warning"),
	repo: 				process.env.GITHUB_REPOSITORY!,
};

process.env.GH_TOKEN = ac.getInput("token");
process.env.GITHUB_TOKEN = ac.getInput("token");
process.env.GH_HOST = "https://github.com";
await main(inputs);