import SidebarBuilder from "../src/SidebarBuilder.js";
import { expect } from "chai";

describe("SidebarBuilder", () => {
	it("modifying repo name", () => {
		let sb = new SidebarBuilder("owner/repo", [".md"]);
		expect(sb.repo).to.equal("owner/repo/wiki");
		sb = new SidebarBuilder("owner/repo/", [".md"]);
		expect(sb.repo).to.equal("owner/repo/wiki");
		sb = new SidebarBuilder("owner/repo/wiki", [".md"]);
		expect(sb.repo).to.equal("owner/repo/wiki");
		sb = new SidebarBuilder("owner/repo/wiki/", [".md"]);
		expect(sb.repo).to.equal("owner/repo/wiki/");
	});

	it("opening sections", () => {
		let sb = new SidebarBuilder("owner/repo", [".md"]);
		sb.openSection("Heading", false);
		sb.closeSection();
		expect(sb.dumps()).to.equal([
			"<details>",
			"\t<summary>Heading</summary>",
			"\t",
			"</details>",
		].join("\n"));

		sb = new SidebarBuilder("owner/repo", [".md"]);
		sb.openSection("Heading", true);
		sb.closeSection();
		expect(sb.dumps()).to.equal([
			"<details>",
			"\t<summary><strong>Heading</strong></summary>",
			"\t",
			"</details>",
		].join("\n"));

		sb = new SidebarBuilder("owner/repo", [".md"]);
		sb.openSection("Heading", false, "file.md");
		sb.closeSection();
		expect(sb.dumps()).to.equal([
			"<details>",
			"\t<summary><a href=\"owner/repo/wiki/file\">Heading</a></summary>",
			"\t",
			"</details>",
		].join("\n"));

		sb = new SidebarBuilder("owner/repo", [".md"]);
		sb.openSection("Heading", true, "file.md");
		sb.closeSection();
		expect(sb.dumps()).to.equal([
			"<details>",
			"\t<summary><a href=\"owner/repo/wiki/file\"><strong>Heading</strong></a></summary>",
			"\t",
			"</details>",
		].join("\n"));
	});

	it("closing sections", () => {
		let sb = new SidebarBuilder("owner/repo", [".md"]);
		expect(sb.closeSection()).to.equal(false);
		sb.openSection("Heading", true);
		expect(sb.closeSection()).to.equal(true);
		expect(sb.closeSection()).to.equal(false);
		sb.openSection("Heading", true);
		sb.openSection("Heading", true);
		sb.closeSection();
		expect(() => sb.dumps()).to.throw("All sections must be closed before dumping the sidebar.");
	});

	it("adding links", () => {
		let sb = new SidebarBuilder("owner/repo", [".md"]);
		sb.addLink("Link 1", "file.md");
		expect(sb.dumps()).to.equal([
			"<a href=\"owner/repo/wiki/file\">Link 1</a><br>",
		].join("\n"));

		sb.addLink("Link 2", "file2");
		expect(sb.dumps()).to.equal([
			"<a href=\"owner/repo/wiki/file\">Link 1</a><br>",
			"<a href=\"owner/repo/wiki/file2\">Link 2</a><br>",
		].join("\n"));

		sb.addLink("Link", "file3.markdown");
		expect(sb.dumps()).to.equal([
			"<a href=\"owner/repo/wiki/file\">Link 1</a><br>",
			"<a href=\"owner/repo/wiki/file2\">Link 2</a><br>",
			"<a href=\"owner/repo/wiki/file3.markdown\">Link</a><br>",
		].join("\n"));
	});

	it("links in sections", () => {
		let sb = new SidebarBuilder("owner/repo", [".md"]);
		sb.openSection("Heading", false);
		sb.addLink("Link 1", "file.md");
		sb.addLink("Link 2", "file2");
		sb.addLink("Link 3", "file3.markdown");
		sb.closeSection();
		expect(sb.dumps()).to.equal([
			"<details>",
			"\t<summary>Heading</summary>",
			"\t",
			"\t<a href=\"owner/repo/wiki/file\">Link 1</a><br>",
			"\t<a href=\"owner/repo/wiki/file2\">Link 2</a><br>",
			"\t<a href=\"owner/repo/wiki/file3.markdown\">Link 3</a><br>",
			"</details>",
		].join("\n"));
	});

	it("nested sections", () => {
		let sb = new SidebarBuilder("owner/repo", [".md"]);
		sb.openSection("Heading", true);
		sb.openSection("Subheading", false, "file0.md");
		sb.addLink("Link 1", "file1.md");
		sb.addLink("Link 2", "file2");
		sb.addLink("Link 3", "file3.markdown");
		sb.closeSection();
		sb.addLink("Link 4", "file4");
		sb.closeSection();
		expect(sb.dumps()).to.equal([
			"<details>",
			"\t<summary><strong>Heading</strong></summary>",
			"\t",
			"\t<details>",
			"\t\t<summary><a href=\"owner/repo/wiki/file0\">Subheading</a></summary>",
			"\t\t",
			"\t\t<a href=\"owner/repo/wiki/file1\">Link 1</a><br>",
			"\t\t<a href=\"owner/repo/wiki/file2\">Link 2</a><br>",
			"\t\t<a href=\"owner/repo/wiki/file3.markdown\">Link 3</a><br>",
			"\t</details>",
			"\t<a href=\"owner/repo/wiki/file4\">Link 4</a><br>",
			"</details>",
		].join("\n"));
	});

	it("consecutive sections", () => {
		let sb = new SidebarBuilder("owner/repo", [".md"]);
		sb.openSection("Heading 1", true);
		sb.addLink("Link 1", "file1.md");
		sb.closeSection();
		sb.addLink("Link 2", "file2");
		sb.openSection("Heading 2", false);
		sb.addLink("Link 3", "file3.markdown");
		sb.closeSection();
		expect(sb.dumps()).to.equal([
			"<details>",
			"\t<summary><strong>Heading 1</strong></summary>",
			"\t",
			"\t<a href=\"owner/repo/wiki/file1\">Link 1</a><br>",
			"</details>",
			"<a href=\"owner/repo/wiki/file2\">Link 2</a><br>",
			"<details>",
			"\t<summary>Heading 2</summary>",
			"\t",
			"\t<a href=\"owner/repo/wiki/file3.markdown\">Link 3</a><br>",
			"</details>",
		].join("\n"));
	});
});