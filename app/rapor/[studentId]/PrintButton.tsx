'use client'

export function PrintButton() {
  return (
    <button
      type="button"
      onClick={() => window.print()}
      className="rounded-btn bg-brand-blue px-5 py-3 text-base font-bold text-white"
    >
      🖨️ Cetak / Simpan PDF
    </button>
  )
}
