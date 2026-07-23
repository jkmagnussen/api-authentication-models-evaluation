import fs from "fs";
import path from "path";
import { GENERATED_FILES } from "./report-paths";

type HistorySnapshot = {
  generatedAt?: string;
};

type AnalysisWindow = {
  generatedAt: string;
  lockedAt: string;
  frozenHistoryMaxGeneratedAt: string | null;
  historySnapshotsAtLock: number;
};

function getLatestHistoryGeneratedAt(historyDir: string): { latest: string | null; count: number } {
  if (!fs.existsSync(historyDir)) return { latest: null, count: 0 };

  const files = fs
    .readdirSync(historyDir)
    .filter((file) => file.endsWith(".json"))
    .sort();

  let latest: string | null = null;
  let count = 0;

  for (const fileName of files) {
    const filePath = path.join(historyDir, fileName);
    try {
      const snapshot = JSON.parse(fs.readFileSync(filePath, "utf8")) as HistorySnapshot;
      if (snapshot.generatedAt && (!latest || snapshot.generatedAt > latest)) {
        latest = snapshot.generatedAt;
      }
      count += 1;
    } catch {
      // Ignore malformed snapshots.
    }
  }

  return { latest, count };
}

function main(): void {
  const root = process.cwd();
  const outputPath = path.join(root, GENERATED_FILES.analysisWindow);
  const historyDir = path.join(root, "ai-generated", "arms", "history");
  const shouldRefresh = process.argv.includes("--refresh");
  const now = new Date().toISOString();

  if (fs.existsSync(outputPath) && !shouldRefresh) {
    const existing = JSON.parse(fs.readFileSync(outputPath, "utf8")) as AnalysisWindow;
    const preserved: AnalysisWindow = {
      ...existing,
      generatedAt: now,
    };
    fs.writeFileSync(outputPath, JSON.stringify(preserved, null, 2));
    console.log(`Preserved frozen analysis window: ${outputPath}`);
    return;
  }

  const historySummary = getLatestHistoryGeneratedAt(historyDir);
  const payload: AnalysisWindow = {
    generatedAt: now,
    lockedAt: now,
    frozenHistoryMaxGeneratedAt: historySummary.latest,
    historySnapshotsAtLock: historySummary.count,
  };

  fs.writeFileSync(outputPath, JSON.stringify(payload, null, 2));
  console.log(`${shouldRefresh ? "Refreshed" : "Locked"} analysis window: ${outputPath}`);
}

main();
