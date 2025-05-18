import { readdir, stat, open, write } from "node:fs/promises";
import { resolve, parse } from "node:path";

const MAX_FILE_SIZE_BYTES = 45 * 1024 * 1024; // 95MB
const SOURCE_FOLDER = "src/gtfs/";

async function splitFile(
  filePath: string,
  fileNameNoExt: string,
  fileExt: string
) {
  console.log(`Splitting ${fileNameNoExt}${fileExt}...`);
  const file = await Bun.file(filePath);
  const reader = file.stream().getReader();

  let partNumber = 0;
  let currentSize = 0;
  let linesForCurrentPart: string[] = [];
  let header = "";

  // Read the header line first (assuming GTFS files have one)
  const firstLineResult = await reader.read();
  if (!firstLineResult.done) {
    const firstLineDecoder = new TextDecoder();
    const firstLineChunk = firstLineDecoder.decode(firstLineResult.value, {
      stream: true,
    });
    const firstLineEnd = firstLineChunk.indexOf("\n");
    if (firstLineEnd !== -1) {
      header = firstLineChunk.substring(0, firstLineEnd + 1);
      // Add header to the first part's lines and size
      linesForCurrentPart.push(header);
      currentSize += Buffer.byteLength(header, "utf-8");

      // Handle remaining part of the first chunk if any
      let remainingChunk = firstLineChunk.substring(firstLineEnd + 1);
      if (remainingChunk.length > 0) {
        const lines = remainingChunk.split("\n");
        for (let i = 0; i < lines.length; i++) {
          const line = lines[i] + (i < lines.length - 1 ? "\n" : ""); // Add newline back except for potential last partial line
          if (
            currentSize + Buffer.byteLength(line, "utf-8") >
              MAX_FILE_SIZE_BYTES &&
            linesForCurrentPart.length > 1
          ) {
            // Write current part (ensure it's not just the header)
            await Bun.write(
              resolve(
                SOURCE_FOLDER,
                `${fileNameNoExt}.${partNumber}${fileExt}`
              ),
              linesForCurrentPart.join("")
            );
            console.log(`Created ${fileNameNoExt}.${partNumber}${fileExt}`);
            partNumber++;
            linesForCurrentPart = [header]; // Start new part with header
            currentSize = Buffer.byteLength(header, "utf-8");
          }
          linesForCurrentPart.push(line);
          currentSize += Buffer.byteLength(line, "utf-8");
        }
      }
    } else {
      // If no newline in the first chunk, assume it's a very long single line or part of it.
      // This simplified script might struggle with extremely long lines without newlines.
      // For GTFS, this is unlikely to be an issue with the header.
      header = firstLineChunk;
      linesForCurrentPart.push(header);
      currentSize += Buffer.byteLength(header, "utf-8");
    }
  } else {
    console.warn(`File ${fileNameNoExt}${fileExt} is empty or unreadable.`);
    return;
  }

  const decoder = new TextDecoder();
  let leftover = ""; // To store partial lines from previous chunks

  while (true) {
    const { done, value } = await reader.read();
    if (done) {
      // Process any leftover data
      if (leftover) {
        if (
          currentSize + Buffer.byteLength(leftover, "utf-8") >
            MAX_FILE_SIZE_BYTES &&
          linesForCurrentPart.length > 1
        ) {
          await Bun.write(
            resolve(SOURCE_FOLDER, `${fileNameNoExt}.${partNumber}${fileExt}`),
            linesForCurrentPart.join("")
          );
          console.log(`Created ${fileNameNoExt}.${partNumber}${fileExt}`);
          partNumber++;
          linesForCurrentPart = [header];
          currentSize = Buffer.byteLength(header, "utf-8");
        }
        linesForCurrentPart.push(leftover);
        currentSize += Buffer.byteLength(leftover, "utf-8");
      }
      break;
    }

    let chunk = decoder.decode(value, { stream: true });
    chunk = leftover + chunk; // Prepend leftover from previous chunk
    const lines = chunk.split("\n");

    // The last element in 'lines' might be a partial line if chunk doesn't end with a newline
    leftover = lines.pop() || "";

    for (const lineWithNewline of lines.map((l) => l + "\n")) {
      const lineSize = Buffer.byteLength(lineWithNewline, "utf-8");

      if (
        currentSize + lineSize > MAX_FILE_SIZE_BYTES &&
        linesForCurrentPart.length > 1
      ) {
        // Ensure more than just header
        await Bun.write(
          resolve(SOURCE_FOLDER, `${fileNameNoExt}.${partNumber}${fileExt}`),
          linesForCurrentPart.join("")
        );
        console.log(`Created ${fileNameNoExt}.${partNumber}${fileExt}`);
        partNumber++;
        linesForCurrentPart = [header]; // Start new part with header
        currentSize = Buffer.byteLength(header, "utf-8");
      }
      linesForCurrentPart.push(lineWithNewline);
      currentSize += lineSize;
    }
  }

  // Write the last part if it has content (more than just the header or if it's the only part)
  if (
    linesForCurrentPart.length > 1 ||
    (linesForCurrentPart.length === 1 &&
      linesForCurrentPart[0] !== header &&
      partNumber === 0) ||
    (linesForCurrentPart.length > 0 && partNumber === 0 && !header)
  ) {
    // The condition "linesForCurrentPart[0] !== header" might be tricky if header itself is empty.
    // A better check for "content beyond just the header" might be needed if header can be empty.
    // Or simply check if currentSize > Buffer.byteLength(header, 'utf-8') if there's a header.
    // If no header, just check linesForCurrentPart.length > 0.
    await Bun.write(
      resolve(SOURCE_FOLDER, `${fileNameNoExt}.${partNumber}${fileExt}`),
      linesForCurrentPart.join("")
    );
    console.log(`Created ${fileNameNoExt}.${partNumber}${fileExt}`);
  } else if (
    linesForCurrentPart.length === 1 &&
    linesForCurrentPart[0] === header &&
    partNumber > 0
  ) {
    // This means the last part only contained the header, which shouldn't happen if logic is correct
    // or it implies the original file ended exactly on a split boundary after writing a part.
    // We typically don't want an empty (header-only) last file if previous parts were created.
  }

  console.log(`Finished splitting ${fileNameNoExt}${fileExt}.`);
  // Optionally, you might want to delete the original large file here
  // await unlink(filePath);
  // console.log(`Deleted original file: ${filePath}`);
}

async function main() {
  console.log(
    `Scanning ${SOURCE_FOLDER} for .txt files over ${
      MAX_FILE_SIZE_BYTES / (1024 * 1024)
    }MB...`
  );
  try {
    const files = await readdir(SOURCE_FOLDER);
    for (const file of files) {
      const filePath = resolve(SOURCE_FOLDER, file);
      const fileStats = await stat(filePath);
      const { name, ext, base } = parse(filePath);

      if (fileStats.isFile() && ext.toLowerCase() === ".txt") {
        // Avoid splitting already split files if the script is run multiple times
        if (/\.\d+\.txt$/.test(base.toLowerCase())) {
          console.log(`Skipping already split file: ${base}`);
          continue;
        }

        if (fileStats.size > MAX_FILE_SIZE_BYTES) {
          console.log(
            `File ${base} is ${Math.round(
              fileStats.size / (1024 * 1024)
            )}MB and needs splitting.`
          );
          await splitFile(filePath, name, ext);
        } else {
          console.log(
            `File ${base} is ${Math.round(
              fileStats.size / (1024 * 1024)
            )}MB, no splitting needed.`
          );
        }
      }
    }
  } catch (error) {
    if (error instanceof Error && "code" in error && error.code === "ENOENT") {
      console.error(`Error: The directory ${SOURCE_FOLDER} was not found.`);
    } else {
      console.error("Error processing files:", error);
    }
    process.exit(1);
  }
  console.log("Scan complete.");
}

console.log("Starting split");
main();
