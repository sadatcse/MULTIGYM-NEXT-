"use client";

import { useRef, useState } from "react";
import * as XLSX from "xlsx";
import { toast } from "react-toastify";
import { FiCopy, FiRefreshCw, FiUpload } from "react-icons/fi";
import { useHrMutation, useHrQuery } from "@/hooks/useHr";
import { Badge, Btn, Card, Loading, Select, Table, Td } from "@/components/hr/HrUi";
import Pagination from "@/components/Comon/Pagination";

const backendOrigin = () => (process.env.NEXT_PUBLIC_BACKEND_URL || "").replace(/\/api\/?$/, "");

export function PunchesTab({ branches, me }) {
  const [date, setDate] = useState("");
  const [branch, setBranch] = useState("all");
  const [unmatched, setUnmatched] = useState(false);
  const [page, setPage] = useState(1);
  const { run, busy } = useHrMutation();
  const { data, loading, refetch } = useHrQuery("/attendance/punches", { date: date || undefined, branch, unmatched: unmatched ? "true" : undefined, page, limit: 50 });
  return (
    <Card
      title={`${data?.total ?? 0} punches`}
      subtitle="Original device evidence — never edited. Unmatched punches have a device user ID not yet linked to an employee (set it in the employee profile)."
      bodyClassName="p-0"
      actions={
        <>
          <input type="date" value={date} onChange={(e) => { setDate(e.target.value); setPage(1); }} className="px-3 py-2 rounded-2xl bg-brand-offwhite dark:bg-brand-midnight border border-brand-beige dark:border-brand-dark-grey text-xs font-bold" />
          {me?.scope === "all" && <Select value={branch} onChange={setBranch} options={[{ value: "all", label: "All branches" }, ...branches]} className="w-40" />}
          <label className="flex items-center gap-1.5 text-xs font-bold cursor-pointer"><input type="checkbox" checked={unmatched} onChange={(e) => setUnmatched(e.target.checked)} /> Unmatched only</label>
          <Btn size="sm" variant="ghost" loading={busy} onClick={async () => { if (await run("post", "/attendance/punches/relink")) refetch(); }}><FiRefreshCw /> Re-link</Btn>
        </>
      }
    >
      {loading ? (
        <Loading />
      ) : (
        <Table head={["Time", "Device user ID", "Employee", "Branch", "Device", "Source"]}>
          {(data?.data || []).map((p) => (
            <tr key={p._id}>
              <Td className="whitespace-nowrap">{p.date} {p.time}</Td>
              <Td className="font-mono">{p.deviceUserId}</Td>
              <Td>{p.employee ? `${p.employee.name} (${p.employee.employeeId})` : <span className="text-amber-500">Unmatched</span>}</Td>
              <Td>{p.branch}</Td>
              <Td className="font-mono text-[11px]">{p.deviceSerial || "—"}</Td>
              <Td><Badge tone={p.source === "device" ? "green" : "blue"}>{p.source}</Badge></Td>
            </tr>
          ))}
        </Table>
      )}
      {data?.totalPages > 1 && <div className="p-4"><Pagination currentPage={page} totalPages={data.totalPages} totalItems={data.total} itemsPerPage={50} onPageChange={setPage} /></div>}
    </Card>
  );
}

export function ImportTab({ config, me, branches, canAdd }) {
  const fileRef = useRef(null);
  const [rows, setRows] = useState([]);
  const [branch, setBranch] = useState("");
  const { run, busy } = useHrMutation();
  const origin = backendOrigin() || "https://your-backend-domain";

  const parse = async (file) => {
    const wb = XLSX.read(await file.arrayBuffer(), { cellDates: true });
    const sheet = XLSX.utils.sheet_to_json(wb.Sheets[wb.SheetNames[0]], { defval: "" });
    const pad = (n) => String(n).padStart(2, "0");
    const out = sheet
      .map((r) => {
        const keys = Object.keys(r);
        const idKey = keys.find((k) => /user|pin|^id$|ac.?no|employee/i.test(k));
        const timeKey = keys.find((k) => /time|date/i.test(k));
        let t = r[timeKey];
        if (t instanceof Date) t = `${t.getFullYear()}-${pad(t.getMonth() + 1)}-${pad(t.getDate())} ${pad(t.getHours())}:${pad(t.getMinutes())}:${pad(t.getSeconds())}`;
        return { deviceUserId: String(r[idKey] ?? "").trim(), time: String(t ?? "").trim() };
      })
      .filter((r) => r.deviceUserId && /^\d{4}-\d{2}-\d{2}[ T]\d{1,2}:\d{2}/.test(r.time));
    setRows(out);
    if (!out.length) toast.warn("No rows found. Columns needed: a User/PIN/ID column and a Date Time column (YYYY-MM-DD HH:mm).");
  };

  const copy = (t) => navigator.clipboard?.writeText(t).then(() => toast.success("Copied"));

  return (
    <div className="grid lg:grid-cols-2 gap-5">
      <Card title="Connect a ZKTeco device (real-time push)" subtitle="Device menu → COMM → Cloud Server Setting">
        <ol className="space-y-3 text-xs font-semibold text-brand-dark-grey dark:text-zinc-300 list-decimal ml-4">
          <li>Server address: <code className="px-2 py-0.5 rounded bg-brand-offwhite dark:bg-brand-midnight">{origin.replace(/^https?:\/\//, "")}</code> <button onClick={() => copy(origin)} className="text-brand-gold cursor-pointer"><FiCopy /></button></li>
          <li>Port: 443 with HTTPS on (or 80/8000 for a local server). Enable <b>Domain Name</b> if using a hostname.</li>
          <li>The device calls <code>/iclock/cdata</code> and appears in Devices as <b>Pending</b>.</li>
          <li>Assign its branch and click <b>Approve</b>. Logs kept on the device are re-sent automatically.</li>
          <li>On each employee profile set <b>Device User ID</b> = the user ID/PIN enrolled on the device.</li>
        </ol>
        {me?.scope === "all" && config?.deviceApiKey && (
          <div className="mt-5 p-3 rounded-2xl bg-brand-offwhite dark:bg-brand-midnight space-y-1.5">
            <div className="text-[11px] font-black uppercase text-brand-dark-grey">Local sync agent (older devices / LAN only)</div>
            <p className="text-[11px]">POST <code>{origin}/api/attendance/device-push</code> with header <code>x-device-key</code>:</p>
            <div className="flex items-center gap-2"><code className="text-[11px] break-all">{config.deviceApiKey}</code><button onClick={() => copy(config.deviceApiKey)} className="text-brand-gold cursor-pointer"><FiCopy /></button></div>
            <p className="text-[10px] text-brand-dark-grey">Script: <code>Backend/tools/zk-sync</code> (reads the device over LAN and pushes here).</p>
          </div>
        )}
      </Card>

      <Card title="Import device log (Excel / CSV)" subtitle="Exported from ZKTime / device USB. Columns: User ID (or PIN / AC-No) and Date Time.">
        <div className="space-y-3">
          <input ref={fileRef} type="file" accept=".xlsx,.xls,.csv" hidden onChange={(e) => e.target.files?.[0] && parse(e.target.files[0])} />
          <div className="flex flex-wrap gap-2">
            <Btn variant="ghost" onClick={() => fileRef.current?.click()}><FiUpload /> Choose file</Btn>
            <Select value={branch} onChange={setBranch} placeholder="Branch (optional)" options={branches} className="w-48" />
          </div>
          {rows.length > 0 && (
            <>
              <p className="text-xs font-bold">{rows.length} punches ready · first: {rows[0].deviceUserId} @ {rows[0].time}</p>
              <Btn
                loading={busy}
                disabled={!canAdd}
                onClick={async () => {
                  const res = await run("post", "/attendance/punches/import", { punches: rows, branch });
                  if (res) {
                    toast.info(`${res.data.unmatched} unmatched · ${res.data.processedDays} employee-days recalculated`);
                    setRows([]);
                  }
                }}
              >
                Import {rows.length} punches
              </Btn>
            </>
          )}
        </div>
      </Card>
    </div>
  );
}
