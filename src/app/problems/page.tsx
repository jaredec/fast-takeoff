import { readFileSync } from "node:fs";
import path from "node:path";
import { Problems } from "@/components/Problems";
import { loadDataset } from "@/lib/data";
import { creditMarks } from "@/lib/logos";

export default function Page() {
  const { problems } = loadDataset();
  const srcs = new Set(problems.flatMap((p) => (p.by ?? []).flatMap((c) => creditMarks(c).map((m) => m.src))));
  const css = [...srcs]
    .map((src) => {
      const type = src.endsWith(".png") ? "image/png" : "image/svg+xml";
      const data = readFileSync(path.join(process.cwd(), "public", src)).toString("base64");
      return `.faces [data-mark="${src}"]{background-image:url(data:${type};base64,${data})}`;
    })
    .join("");

  return (
    <>
      <style>{css}</style>
      <Problems problems={problems} />
    </>
  );
}
