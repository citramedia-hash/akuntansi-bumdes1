import { useEffect, useState } from "react";
import { supabase } from "../../lib/supabaseClient";

interface NeracaRow {
  code: string;
  name: string;
  kategori: string;   // Aset, Kewajiban, Ekuitas
  level: number;
  saldo: number;
}

export default function BalanceSheet({ startDate, endDate, level = 4 }: {
  startDate: string;
  endDate: string;
  level?: number;
}) {

  const [rows, setRows] = useState<NeracaRow[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    loadNeraca();
  }, [startDate, endDate, level]);

  async function loadNeraca() {
    setLoading(true);

    const { data, error } = await supabase.rpc("get_neraca_level", {
      start_date: startDate,
      end_date: endDate,
      p_level: level,
    });

    if (error) {
      console.error("Error load neraca:", error);
      setRows([]);
    } else {
      setRows(data);
    }

    setLoading(false);
  }

  const format = (n: number) =>
    n.toLocaleString("id-ID", { style: "currency", currency: "IDR" });

  // Group data by kategori
  const aset = rows.filter(r => r.kategori === "Aset");
  const kewajiban = rows.filter(r => r.kategori === "Kewajiban");
  const ekuitas = rows.filter(r => r.kategori === "Ekuitas");

  const totalAset = aset.reduce((a, b) => a + b.saldo, 0);
  const totalKewajiban = kewajiban.reduce((a, b) => a + b.saldo, 0);
  const totalEkuitas = ekuitas.reduce((a, b) => a + b.saldo, 0);

  return (
    <div className="p-6 bg-white rounded-lg shadow-sm">
      <h1 className="text-center font-bold text-xl mb-3">Laporan Neraca</h1>
      <p className="text-center mb-6">
        Periode: {startDate} s/d {endDate}
      </p>

      {loading ? (
        <p>Loading...</p>
      ) : (
        <>
          {/* ================== ASET ================== */}
          <h2 className="font-bold text-lg mb-2">ASET</h2>

          {aset.map(row => (
            <div
              key={row.code}
              className="flex justify-between border-b py-1"
              style={{ paddingLeft: `${(row.level - 1) * 20}px` }}
            >
              <span>{row.name}</span>
              <span>{format(row.saldo)}</span>
            </div>
          ))}

          <div className="flex justify-between mt-1 font-bold border-t pt-2">
            <span>Total Aset</span>
            <span>{format(totalAset)}</span>
          </div>

          {/* ================== KEWAJIBAN ================== */}
          <h2 className="font-bold text-lg mt-8 mb-2">KEWAJIBAN</h2>

          {kewajiban.map(row => (
            <div
              key={row.code}
              className="flex justify-between border-b py-1"
              style={{ paddingLeft: `${(row.level - 1) * 20}px` }}
            >
              <span>{row.name}</span>
              <span>{format(row.saldo)}</span>
            </div>
          ))}

          <div className="flex justify-between mt-1 font-bold border-t pt-2">
            <span>Total Kewajiban</span>
            <span>{format(totalKewajiban)}</span>
          </div>

          {/* ================== MODAL ================== */}
          <h2 className="font-bold text-lg mt-8 mb-2">MODAL</h2>

          {ekuitas.map(row => (
            <div
              key={row.code}
              className="flex justify-between border-b py-1"
              style={{ paddingLeft: `${(row.level - 1) * 20}px` }}
            >
              <span>{row.name}</span>
              <span>{format(row.saldo)}</span>
            </div>
          ))}

          <div className="flex justify-between mt-1 font-bold border-t pt-2">
            <span>Total Modal</span>
            <span>{format(totalEkuitas)}</span>
          </div>

          {/* ================== TOTAL KEWAJIBAN & MODAL ================== */}
          <div className="flex justify-between mt-6 font-bold text-blue-600">
            <span>Total Kewajiban + Modal</span>
            <span>{format(totalKewajiban + totalEkuitas)}</span>
          </div>
        </>
      )}
    </div>
  );
}
