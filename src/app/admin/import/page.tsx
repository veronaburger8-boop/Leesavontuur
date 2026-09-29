import { ImportForm } from "./import-form";

export const metadata = { title: "Import" };

export default function ImportPage() {
  return (
    <section className="panel">
      <h1>Import</h1>
      <p>
        Upload a file in the content format (section 9 of the brief), for example <code>content/lessons.json</code>. Every item is checked before
        anything is saved.
      </p>
      <ul>
        <li>Items that already exist in the library are skipped, unless you tick &quot;Replace&quot;.</li>
        <li>Items with problems (for example 4 questions instead of 5) are saved as &quot;In review&quot;, never as &quot;Published&quot;.</li>
      </ul>
      <ImportForm />
    </section>
  );
}
