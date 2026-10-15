"use client";

import { useState } from "react";
import { FiCheckCircle, FiPlus, FiTrash2, FiWifi, FiWifiOff } from "react-icons/fi";
import { MdDevices } from "react-icons/md";
import usePagePermission from "@/hooks/usePagePermission";
import { useHrConfig, useHrLookups, useHrMutation, useHrQuery, fmtDateTime } from "@/hooks/useHr";
import { Badge, Btn, Card, EmptyState, Loading, PageHeader, Table, Td, Tabs } from "@/components/hr/HrUi";
import DeviceFormModal from "@/components/hr/modals/DeviceFormModal";
import { ImportTab, PunchesTab } from "@/components/hr/tabs/AttendanceDeviceTabs";

export default function AttendanceDevicesPage() {
  const permissions = usePagePermission();
  const { canAdd, canEdit, canDelete } = permissions;
  const { config, me } = useHrConfig();
  const { branches } = useHrLookups({ employees: false });
  const [tab, setTab] = useState("devices");
  const devices = useHrQuery("/attendance/devices");
  const { run } = useHrMutation();
  const [editing, setEditing] = useState(null);


  const [now] = useState(() => Date.now());
  const online = (d) => d.lastSeenAt && now - new Date(d.lastSeenAt).getTime() < 10 * 60 * 1000;

  return (
    <div className="space-y-5 max-w-[1500px] mx-auto pb-10">
      <PageHeader
        icon={<MdDevices />}
        title="Biometric Devices & Punches"
        subtitle="ZKTeco devices push attendance in real time (ADMS / Cloud Server). New devices appear here as Pending until you assign a branch and activate them."
        actions={canAdd && <Btn variant="gold" size="sm" onClick={() => setEditing({ serialNumber: "", name: "", branch: "", model: "ZKTeco", status: "active" })}><FiPlus /> Add device</Btn>}
      />
      <Tabs value={tab} onChange={setTab} tabs={[{ value: "devices", label: "Devices" }, { value: "punches", label: "Raw punches" }, { value: "import", label: "Import / Setup" }]} />

      {tab === "devices" && (
        <Card bodyClassName="p-0">
          {devices.loading ? (
            <Loading />
          ) : !devices.data?.data?.length ? (
            <EmptyState icon={<MdDevices />} title="No devices yet" text="Point a ZKTeco device at this server (see Import / Setup) and it will register itself here." />
          ) : (
            <Table head={["Device", "Serial", "Branch", "Status", "Connection", "Last punch", "Punches", ""]}>
              {devices.data.data.map((d) => (
                <tr key={d._id}>
                  <Td className="font-black">{d.name}<div className="text-[10px] text-brand-dark-grey">{d.model} {d.ipAddress && `· ${d.ipAddress}`}</div></Td>
                  <Td className="font-mono text-[11px]">{d.serialNumber}</Td>
                  <Td>{d.branch || <span className="text-amber-500">Not assigned</span>}</Td>
                  <Td><Badge status={d.status} /></Td>
                  <Td>
                    {online(d) ? <span className="inline-flex items-center gap-1 text-emerald-500"><FiWifi /> Online</span> : <span className="inline-flex items-center gap-1 text-brand-dark-grey"><FiWifiOff /> {d.lastSeenAt ? fmtDateTime(d.lastSeenAt) : "Never"}</span>}
                  </Td>
                  <Td className="whitespace-nowrap">{fmtDateTime(d.lastPunchAt)}</Td>
                  <Td>{d.totalPunches}</Td>
                  <Td className="text-right whitespace-nowrap space-x-1">
                    {canEdit && d.status === "pending" && (
                      <Btn size="sm" variant="success" onClick={() => setEditing({ ...d, status: "active" })}><FiCheckCircle /> Approve</Btn>
                    )}
                    {canEdit && <Btn size="sm" variant="ghost" onClick={() => setEditing(d)}>Edit</Btn>}
                    {canDelete && (
                      <Btn size="sm" variant="ghost" onClick={async () => { if (confirm(`Remove ${d.name}?`) && (await run("delete", `/attendance/devices/${d._id}`))) devices.refetch(); }}>
                        <FiTrash2 />
                      </Btn>
                    )}
                  </Td>
                </tr>
              ))}
            </Table>
          )}
        </Card>
      )}

      {tab === "punches" && <PunchesTab branches={branches} me={me} />}

      {tab === "import" && <ImportTab config={config} me={me} branches={branches} canAdd={canAdd} />}

      <DeviceFormModal device={editing} branches={branches} permissions={permissions} onClose={() => setEditing(null)} onSaved={() => { setEditing(null); devices.refetch(); }} />
    </div>
  );
}
