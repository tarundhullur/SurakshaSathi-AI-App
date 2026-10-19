export default function PageHeader({ eyebrow, title, description }) {
  return (
    <div className="mb-7">
      <p className="mb-2 text-xs font-bold uppercase tracking-[0.18em] text-teal-700">
        {eyebrow}
      </p>
      <h1 className="text-3xl font-bold tracking-tight text-slate-950 md:text-4xl">
        {title}
      </h1>
      <p className="mt-3 max-w-3xl text-base leading-7 text-slate-600">
        {description}
      </p>
    </div>
  )
}
