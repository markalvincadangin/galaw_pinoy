'use client';

import { motion } from 'framer-motion';
import DebugToggle from '@/components/admin/DebugToggle';

interface Reflection {
  id: string;
  name: string;
  school: string;
  year: string;
  section: string;
  content: string;
  createdAt: string | null; // ISO string from server
}

interface AdminContentProps {
  reflectionsData: Reflection[];
}

export default function AdminContent({ reflectionsData }: AdminContentProps) {
  return (
    <main className="pt-16 min-h-screen bg-brand-dark text-white">
      <section className="py-16 px-6 md:px-8 max-w-7xl mx-auto">
        <div className="flex items-center justify-between mb-8">
          <motion.h1
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.6 }}
            className="text-3xl md:text-4xl font-display font-bold text-white drop-shadow-lg"
          >
            Submitted Reflections
          </motion.h1>
          <motion.div
            initial={{ opacity: 0, scale: 0.8 }}
            animate={{ opacity: 1, scale: 1 }}
            transition={{ duration: 0.6, delay: 0.2 }}
          >
            <DebugToggle />
          </motion.div>
        </div>

        {reflectionsData.length === 0 ? (
          <motion.div
            initial={{ opacity: 0, y: 30 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.6 }}
            className="glass-modern rounded-3xl p-8 md:p-12 cultural-texture text-center"
          >
            <p className="text-lg md:text-xl text-white/95 font-body drop-shadow-md">
              No reflections submitted yet.
            </p>
          </motion.div>
        ) : (
          <motion.div
            initial={{ opacity: 0, y: 30 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.6 }}
            className="glass-modern rounded-3xl overflow-hidden cultural-texture shadow-xl"
          >
            <div className="overflow-x-auto">
              <table className="w-full border-collapse">
                <thead className="bg-white/5 border-b border-white/10">
                  <tr>
                    <th className="px-6 py-4 text-left text-sm font-semibold text-white font-display">
                      Timestamp
                    </th>
                    <th className="px-6 py-4 text-left text-sm font-semibold text-white font-display">
                      Name
                    </th>
                    <th className="px-6 py-4 text-left text-sm font-semibold text-white font-display">
                      School
                    </th>
                    <th className="px-6 py-4 text-left text-sm font-semibold text-white font-display">
                      Year
                    </th>
                    <th className="px-6 py-4 text-left text-sm font-semibold text-white font-display">
                      Section
                    </th>
                    <th className="px-6 py-4 text-left text-sm font-semibold text-white font-display">
                      Content
                    </th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-white/10">
                  {reflectionsData.map((reflection) => (
                    <tr
                      key={reflection.id}
                      className="hover:bg-white/5 transition-colors"
                    >
                      <td className="px-6 py-4 text-sm text-white/80 whitespace-nowrap font-body">
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
                      <td className="px-6 py-4 text-sm text-white/95 font-body">
                        {reflection.name}
                      </td>
                      <td className="px-6 py-4 text-sm text-white/95 font-body">
                        {reflection.school}
                      </td>
                      <td className="px-6 py-4 text-sm text-white/95 font-body">
                        {reflection.year}
                      </td>
                      <td className="px-6 py-4 text-sm text-white/95 font-body">
                        {reflection.section}
                      </td>
                      <td className="px-6 py-4 text-sm text-white/95 font-body">
                        {reflection.content}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </motion.div>
        )}
      </section>
    </main>
  );
}
