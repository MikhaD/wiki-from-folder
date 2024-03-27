import { wikiURL, createEditWarning } from "./utils.js";
export default class SidebarBuilder {
    static INDENT = "";
    repo;
    lines;
    sectionsOpen;
    /**
     * A class to build a sidebar for a GitHub wiki.
     * @param repo - The name of the repo the action is running in in the form `owner/repo`
     * @param editWarning - Whether to add a warning to the sidebar telling users not to edit
     * it.
     */
    constructor(repo, editWarning) {
        this.repo = repo;
        this.lines = [];
        this.sectionsOpen = 0;
        if (editWarning) {
            this.addLine(createEditWarning());
        }
    }
    get indent() {
        return SidebarBuilder.INDENT.repeat(this.sectionsOpen);
    }
    addLine(line) {
        this.lines.push(this.indent + line);
    }
    formatLink(title, fileToLinkTo) {
        return `<a href="${wikiURL(fileToLinkTo, this.repo)}">${title}</a>`;
    }
    openSection(title, bold, fileToLinkTo) {
        this.addLine("<details>");
        this.sectionsOpen += 1;
        if (bold) {
            title = `<strong>${title}</strong>`;
        }
        if (fileToLinkTo) {
            title = this.formatLink(title, fileToLinkTo);
        }
        this.addLine(`<summary>${title}</summary>`);
        // GFM requires a blank line after the summary in order for MD syntax to work in details
        this.addLine("");
    }
    /**
     * Close the current section in the sidebar.
     * @returns Whether a section was closed. If there are no sections open, this will return false.
     */
    closeSection() {
        if (this.sectionsOpen === 0) {
            return false;
        }
        this.sectionsOpen -= 1;
        this.addLine("</details>");
        return true;
    }
    /**
     * Add a link to the given file to the sidebar.
     * @param title - The title of the link (the thing that will be clicked on).
     * @param fileToLinkTo - The name of the file to link to. It is assumed to be in the wiki.
     */
    addLink(title, fileToLinkTo) {
        this.addLine(this.formatLink(title, fileToLinkTo) + "<br>");
    }
    /**
     * Dump the sidebar to a string.
     * @throws Error If there are still open sections when the sidebar is dumped.
     */
    dumps() {
        if (this.sectionsOpen > 0) {
            throw new Error("All sections must be closed before dumping the sidebar.");
        }
        return this.lines.join("\n");
    }
}
