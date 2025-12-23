import { db } from '@/db';
import { reflections } from '@/db/schema';
import { desc } from 'drizzle-orm';
import Navigation from '@/components/Navigation';

export default async function AdminDashboard() {
  // Fetch reflections from database, ordered by creation date (newest first)
  const reflectionsData = await db
    .select()
    .from(reflections)
    .orderBy(desc(reflections.createdAt));

  return (
    <>
      <Navigation />
      <main className="pt-16 min-h-screen bg-neutral-50">
        <section className="py-16 px-8 max-w-7xl mx-auto">
          <h1 className="text-3xl md:text-4xl font-bold text-neutral-900 mb-8">
            Submitted Reflections
          </h1>

          {reflectionsData.length === 0 ? (
            <div className="bg-white border border-neutral-200 rounded-2xl p-8 text-center">
              <p className="text-lg text-neutral-600">No reflections submitted yet.</p>
            </div>
          ) : (
            <div className="bg-white border border-neutral-200 rounded-2xl overflow-hidden shadow-sm">
              <div className="overflow-x-auto">
                <table className="w-full border-collapse">
                  <thead className="bg-neutral-50 border-b border-neutral-200">
                    <tr>
                      <th className="px-6 py-4 text-left text-sm font-semibold text-neutral-900">
                        Timestamp
                      </th>
                      <th className="px-6 py-4 text-left text-sm font-semibold text-neutral-900">
                        Content
                      </th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-neutral-200">
                    {reflectionsData.map((reflection) => (
                      <tr
                        key={reflection.id}
                        className="hover:bg-neutral-50 transition-colors"
                      >
                        <td className="px-6 py-4 text-sm text-neutral-600 whitespace-nowrap">
                          {reflection.createdAt
                            ? new Date(reflection.createdAt).toLocaleString('en-US', {
                                year: 'numeric',
                                month: 'short',
                                day: 'numeric',
                                hour: '2-digit',
                                minute: '2-digit',
                              })
                            : 'N/A'}
                        </td>
                        <td className="px-6 py-4 text-sm text-neutral-900">
                          {reflection.content}
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </div>
          )}
        </section>
      </main>
    </>
  );
}

