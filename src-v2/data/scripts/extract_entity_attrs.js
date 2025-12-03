// extract_entity_attrs.js
import fs from "fs";
import vm from "vm";
import path from "path";

(async () => {
  // Read the raw file
  const filePath = path.resolve("./mockup-Room_entity_data.js");
  let code = fs.readFileSync(filePath, "utf-8");

  // Replace the ES export with CommonJS assignment
  code = code.replace(
    /export\s+const\s+ROOM_ENTITY_MAP\s*=/,
    "module.exports =",
  );

  // Run in a sandbox
  const sandbox = { module: { exports: {} }, exports: {} };
  vm.createContext(sandbox);
  vm.runInContext(code, sandbox);

  // Extract and print
  const data = sandbox.module.exports;
  const result = data.map(({ entity_id, attributes }) => ({
    entity_id,
    attributes,
  }));

  console.log(JSON.stringify(result, null, 2));
})();
