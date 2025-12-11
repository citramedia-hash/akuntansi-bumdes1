import { useState } from "react";
import BalanceSheet from "../../components/reports/BalanceSheet";

export default function NeracaPage() {
  const [startDate, setStartDate] = useState("2025-11-01");
  const [endDate, setEndDate] = useState("2025-11-29");

  return (
    <div className="p-6">
      <h1 className="text-xl font-bold mb-4">Laporan Neraca</h1>

      <div className="mb-4 flex gap-4">
        <input
          type="date"
          value={startDate}
          onChange={e => setStartDate(e.target.value)}
          className="border p-2"
        />
        <input
          type="date"
          value={endDate}
          onChange={e => setEndDate(e.target.value)}
          className="border p-2"
        />
      </div>

      <BalanceSheet
        startDate={startDate}
        endDate={endDate}
        level={4} // tampilkan level 1-4
      />
    </div>
  );
}
