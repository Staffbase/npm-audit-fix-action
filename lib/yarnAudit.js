import { exec } from "@actions/exec";
import yarnArgs from "./yarnArgs.js";

const report = {
  type: "auditAdvisory",
  data: {
    resolution: {
      id: 1500,
      path: "webpack>yargs>yargs-parser",
      dev: false,
      optional: false,
      bundled: false,
    },
    advisory: {
      findings: [{ version: "4.2.1", paths: ["webpack>yargs>yargs-parser"] }],
      found_by: { link: "", name: "Snyk Security Team", email: "" },
      module_name: "yargs-parser",
      reported_by: { link: "", name: "Snyk Security Team", email: "" },
      cves: [],
      references:
        "- [Snyk Report](https://snyk.io/vuln/SNYK-JS-YARGSPARSER-560381)\n- [GitHub Advisory](https://github.com/advisories/GHSA-p9pc-299p-vxgp)\n",
      updated: "2021-09-23T08:07:06.331Z",
      id: 1500,
      deleted: null,
      severity: "low",
      created: "2020-03-26T19:21:50.174Z",
      metadata: { module_type: "", exploitability: 1, affected_components: "" },
      vulnerable_versions: "<13.1.2 || >=14.0.0 <15.0.1 || >=16.0.0 <18.1.2",
      overview:
        "Affected versions of `yargs-parser` are vulnerable to prototype pollution. Arguments are not properly sanitized, allowing an attacker to modify the prototype of `Object`, causing the addition or modification of an existing property that will exist on all objects.  \nParsing the argument `--foo.__proto__.bar baz'` adds a `bar` property with value `baz` to all objects. This is only exploitable if attackers have control over the arguments being passed to `yargs-parser`.\n",
      cwe: "CWE-471",
      patched_versions: ">=13.1.2 <14.0.0 || >=15.0.1 <16.0.0 || >=18.1.2",
      title: "Prototype Pollution",
      recommendation: "Upgrade to versions 13.1.2, 15.0.1, 18.1.1 or later.",
      access: "public",
      url: "https://npmjs.com/advisories/1500",
    },
  },
};

const parseReport = report => {
  const lines = report.split(\n);

  return lines.map((l) => json.parse(l)).filter(l => l.type === "auditAdvisory").map(l => l.data.advisory)
}

/**
 * @param {typeof exec} execFn
 * @returns {Promise<AuditReport>}
 */
export default async function audit(execFn = exec) {
  let report = "";
  await execFn("yarn", npmArgs("audit", "--json"), {
    listeners: {
      stdout: (data) => {
        report += data.toString();
      },
    },
    ignoreReturnCode: true,
  });
  const vulnerabilities = parseReport(report);

  if (vulnerabilities != null && typeof vulnerabilities === "object") {
    const map = /** @type {AuditReport} */ new Map();

    vulnerabilities.forEach(({ severity, module_name: name, title, url }) => {
      map.set(name, { name, severity, title, url });
    });

    return map;
  }

  throw new Error('"vulnerabilities" is missing');
}
