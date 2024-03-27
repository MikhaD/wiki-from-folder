import SidebarBuilder from "../src/SidebarBuilder.js";
import { expect } from "chai";

describe("SidebarBuilder", () => {

	it("opening sections", () => {
		let sb = new SidebarBuilder("owner/repo", false);
		sb.openSection("Heading", false);
		sb.closeSection();
		expect(sb.dumps()).to.equal([
			"<details>",
			"<summary>Heading</summary>",
			"",
			"</details>",
		].join("\n"));

		sb = new SidebarBuilder("owner/repo", false);
		sb.openSection("Heading", true);
		sb.closeSection();
		expect(sb.dumps()).to.equal([
			"<details>",
			"<summary><strong>Heading</strong></summary>",
			"",
			"</details>",
		].join("\n"));

		sb = new SidebarBuilder("owner/repo", false);
		sb.openSection("Heading", false, "file.md");
		sb.closeSection();
		expect(sb.dumps()).to.equal([
			"<details>",
			"<summary><a href=\"/owner/repo/wiki/file\">Heading</a></summary>",
			"",
			"</details>",
		].join("\n"));

		sb = new SidebarBuilder("owner/repo", false);
		sb.openSection("Heading", true, "file.md");
		sb.closeSection();
		expect(sb.dumps()).to.equal([
			"<details>",
			"<summary><a href=\"/owner/repo/wiki/file\"><strong>Heading</strong></a></summary>",
			"",
			"</details>",
		].join("\n"));
	});

	it("closing sections", () => {
		let sb = new SidebarBuilder("owner/repo", false);
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
		let sb = new SidebarBuilder("owner/repo", false);
		sb.addLink("Link 1", "file.md");
		expect(sb.dumps()).to.equal([
			"<a href=\"/owner/repo/wiki/file\">Link 1</a><br>",
		].join("\n"));

		sb.addLink("Link 2", "file2");
		expect(sb.dumps()).to.equal([
			"<a href=\"/owner/repo/wiki/file\">Link 1</a><br>",
			"<a href=\"/owner/repo/wiki/file2\">Link 2</a><br>",
		].join("\n"));

		sb.addLink("Link", "nonsense/file3.markdown");
		expect(sb.dumps()).to.equal([
			"<a href=\"/owner/repo/wiki/file\">Link 1</a><br>",
			"<a href=\"/owner/repo/wiki/file2\">Link 2</a><br>",
			"<a href=\"/owner/repo/wiki/file3\">Link</a><br>",
		].join("\n"));
	});

	it("links in sections", () => {
		let sb = new SidebarBuilder("owner/repo", false);
		sb.openSection("Heading", false);
		sb.addLink("Link 1", "file.md");
		sb.addLink("Link 2", "file2");
		sb.addLink("Link 3", "file3.markdown");
		sb.addLink("Link 4", "something/file4.markdown");
		sb.closeSection();
		expect(sb.dumps()).to.equal([
			"<details>",
			"<summary>Heading</summary>",
			"",
			"<a href=\"/owner/repo/wiki/file\">Link 1</a><br>",
			"<a href=\"/owner/repo/wiki/file2\">Link 2</a><br>",
			"<a href=\"/owner/repo/wiki/file3\">Link 3</a><br>",
			"<a href=\"/owner/repo/wiki/file4\">Link 4</a><br>",
			"</details>",
		].join("\n"));
	});

	it("nested sections", () => {
		let sb = new SidebarBuilder("owner/repo", false);
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
			"<summary><strong>Heading</strong></summary>",
			"",
			"<details>",
			"<summary><a href=\"/owner/repo/wiki/file0\">Subheading</a></summary>",
			"",
			"<a href=\"/owner/repo/wiki/file1\">Link 1</a><br>",
			"<a href=\"/owner/repo/wiki/file2\">Link 2</a><br>",
			"<a href=\"/owner/repo/wiki/file3\">Link 3</a><br>",
			"</details>",
			"<a href=\"/owner/repo/wiki/file4\">Link 4</a><br>",
			"</details>",
		].join("\n"));
	});

	it("consecutive sections", () => {
		let sb = new SidebarBuilder("owner/repo", false);
		sb.openSection("Heading 1", true);
		sb.addLink("Link 1", "file1.md");
		sb.closeSection();
		sb.addLink("Link 2", "file2");
		sb.openSection("Heading 2", false);
		sb.addLink("Link 3", "file3.txt");
		sb.closeSection();
		expect(sb.dumps()).to.equal([
			"<details>",
			"<summary><strong>Heading 1</strong></summary>",
			"",
			"<a href=\"/owner/repo/wiki/file1\">Link 1</a><br>",
			"</details>",
			"<a href=\"/owner/repo/wiki/file2\">Link 2</a><br>",
			"<details>",
			"<summary>Heading 2</summary>",
			"",
			"<a href=\"/owner/repo/wiki/file3\">Link 3</a><br>",
			"</details>",
		].join("\n"));
	});

	it("do not edit warning", () => {
		let sb = new SidebarBuilder("owner/repo", true);
		sb.openSection("Heading", true);
		sb.openSection("Subheading", false, "file0.md");
		sb.addLink("Link 1", "file1.md");
		sb.addLink("Link 2", "file2");
		sb.addLink("Link 3", "file3.markdown");
		sb.closeSection();
		sb.addLink("Link 4", "file4");
		sb.closeSection();
		expect(sb.dumps()).to.equal([
			"<!------------------------------------------------------------------------->",
			"<!--                🛑 DO NOT EDIT THIS FILE ON GITHUB 🛑                -->",
			"<!-- This file will be overwritten the next time the wiki is regenerated -->",
			"<!------------------------------------------------------------------------->",
			"",
			"<details>",
			"<summary><strong>Heading</strong></summary>",
			"",
			"<details>",
			"<summary><a href=\"/owner/repo/wiki/file0\">Subheading</a></summary>",
			"",
			"<a href=\"/owner/repo/wiki/file1\">Link 1</a><br>",
			"<a href=\"/owner/repo/wiki/file2\">Link 2</a><br>",
			"<a href=\"/owner/repo/wiki/file3\">Link 3</a><br>",
			"</details>",
			"<a href=\"/owner/repo/wiki/file4\">Link 4</a><br>",
			"</details>",
		].join("\n"));
	});
});