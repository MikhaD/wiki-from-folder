import main from "./main.js";
import ac from "@actions/core";
import * as utils from "./utils.js";

const inputs = {
	directories:		utils.formatAsList(ac.getInput("directories")),
	sidebar:			ac.getBooleanInput("sidebar"),
	prefixFilesWithDir:	ac.getBooleanInput("prefix-files-with-directory"),
	sidebarFileTypes:	utils.formatAsList(ac.getInput("sidebar-file-types")).map((s) => {
							if (!s.startsWith(".")) s = `.${s}`;
							return s.toLowerCase();
						}),
	branchToLinkTo:		ac.getInput("branch-to-link-to"),
	clearWiki:			ac.getBooleanInput("clear-wiki"),
	repo: 				process.env.GITHUB_REPOSITORY!,
};

await main(inputs);