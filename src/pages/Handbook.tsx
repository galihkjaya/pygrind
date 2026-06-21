import { Link, useParams } from 'react-router-dom'
import { ArrowLeft, ArrowRight } from 'lucide-react'
import { HandbookViewer } from '../components/HandbookViewer'

const modules = import.meta.glob('../../handbook/*.html')
const allFiles = Object.keys(modules).map((path) => path.split('/').pop() || '')

const PREFIXES = [
  { prefix: 'python-', title: 'Python' },
  { prefix: 'sql-', title: 'SQL' },
  { prefix: 'fastapi-', title: 'FastAPI' },
  { prefix: 'docker-', title: 'Docker' },
  { prefix: 'git-', title: 'Git' },
  { prefix: 'bash-', title: 'Bash' },
]

export function Handbook() {
  const { slug } = useParams()

  if (slug) {
    return (
      <div className="flex h-auto min-h-0 w-full flex-col lg:h-[calc(100vh-57px)] lg:flex-row border-t border-ink-light/20">
        <div className="flex w-full flex-col lg:w-1/3 border-r border-ink-light/20 p-8 overflow-y-auto">
          <Link
            className="inline-flex items-center gap-2 font-mono-dm text-xs uppercase tracking-widest text-ink-light transition-colors hover:text-ink mb-8"
            to="/handbook"
          >
            <ArrowLeft className="h-4 w-4" />
            Back to Index
          </Link>
          <h1 className="font-playfair text-3xl font-bold mb-2">Reference</h1>
          <p className="font-mono-dm text-sm text-ink-light mb-8">{slug}</p>
          <p className="font-sans text-sm leading-relaxed text-ink/80">
            This handbook page contains concepts and examples to help you master the topic. Use the code snippets provided to practice in your editor.
          </p>
        </div>
        <div className="flex h-full w-full flex-col bg-ink lg:w-2/3 overflow-y-auto">
          <HandbookViewer slug={slug} />
        </div>
      </div>
    )
  }

  return (
    <section className="mx-auto w-full max-w-5xl py-12">
      <div className="mb-12 px-4 sm:px-6 lg:px-8">
        <h1 className="font-playfair text-4xl font-bold uppercase tracking-widest">
          Handbook Index
        </h1>
        <p className="mt-2 font-mono-dm text-sm text-ink-light">
          {allFiles.length} reference documents available.
        </p>
      </div>

      <div className="flex flex-col gap-12 px-4 sm:px-6 lg:px-8">
        {PREFIXES.map(({ prefix, title }) => {
          const files = allFiles.filter((f) => f.startsWith(prefix))
          if (files.length === 0) return null

          return (
            <div key={prefix} className="flex flex-col border-t border-ink-light/20 pt-8">
              <h2 className="mb-4 font-mono-dm text-xl uppercase tracking-widest text-ink-light">
                {title}
              </h2>
              <div className="flex flex-col border-t border-ink-light/20">
                {files.map((file, index) => (
                  <HandbookRow key={file} file={file} index={index + 1} />
                ))}
              </div>
            </div>
          )
        })}
      </div>
    </section>
  )
}

function HandbookRow({ file, index }: { file: string; index: number }) {
  const indexStr = index.toString().padStart(2, '0')
  const title = file.replace('.html', '').replace(/-/g, ' ')

  return (
    <Link
      to={`/handbook/${file}`}
      className="group relative z-10 flex w-full items-center justify-between border-b border-ink-light/20 px-2 py-6 text-left transition-colors duration-500 hover:text-paper sm:px-4"
    >
      <div className="absolute inset-0 z-[-1] origin-bottom scale-y-0 bg-ink transition-transform duration-500 ease-in-out-custom group-hover:scale-y-100" />
      
      <div className="flex flex-1 items-center gap-4 sm:gap-8">
        <span className="font-mono-dm text-base font-light text-ink-light transition-colors duration-500 group-hover:text-paper/50">
          {indexStr}
        </span>
        <h3 className="font-playfair text-xl font-bold capitalize sm:text-2xl">{title}</h3>
      </div>

      <div className="flex items-center gap-6 sm:gap-12">
        <ArrowRight className="h-5 w-5 transition-transform duration-500 group-hover:translate-x-2" />
      </div>
    </Link>
  )
}
