import fs from "fs";
import { Program } from "./program";

// utility

const p = new Program(`
  function foo() {
    if (true) {
      memwrite(0, 1);
    }

    return memread(0) === 1;
  }
`);

const result = p.parse();
const file   = process.argv[2];

if (!file) {
  console.log(`Usage: node ${ process.argv[1] } OUTFILE`);
} else {
  fs.writeFileSync(file, result);
}
