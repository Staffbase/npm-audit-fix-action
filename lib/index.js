import * as core from "@actions/core";
import hasYarn from 'has-yarn';
import * as npmRunner from './runner/npm.js';
import * as yarnRunner from './runner/yarn.js';
import { exec } from "@actions/exec";
import aggregateReport from "./aggregateReport.js";
import buildCommitBody from "./buildCommitBody.js";
import buildPullRequestBody from "./buildPullRequestBody.js";
import createOrUpdatePullRequest from "./createOrUpdatePullRequest.js";
import getDefaultBranch from "./getDefaultBranch.js";
import listPackages from "./listPackages.js";
import commaSeparatedList from "./utils/commaSeparatedList.js";

/**
 * @returns {Promise<boolean>}
 */
async function filesChanged() {
  try {
    const exitCode = await exec("git", ["diff", "--exit-code"]);
    return exitCode === 0;
  } catch (err) {
    return false;
  }
}

/**
 * @param {string} name
 * @returns {string}
 */
function getFromEnv(name) {
  const value = process.env[name];
  if (value) {
    return value;
  }
  throw new Error(`Not found '${name}' in the environment variables`);
}

async function run(runner) {
  const version = runner.getVersion();

  await runner.install();

  const auditReport = await runner.getAuditReport();
  const beforePackages = await runner.getBeforePackages();

  await runner.fix();

  await runner.reinstall();
  const afterPackages = await runner.getAfterPackages();

  const report = await core.group("Aggregate report", () =>
    aggregateReport(auditReport, beforePackages, afterPackages)
  );

  if (report.packageCount === 0) {
    core.info("No update.");
    return;
  }

  const changed = await core.group("Check file changes", filesChanged);
  if (changed) {
    core.info("No file changes.");
    return;
  }

  await core.group("Create or update a pull request", async () => {
    const token = core.getInput("github_token");
    const repository = getFromEnv("GITHUB_REPOSITORY");

    let baseBranch = core.getInput("default_branch");
    if (!baseBranch) {
      baseBranch = await getDefaultBranch({ token, repository });
    }

    const author = getFromEnv("GITHUB_ACTOR");
    return createOrUpdatePullRequest({
      branch: core.getInput("branch"),
      token,
      baseBranch,
      title: core.getInput("commit_title"),
      pullBody: buildPullRequestBody(report, version),
      commitBody: buildCommitBody(report),
      repository,
      author,
      email: `${author}@users.noreply.github.com`,
      labels: commaSeparatedList(core.getInput("labels")),
    });
  });
}

console.log(hasYarn());
run(hasYarn() ? yarnRunner : npmRunner).catch((e) => core.setFailed(e.message));
