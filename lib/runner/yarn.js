import * as core from "@actions/core";
import { exec } from "@actions/exec";
import audit from "./../yarnAudit.js";
import yarnArgs from "./../yarnArgs.js";
import { YARN_VERSION } from "./../constants.js";

export const getVersion = async () =>
  await core.group(`Update yarn to ${YARN_VERSION}`, () => YARN_VERSION);

export const install = async () =>
  await core.group("Install user packages", async () => {
    await exec("yarn", yarnArgs("--frozen-lockfile"));
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
