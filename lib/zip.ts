import { zip as fzip, ZipPassThrough } from "fflate";

export interface ZipEntry {
  name: string;
  data: Uint8Array;
}

/** Bundle multiple optimized images into a single .zip (runs in-browser). */
export function downloadZip(entries: ZipEntry[], filename = "compressly.zip"): Promise<void> {
  return new Promise((resolve, reject) => {
    const files: Record<string, Uint8Array> = {};
    for (const e of entries) {
      // de-duplicate names defensively
      let name = e.name;
      let i = 1;
      while (files[name]) {
        const dot = name.lastIndexOf(".");
        name = dot > 0 ? `${name.slice(0, dot)}-${i}${name.slice(dot)}` : `${name}-${i}`;
        i++;
      }
      files[name] = e.data;
    }
    fzip(files, { level: 6 }, (err, out) => {
      if (err) return reject(err);
      const zipBuffer = out.buffer.slice(out.byteOffset, out.byteOffset + out.byteLength) as ArrayBuffer;
      const blob = new Blob([zipBuffer], { type: "application/zip" });
      const url = URL.createObjectURL(blob);
      const a = document.createElement("a");
      a.href = url;
      a.download = filename;
      document.body.appendChild(a);
      a.click();
      a.remove();
      setTimeout(() => URL.revokeObjectURL(url), 1000);
      resolve();
    });
  });
}
