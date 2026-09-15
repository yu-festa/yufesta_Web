import AppLayout from '../layout/AppLayout'

export default function Main() {
  return (
    <AppLayout header={<div className="flex h-16 items-center text-lg font-bold">YU FESTA</div>}>
      <section className="py-8">
        <h1 className="text-2xl font-bold text-slate-900">메인</h1>
        <p className="mt-3 text-sm leading-6 text-slate-500">YU FESTA에 오신 것을 환영해요.</p>
      </section>
    </AppLayout>
  )
}
