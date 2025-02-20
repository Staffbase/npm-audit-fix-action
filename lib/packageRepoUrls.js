import { info } from "@actions/core";
import { getExecOutput } from "@actions/exec";
import * as hostedGitInfo from "hosted-git-info";

/**
 * @type {Map<string, UrlInfo>}
 */
const cache = new Map();

/**
 * @param {string} packageName
 * @returns {Promise<UrlInfo | null>}
 */
async function fetchUrl(packageName) {
  const cached = cache.get(packageName);
  if (cached) {
    return cached;
  }

  const {
    exitCode,
    stdout: origStdout,
    stderr,
  } = await getExecOutput("npm", ["view", packageName, "repository.url"], {
    silent: true,
    ignoreReturnCode: true,
  });

  // code E404 means the package does not exist on npm
  // which means it is a file: or git: dependency
  // We are fine with 404 errors, but not with any other errors
  if (exitCode !== 0 && !stderr.includes("code E404")) {
    throw new Error(`stderr: ${stderr}`);
  }

  const stdout = origStdout.trim();

  if (stdout === "") {
    info(`No repository URL for '${packageName}'`);
    return null;
  }

  const url = hostedGitInfo.fromUrl(stdout);
  if (!url) {
    info(`No repository URL for '${packageName}'`);
    return null;
  }
  const urlInfo = { name: packageName, url: url.browse(), type: url.type };

  cache.set(packageName, urlInfo);

  return urlInfo;
}

/**
 * @param {string[]} packageNames
 * @returns {Promise<Record<string, UrlInfo>>}
 */
export default async function packageRepoUrls(packageNames) {
  const allUrls = await Promise.all(packageNames.map(fetchUrl));

  /**
   * @type {Record<string, UrlInfo>}
   */
  const map = {};
  for (const url of allUrls) {
    if (url) {
      map[url.name] = url;
    }
  }
  return map;
}
