const fs = require("fs");
const { README_PATH } = require("./config");

function replaceSection(readme, startMarker, endMarker, newContent) {
  const startIdx = readme.indexOf(startMarker);
  const endIdx = readme.indexOf(endMarker);

  if (startIdx === -1 || endIdx === -1) {
    console.log(`  ⚠️  ${startMarker} not found, skipping.`);
    return { readme, changed: false };
  }

  const newReadme =
    readme.substring(0, startIdx + startMarker.length) +
    "\n\n" +
    newContent +
    "\n\n" +
    readme.substring(endIdx);

  return { readme: newReadme, changed: newReadme !== readme };
}

function updateREADME(sections) {
  console.log("📝 Updating README.md...");
  let readme = fs.readFileSync(README_PATH, "utf8");
  let anyChanged = false;

  for (const section of sections) {
    const result = replaceSection(readme, section.start, section.end, section.content);
    if (result.changed) {
      readme = result.readme;
      anyChanged = true;
    }
  }

  if (!anyChanged) {
    console.log("✅ No changes needed. README.md is up to date.");
    return;
  }

  fs.writeFileSync(README_PATH, readme);
  console.log("✅ README.md updated successfully!");
}

module.exports = { replaceSection, updateREADME };
