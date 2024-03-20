import { expect } from "chai";
import { EMAIL_REGEX, commitAndPush, formatAsList, headerFromFileName, initializeGit, isLocalUrl, standardizeFileName } from "../src/utils.js";
// import fs from "fs";
import child_process from "child_process";
import sinon from "sinon";

describe("utils.ts", () => {
	it("EMAIL_REGEX", () => {
		expect("bOb@b0b.bob").to.match(EMAIL_REGEX);
		expect("boB123_da+ma-n.3@B0b-43.B-0.b").to.match(EMAIL_REGEX);
		expect("bob@bob.bob ").not.to.match(EMAIL_REGEX);
		expect("bobbob.bob").not.to.match(EMAIL_REGEX);
		expect("bob@bob").not.to.match(EMAIL_REGEX);
		expect("bob@.bob").not.to.match(EMAIL_REGEX);
		expect("bob@bob.").not.to.match(EMAIL_REGEX);
		expect("@bob.bob").not.to.match(EMAIL_REGEX);
		expect("bob@bob!.bob").not.to.match(EMAIL_REGEX);
	});

	describe("isLocalUrl", () => {
		it("should return true for local urls", () => {
			expect(isLocalUrl("file:///C:/Users/username/Documents/")).to.be.true;
			expect(isLocalUrl("C:\\Users\\username\\Documents")).to.be.true;
			expect(isLocalUrl("/home/user/Documents/doc.pdf")).to.be.true;
			expect(isLocalUrl("Documents/doc.pdf")).to.be.true;
			expect(isLocalUrl("./Documents/doc.pdf")).to.be.true;
			expect(isLocalUrl("../Documents/doc.pdf")).to.be.true;
		});
		it("should return false for remote urls", () => {
			expect(isLocalUrl("https://example.com")).to.be.false;
			expect(isLocalUrl("http://example.com")).to.be.false;
			expect(isLocalUrl("http://example.com/docs/file.md")).to.be.false;
			expect(isLocalUrl("https://example.com/docs/file.md")).to.be.false;
		});
	});

	describe("formatAsList", () => {
		it("empty", () => {
			expect(formatAsList("")).to.deep.equal([]);
			expect(formatAsList("      ")).to.deep.equal([]);
			expect(formatAsList(",,, ,")).to.deep.equal([]);
			expect(formatAsList("[]")).to.deep.equal([]);
			expect(formatAsList("[    ]")).to.deep.equal([]);
			expect(formatAsList("[,,, ,]")).to.deep.equal([]);
			expect(formatAsList("()")).to.deep.equal([]);
			expect(formatAsList("(    )")).to.deep.equal([]);
			expect(formatAsList("(,,, ,)")).to.deep.equal([]);
			expect(formatAsList("[)")).to.deep.equal([]);
			expect(formatAsList("(]")).to.deep.equal([]);
		});

		it("without brackets", () => {
			expect(formatAsList("this, that , the other ,")).to.deep.equal(["this", "that", "the other"]);
			expect(formatAsList("this,that,the other")).to.deep.equal(["this", "that", "the other"]);
		});

		it("with brackets", () => {
			expect(formatAsList("[ this, that , the other ,]")).to.deep.equal(["this", "that", "the other"]);
			expect(formatAsList("[this,that,the other]")).to.deep.equal(["this", "that", "the other"]);

			expect(formatAsList("( this, that , the other ,)")).to.deep.equal(["this", "that", "the other"]);
			expect(formatAsList("(this,that,the other)")).to.deep.equal(["this", "that", "the other"]);

			expect(formatAsList("( this, that , the other ,]")).to.deep.equal(["this", "that", "the other"]);
			expect(formatAsList("[this,that,the other)")).to.deep.equal(["this", "that", "the other"]);
		});
	});

	it("headerFromFileName", () => {
		expect(headerFromFileName("file.md")).to.equal("File");
		expect(headerFromFileName("file name.md")).to.equal("File name");
		expect(headerFromFileName("the_full FILE-name.md")).to.equal("The full file name");
		expect(headerFromFileName("The other file name")).to.equal("The other file name");
	});

	it("standardizeFileName", () => {
		expect(standardizeFileName("file.md")).to.equal("file.md");
		expect(standardizeFileName("file name.md")).to.equal("file-name.md");
		expect(standardizeFileName("the_FILE-with The naMe.md")).to.equal("the-file-with-the-name.md");
	});
});

const execSyncStub = sinon.stub(child_process, "execSync");


describe("Git functions", () => {
	beforeEach(() => {
		execSyncStub.resetHistory();
	});

	describe("initializeGit", () => {
		it("No parameters", () => {
			expect(initializeGit()).to.be.undefined;
			expect(execSyncStub.callCount).to.equal(2);
			expect(execSyncStub.calledWith("git config --global user.email action@github.com")).to.be.true;
			expect(execSyncStub.calledWith("git config --global user.name actions-user")).to.be.true;
		});
		it("Valid parameters", () => {
			expect(initializeGit("bob@bob.bob", "bob")).to.be.undefined;
			expect(execSyncStub.callCount).to.equal(2);
			expect(execSyncStub.calledWith("git config --global user.email bob@bob.bob")).to.be.true;
			expect(execSyncStub.calledWith("git config --global user.name bob")).to.be.true;
		});
		it("Invalid parameters", () => {
			expect(() => { initializeGit("bob@bob.b(o)b", "bob"); }).to.throw("Invalid email syntax");
			expect(execSyncStub.callCount).to.equal(0);
		});
	});

	describe("commitAndPush", () => {
		it("One file", () => {
			expect(commitAndPush(["./README.md"], "changed shit")).to.be.undefined;
			expect(execSyncStub.callCount).to.equal(3);
			expect(execSyncStub.calledWith("git add ./README.md")).to.be.true;
			expect(execSyncStub.calledWith("git commit -m \"changed shit\"")).to.be.true;
			expect(execSyncStub.calledWith("git push")).to.be.true;
		});
		it("Multiple files", () => {
			expect(commitAndPush(["./README.md", " file.md"], "changed shit")).to.be.undefined;
			expect(execSyncStub.callCount).to.equal(3);
			expect(execSyncStub.calledWith("git add ./README.md  file.md")).to.be.true;
			expect(execSyncStub.calledWith("git commit -m \"changed shit\"")).to.be.true;
			expect(execSyncStub.calledWith("git push")).to.be.true;
		});
	});
});