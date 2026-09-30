import { execSync } from "child_process";
import fs from "fs";
import path from "path";

try {
  const output = execSync("supabase gen types typescript --linked", { encoding: "utf8", maxBuffer: 1024 * 1024 * 10 });
  const outputPath = path.join(process.cwd(), "lib", "types", "database.ts");
  fs.writeFileSync(outputPath, output, "utf8");
  console.log("Successfully generated database types at lib/types/database.ts");
} catch (error) {
  console.error("Failed to generate database types:");
  console.error(error.message);
  process.exit(1);
}
