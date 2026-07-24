import { useQuery } from "@tanstack/react-query";
import {
  AlertCircle,
  BarChart2,
  ChevronRight,
  Clock,
  Download,
  FileDown,
  FileText,
  Package,
  TrendingUp,
  type LucideIcon,
} from "lucide-react";
import BarChartSimple from "../components/BarChartSimple";
import { AppButton, IconTile, SectionLabel, Surface } from "../components/AppUI";
import { NavStrip, TopNav } from "../components/TopNav";
import { queryKeys } from "../queries/keys";
import { getReports, type ReportBreakdown, type ReportSummary } from "../services/api";
import { useTheme } from "../theme/ThemeContext";
import type { PageName } from "../types";
import { NAV_ID_TO_PAGE, PAGE_TO_NAV_ID } from "../utils/nav";

const csvCell = (value: unknown) => `"${String(value ?? "").replaceAll('"', '""')}"`;
const toCsv = (rows: unknown[][]) => rows.map((row) => row.map(csvCell).join(",")).join("\n");

function downloadFile(name: string, content: string, type = "text/csv;charset=utf-8") {
  const url = URL.createObjectURL(new Blob([content], { type }));
  const anchor = document.createElement("a");
  anchor.href = url;
  anchor.download = name;
  anchor.click();
  URL.revokeObjectURL(url);
}

function inventoryCsv(report: ReportSummary) {
  return toCsv([
    ["Section", "Name", "Item count", "Estimated value"],
    ...report.rooms.map((entry) => ["Room", entry.name, entry.count, entry.value]),
    ...report.categories.map((entry) => ["Category", entry.name, entry.count, entry.value]),
  ]);
}

function missingInfoCsv(report: ReportSummary) {
  return toCsv([
    ["Item", "Room", "Missing fields"],
    ...report.missingInfo.map((item) => [item.name, item.room, item.missing.join(", ")]),
  ]);
}

interface StatCardProps {
  label: string;
  value: string | number;
  sub: string;
  Icon: LucideIcon;
  iconClass: string;
}

function StatCard({ label, value, sub, Icon, iconClass }: StatCardProps) {
  return (
    <Surface padding="sm">
      <IconTile Icon={Icon} size="sm" className={`mb-3 ${iconClass}`} />
      <div className="text-xl font-bold truncate">{value}</div>
      <div className="text-[11px] font-semibold">{label}</div>
      <div className="text-[10px] text-muted-foreground">{sub}</div>
    </Surface>
  );
}

interface ReportChartProps {
  title: string;
  entries: ReportBreakdown[];
  metric: "count" | "value";
  color?: string;
}

function ReportChart({ title, entries, metric, color }: ReportChartProps) {
  return (
    <Surface>
      <div className="mb-4">
        <SectionLabel>{title}</SectionLabel>
      </div>
      <BarChartSimple
        data={entries.map((entry) => ({ label: entry.name, value: entry[metric] }))}
        height={176}
        barColor={color}
        formatValue={
          metric === "value"
            ? (value) => `$${value >= 1000 ? `${(value / 1000).toFixed(1)}k` : value.toFixed(0)}`
            : undefined
        }
      />
    </Surface>
  );
}

interface MissingInfoPanelProps {
  report: ReportSummary;
  onFix: () => void;
}

function MissingInfoPanel({ report, onFix }: MissingInfoPanelProps) {
  return (
    <div className="bg-card rounded-2xl border border-border shadow-sm overflow-hidden">
      <div className="px-5 py-4 border-b border-border flex justify-between">
        <SectionLabel>Missing Information</SectionLabel>
        <AppButton
          onClick={() => downloadFile("missing-information.csv", missingInfoCsv(report))}
          variant="ghost"
          size="sm"
          Icon={Download}
        >
          CSV
        </AppButton>
      </div>
      {report.missingInfo.length === 0 ? (
        <p className="p-8 text-sm text-muted-foreground text-center">All inventory records are complete.</p>
      ) : (
        report.missingInfo.map((item, index) => (
          <div
            key={item.id}
            className={`flex items-center gap-4 px-5 py-3.5 ${index < report.missingInfo.length - 1 ? "border-b border-border/40" : ""}`}
          >
            <AlertCircle size={15} className="text-amber-600" />
            <div className="flex-1">
              <p className="text-sm font-semibold">{item.name}</p>
              <p className="text-[11px] text-muted-foreground">
                {item.room || "No room"} · Missing: {item.missing.join(", ")}
              </p>
            </div>
            <button
              onClick={onFix}
              className="h-7 px-3 rounded-lg border border-border text-[11px] font-semibold"
            >
              Fix
            </button>
          </div>
        ))
      )}
    </div>
  );
}

function RecentActivityPanel({ report }: { report: ReportSummary }) {
  return (
    <div className="bg-card rounded-2xl border border-border shadow-sm overflow-hidden h-fit">
      <div className="px-5 py-4 border-b border-border">
        <SectionLabel>Recent Activity</SectionLabel>
      </div>
      {report.recentActivity.length === 0 ? (
        <p className="p-8 text-sm text-muted-foreground text-center">No activity yet.</p>
      ) : (
        report.recentActivity.map((activity, index) => (
          <div
            key={`${activity.itemId}-${activity.createdAt}`}
            className={`flex gap-3 px-5 py-4 ${index < report.recentActivity.length - 1 ? "border-b border-border/40" : ""}`}
          >
            <div className="w-7 h-7 rounded-xl bg-emerald-50 flex items-center justify-center">
              <FileText size={13} className="text-emerald-600" />
            </div>
            <div>
              <p className="text-xs font-semibold">{activity.itemName} added</p>
              <p className="text-[10px] text-muted-foreground mt-1">
                {activity.roomName || "No room"} · {new Date(activity.createdAt).toLocaleDateString()}
              </p>
            </div>
          </div>
        ))
      )}
    </div>
  );
}

export interface ReportsPageProps {
  onSignOut: () => void;
  onNavigate: (page: PageName) => void;
  onSettings?: () => void;
}

export default function ReportsPage({ onSignOut, onNavigate, onSettings }: ReportsPageProps) {
  const { tokens } = useTheme();
  const reportsQuery = useQuery({ queryKey: queryKeys.reports, queryFn: getReports });
  const report = reportsQuery.data;
  const topCategory = report?.categories.reduce<ReportBreakdown | undefined>(
    (best, category) => (!best || category.value > best.value ? category : best),
    undefined,
  );

  return (
    <div className="min-h-screen bg-background text-foreground">
      <TopNav onSignOut={onSignOut} onSettings={onSettings} onNavigate={onNavigate} />
      <main className="max-w-[1440px] mx-auto px-8 py-7 space-y-6">
        <NavStrip
          active={PAGE_TO_NAV_ID.reports ?? "reports"}
          onSelect={(id) => {
            const page = NAV_ID_TO_PAGE[id];
            if (page) onNavigate(page);
          }}
        />

        <div className="flex items-center gap-2 text-sm text-muted-foreground">
          <button onClick={() => onNavigate("dashboard")}>Dashboard</button>
          <ChevronRight size={13} />
          <span className="text-foreground font-medium">Reports</span>
        </div>

        <div className="flex items-start justify-between">
          <div>
            <h1 className="font-display text-[26px]">Reports</h1>
            <p className="text-sm text-muted-foreground mt-1">
              Live inventory value and organization trends.
            </p>
          </div>
          <div className="flex gap-2">
            <AppButton
              disabled={!report}
              onClick={() => report && downloadFile("inventory-report.csv", inventoryCsv(report))}
              Icon={FileDown}
            >
              Download CSV
            </AppButton>
            <AppButton
              disabled={!report}
              onClick={() =>
                report &&
                downloadFile("inventory-report.json", JSON.stringify(report, null, 2), "application/json")
              }
              variant="primary"
              Icon={Download}
            >
              Export Report
            </AppButton>
          </div>
        </div>

        {reportsQuery.isLoading && (
          <div className="py-20 text-center text-sm text-muted-foreground">Building your report…</div>
        )}
        {reportsQuery.isError && (
          <div className="py-20 text-center text-sm text-red-600">Unable to load report data.</div>
        )}
        {report && (
          <>
            <div className="grid grid-cols-5 gap-4">
              <StatCard
                label="Total Items"
                value={report.totalItems}
                sub="Inventory records"
                Icon={Package}
                iconClass="bg-blue-50 text-blue-600"
              />
              <StatCard
                label="Total Value"
                value={`$${report.estimatedValue.toLocaleString()}`}
                sub="Quantity adjusted"
                Icon={TrendingUp}
                iconClass="bg-emerald-50 text-emerald-600"
              />
              <StatCard
                label="Top Category"
                value={topCategory?.name ?? "—"}
                sub={topCategory ? `$${topCategory.value.toLocaleString()}` : "No data"}
                Icon={BarChart2}
                iconClass="bg-violet-50 text-violet-600"
              />
              <StatCard
                label="Missing Info"
                value={report.missingInfoTotal}
                sub="Incomplete records"
                Icon={AlertCircle}
                iconClass="bg-amber-50 text-amber-600"
              />
              <StatCard
                label="Added This Month"
                value={report.addedThisMonth}
                sub="New records"
                Icon={Clock}
                iconClass="bg-pink-50 text-pink-600"
              />
            </div>

            <div className="grid grid-cols-3 gap-5">
              <ReportChart title="Items by Room" entries={report.rooms} metric="count" />
              <ReportChart
                title="Items by Category"
                entries={report.categories}
                metric="count"
                color={tokens.accent}
              />
              <ReportChart
                title="Value by Category"
                entries={report.categories}
                metric="value"
                color="#10B981"
              />
            </div>

            <div className="grid grid-cols-[1fr_340px] gap-5">
              <MissingInfoPanel report={report} onFix={() => onNavigate("allItems")} />
              <RecentActivityPanel report={report} />
            </div>
          </>
        )}
      </main>
    </div>
  );
}
