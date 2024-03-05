import { exec } from "child_process";

import { promisify } from "util";
import open from "open";

import select, { Separator } from "@inquirer/select";
import input from "@inquirer/input";

import path from "path";

import fs from "fs";
import os from "os";

const execAsync = promisify(exec);

async function doIt() {
  try {
    const ret = await execAsync("porter cluster list");

    const configFile = path.resolve(os.homedir(), ".porterdiffrc");

    let fileContent: { org?: string } = {};
    if (fs.existsSync(configFile)) {
      const data = fs.readFileSync(configFile, "utf8");
      fileContent = JSON.parse(data);
    }

    const oldOrg = fileContent.org;

    const org = await input({
      message: "Enter the Github org/user name",
      default: oldOrg,
      validate: (input) =>
        input.trim().length > 3 ? true : "Please enter 3 or more characters",
    });

    fileContent.org = org;

    fs.writeFileSync(configFile, JSON.stringify(fileContent), { flag: "w" });

    const clusters = ret.stdout
      .split("\n")
      .slice(1)
      .filter((line) => line.trim() !== "")
      .map((line) => {
        const [id, name, server] = line.split(/\s+/);
        return { id, name, server };
      });

    const choices = clusters.map((cluster) => ({
      name: `${cluster.name} (${cluster.id})`,
      value: cluster.id,
      description: cluster.server,
    }));

    const stagingSelection: string = await select({
      message: "Select the staging cluster",
      choices,
    });

    const sragr = await execAsync(
      `porter list apps --cluster ${stagingSelection}`,
    );

    const snames = sragr.stdout
      .split("\n")
      .slice(1)
      .filter((line: any) => line.trim() !== "")
      .map((line: any) => {
        const [name] = line.split(/\s+/);

        return name;
      });

    console.log(snames);

    const stagingApp = await select({
      message: "Select the staging app",
      choices: snames.map((name: any) => ({ name, value: name })),
    });

    const disabledChoice = ((c) => (c ? { ...c, disabled: true } : undefined))(
      choices.find((choice) => choice.value === stagingSelection),
    );

    const productionSelection = await select({
      message: "Select the production cluster",
      choices: [
        ...choices.filter((choice) => choice.value !== stagingSelection),
        new Separator(),
        ...(disabledChoice ? [disabledChoice] : []),
      ],
    });

    const pragr = await execAsync(
      `porter list apps --cluster ${productionSelection}`,
    );

    const pnames = pragr.stdout
      .split("\n")
      .slice(1)
      .filter((line: any) => line.trim() !== "")
      .map((line: any) => {
        const [name] = line.split(/\s+/);
        return name;
      });
    const productionApp = await select({
      message: "Select the production app",
      choices: pnames.map((name: any) => ({ name, value: name })),
    });

    const stagingTag = `porter get values ${stagingApp} --cluster ${stagingSelection} | grep 'tag:'`;
    const ProductionTag = `porter get values ${productionApp} --cluster ${productionSelection} | grep 'tag:'`;

    const execs = await Promise.all(
      [stagingTag, ProductionTag].map((cmd) => execAsync(cmd)),
    );

    const tags = execs.map((exec) => exec.stdout.split(":")[1].trim());

    const repoName = await input({
      message: "Enter the Github repo name",
      default: productionApp,
      validate: (input) =>
        input.trim().length > 1 ? true : "Please enter 1 or more characters",
    });

    const gitGubDiffUrl = `https://github.com/invoice-simple/${repoName}/compare/${tags[1]}...${tags[0]}`;

    console.log(gitGubDiffUrl);

    open(gitGubDiffUrl);
  } catch (error) {
    throw error;
  }
}

doIt().catch(console.error);
