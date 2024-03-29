import { expect } from "chai";
import { cloneWiki, commitAndPush, configureGit } from "../src/git_helpers.js";

import exec from "@actions/exec";
import sinon from "sinon";

const execStub = sinon.stub(exec, "exec");


describe("Git Helper Functions", () => {
	beforeEach(() => {
		execStub.resetHistory();
		execStub.resolves(0);
	});

	describe("configureGit", () => {
		it("No parameters", async () => {
			expect(await configureGit()).to.be.undefined;
			expect(execStub.callCount).to.equal(3);
			expect(execStub.calledWith("git config --global user.email action@github.com")).to.be.true;
			expect(execStub.calledWith("git config --global user.name actions-user")).to.be.true;
		});
		it("Valid parameters", async () => {
			expect(await configureGit("bob@bob.bob", "bob")).to.be.undefined;
			expect(execStub.callCount).to.equal(3);
			expect(execStub.calledWith("git config --global user.email bob@bob.bob")).to.be.true;
			expect(execStub.calledWith("git config --global user.name bob")).to.be.true;
		});
		it("Invalid parameters", async () => {
			// at time of writing, chai doesn't support testing for thrown errors in async functions
			let message = "didn't throw error";
			try {
				await configureGit("bob@bob.b(o)b", "bob");
			} catch (error) {
				message = (error as Error).message;
			}
			expect(message).to.equal("Invalid email syntax");
			expect(execStub.callCount).to.equal(0);
		});
	});

	describe("commitAndPush", () => {
		it("One file", async () => {
			expect(await commitAndPush(["./README.md"], "[TEST] :test_tube: changes")).to.be.undefined;
			expect(execStub.callCount).to.equal(3);
			expect(execStub.calledWith("git add ./README.md")).to.be.true;
			expect(execStub.calledWith("git commit -m \"[TEST] :test_tube: changes\"")).to.be.true;
			expect(execStub.calledWith("git push")).to.be.true;
		});
		it("Multiple files", async () => {
			expect(await commitAndPush(["./README.md", " file.md"], "[TEST] :test_tube: changes")).to.be.undefined;
			expect(execStub.callCount).to.equal(3);
			expect(execStub.calledWith("git add ./README.md  file.md")).to.be.true;
			expect(execStub.calledWith("git commit -m \"[TEST] :test_tube: changes\"")).to.be.true;
			expect(execStub.calledWith("git push")).to.be.true;
		});
	});

	describe("cloneWiki", () => {
		it("No clear", async () => {
			expect(await cloneWiki("owner/repo", "temp")).to.be.undefined;
			expect(execStub.callCount).to.equal(2);
			expect(execStub.calledWith("git", ["clone", "--depth=1", "https://github.com/owner/repo.wiki.git", "temp"])).to.be.true;
		});
		it("Clear", async () => {
			expect(await cloneWiki("owner/repo", "temp", true)).to.be.undefined;
			expect(execStub.callCount).to.equal(3);
			expect(execStub.calledWith("git", ["clone", "--depth=1", "https://github.com/owner/repo.wiki.git", "temp"])).to.be.true;
			expect(execStub.calledWith("rm", ["-r", "temp/*"])).to.be.true;
		});
	});

	describe("Failed exec", () => {
		beforeEach(() => {
			execStub.resolves(2);
		});
		it("commitAndPush", async () => {
			let message = "didn't throw error";
			try {
				await commitAndPush(["./README.md"], "[TEST] :test_tube: changes");
			} catch (error) {
				message = (error as Error).message;
			}
			expect(message).to.equal("Failed to commit and push [6]");
			expect(execStub.callCount).to.equal(3);
		});
		it("configureGit", async () => {
			let message = "didn't throw error";
			try {
				await configureGit();
			} catch (error) {
				message = (error as Error).message;
			}
			expect(message).to.equal("Failed to initialize git [6]");
			expect(execStub.callCount).to.equal(3);
		});
		it("cloneWiki clear", async () => {
			let message = "didn't throw error";
			try {
				await cloneWiki("owner/repo", "temp");
			} catch (error) {
				message = (error as Error).message;
			}
			expect(message).to.equal("Failed to clone wiki [4]");
			expect(execStub.callCount).to.equal(2);
		});
		it("cloneWiki", async () => {
			let message = "didn't throw error";
			try {
				await cloneWiki("owner/repo", "temp", true);
			} catch (error) {
				message = (error as Error).message;
			}
			expect(message).to.equal("Failed to clone wiki [6]");
			expect(execStub.callCount).to.equal(3);
		});
	});
});