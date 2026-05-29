import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';

const pdfDir = path.join(path.dirname(fileURLToPath(import.meta.url)), '..', 'static', 'pdf');

const replacements = [
  ['http://book.pallcare.info/index.php?tid=7', 'https://www.rightdecisions.scot.nhs.uk/scottish-palliative-care-guidelines/scottish-palliative-care-guidelines/symptoms/symptom-management/diarrhoea/'],
  ['http://www.nhs.uk/conditions/Hiccup/Pages/Introduction.aspx', 'https://www.nhs.uk/conditions/hiccups/'],
  ['https://learn.nes.nhs.scot/64382/pharmacy/enhanced-palliative-care-module', 'https://learn.nes.nhs.scot/68299'],
  ['https://nhsinform.scot/care-support-and-rights/palliative-care/symptom-control/breathlessness', 'https://www.nhsinform.scot/care-support-and-rights/palliative-care/managing-symptoms/breathlessness'],
  ['http://www.myconditionmylife.org/', 'https://www.alliance-scotland.org.uk/blog/resources/my-condition-my-life-resource-pack/'],
  ['https://cdel-palliative.org.il/Symptom_Control/BowelObstruction', 'https://cdel-palliative.org.il/Symptom_Control/BowelObstruction.html'],
  ['https://cdel-palliative.org.il/Symptom_Control/Constipation', 'https://cdel-palliative.org.il/Symptom_Control/Constipation.html'],
  ['https://rightdecisions.scot.nhs.uk/scottish-palliative-care-guidelines/symptom-control/anorexiacachexia/', 'https://www.rightdecisions.scot.nhs.uk/scottish-palliative-care-guidelines/scottish-palliative-care-guidelines/symptoms/symptom-management/anorexiacachexia/'],
  ['https://rightdecisions.scot.nhs.uk/scottish-palliative-care-guidelines/symptom-control/breathlessness/', 'https://www.rightdecisions.scot.nhs.uk/scottish-palliative-care-guidelines/scottish-palliative-care-guidelines/symptoms/symptom-management/breathlessness/'],
  ['https://rightdecisions.scot.nhs.uk/scottish-palliative-care-guidelines/symptom-control/constipation/', 'https://www.rightdecisions.scot.nhs.uk/scottish-palliative-care-guidelines/scottish-palliative-care-guidelines/symptoms/symptom-management/constipation/'],
  ['https://rightdecisions.scot.nhs.uk/scottish-palliative-care-guidelines/symptom-control/delirium/', 'https://www.rightdecisions.scot.nhs.uk/scottish-palliative-care-guidelines/scottish-palliative-care-guidelines/symptoms/symptom-management/delirium/'],
  ['https://rightdecisions.scot.nhs.uk/scottish-palliative-care-guidelines/symptom-control/hiccups/', 'https://www.rightdecisions.scot.nhs.uk/scottish-palliative-care-guidelines/scottish-palliative-care-guidelines/symptoms/symptom-management/hiccups/'],
  ['https://rightdecisions.scot.nhs.uk/scottish-palliative-care-guidelines/symptom-control/nausea-and-vomiting/', 'https://www.rightdecisions.scot.nhs.uk/scottish-palliative-care-guidelines/scottish-palliative-care-guidelines/symptoms/symptom-management/nausea-and-vomiting/'],
  ['https://rightdecisions.scot.nhs.uk/scottish-palliative-care-guidelines/palliative-emergencies/bleeding/', 'https://www.rightdecisions.scot.nhs.uk/scottish-palliative-care-guidelines/scottish-palliative-care-guidelines/palliative-emergencies/bleeding/'],
  ['https://rightdecisions.scot.nhs.uk/scottish-palliative-care-guidelines/palliative-emergencies/malignant-spinal-cord-compression/', 'https://www.rightdecisions.scot.nhs.uk/scottish-palliative-care-guidelines/scottish-palliative-care-guidelines/palliative-emergencies/malignant-spinal-cord-compression/'],
  ['https://rightdecisions.scot.nhs.uk/scottish-palliative-care-guidelines/palliative-emergencies/superior-vena-cava-obstruction/', 'https://www.rightdecisions.scot.nhs.uk/scottish-palliative-care-guidelines/scottish-palliative-care-guidelines/palliative-emergencies/superior-vena-cava-obstruction/'],
  ['https://rightdecisions.scot.nhs.uk/scottish-palliative-care-guidelines/', 'https://www.rightdecisions.scot.nhs.uk/scottish-palliative-care-guidelines/'],
];

function countOccurrences(buf, needle) {
  let count = 0;
  let i = 0;
  while ((i = buf.indexOf(needle, i)) !== -1) {
    count++;
    i += needle.length;
  }
  return count;
}

let totalReplacements = 0;
let filesUpdated = 0;

for (const name of fs.readdirSync(pdfDir).filter((f) => f.endsWith('.pdf'))) {
  const filePath = path.join(pdfDir, name);
  let buf = fs.readFileSync(filePath);
  let fileCount = 0;

  for (const [oldStr, newStr] of replacements) {
    const old = Buffer.from(oldStr, 'ascii');
    const neu = Buffer.from(newStr, 'ascii');
    const n = countOccurrences(buf, old);
    if (n > 0) {
      buf = Buffer.from(buf);
      const parts = [];
      let start = 0;
      let idx;
      while ((idx = buf.indexOf(old, start)) !== -1) {
        parts.push(buf.subarray(start, idx), neu);
        start = idx + old.length;
        fileCount += 1;
      }
      parts.push(buf.subarray(start));
      buf = Buffer.concat(parts);
      console.log(`  ${name}: ${oldStr} -> x${n}`);
    }
  }

  if (fileCount > 0) {
    if (!buf.subarray(0, 5).equals(Buffer.from('%PDF-'))) {
      console.error(`WARNING: ${name} may be corrupted`);
    }
    fs.writeFileSync(filePath, buf);
    filesUpdated++;
    totalReplacements += fileCount;
    console.log(`Updated ${name} (${fileCount} replacement(s))`);
  }
}

console.log(`\nDone: ${totalReplacements} replacement(s) in ${filesUpdated} file(s).`);

const legacyRe = /https:\/\/rightdecisions\.scot\.nhs\.uk\/scottish-palliative-care-guidelines\/(symptom-control|palliative-emergencies)\//;
const remaining = [];
for (const name of fs.readdirSync(pdfDir).filter((f) => f.endsWith('.pdf'))) {
  const text = fs.readFileSync(path.join(pdfDir, name)).toString('ascii');
  if (legacyRe.test(text)) remaining.push(name);
}
if (remaining.length) {
  console.error(`Legacy URLs still present in: ${remaining.join(', ')}`);
  process.exit(1);
}
