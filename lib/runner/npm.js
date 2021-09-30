import * as core from "@actions/core";
import { exec } from "@actions/exec";
import npmArgs from "./../npmArgs.js";
import { NPM_VERSION } from "./../constants.js";
import updateNpm from "./../updateNpm.js";
import listPackages from "./../listPackages.js";
import audit from "./../audit.js";
import auditFix from "./../auditFix.js";

export const getVersion = async () =>
  await core.group(`Update npm to ${NPM_VERSION}`, () => updateNpm(NPM_VERSION));

export const install = async () =>
  await core.group("Install user packages", async () => {
    await exec("npm", npmArgs("ci"));
  });

export const getAuditReport = async () =>
  await core.group("Get audit report", async () => {
    const res = await audit();
    core.info(JSON.stringify(res, null, 2));
    return res;
  });

export const getBeforePackages = async () =>
  await core.group("List packages before", () => listPackages());

export const fix = async () => await core.group("Fix vulnerabilities", () => auditFix());

export const reinstall = async () =>
  await core.group("Re-install user packages", async () => {
    await exec("npm", npmArgs("ci"));
  });

export const getAfterPackages = async () =>
  await core.group("List packages after", () => listPackages());
