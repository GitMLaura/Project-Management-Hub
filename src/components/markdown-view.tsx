import ReactMarkdown from "react-markdown";

// Same Markdown the .md download and the PDF use: one source, three views.
export function MarkdownView({ source }: { source: string }) {
  return (
    <div className="flex flex-col gap-2 text-sm leading-relaxed [&_code]:rounded [&_code]:bg-muted [&_code]:px-1 [&_h1]:text-lg [&_h1]:font-semibold [&_h2]:text-base [&_h2]:font-semibold [&_h3]:font-semibold [&_ol]:list-decimal [&_ol]:pl-5 [&_pre]:overflow-x-auto [&_pre]:rounded [&_pre]:bg-muted [&_pre]:p-2 [&_table]:border [&_td]:border [&_td]:px-2 [&_th]:border [&_th]:px-2 [&_ul]:list-disc [&_ul]:pl-5">
      <ReactMarkdown>{source}</ReactMarkdown>
    </div>
  );
}
