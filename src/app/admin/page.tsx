import { db } from '@/db';
import { reflections } from '@/db/schema';
import { desc } from 'drizzle-orm';
import Navigation from '@/components/Navigation';
import AdminContent from '@/components/admin/AdminContent';

export default async function AdminDashboard() {
  // Fetch reflections from database, ordered by creation date (newest first)
  const reflectionsData = await db
    .select()
    .from(reflections)
    .orderBy(desc(reflections.createdAt));

  // Serialize dates to strings for client component
  const serializedData = reflectionsData.map((reflection) => ({
    id: reflection.id,
    name: reflection.name,
    school: reflection.school,
    year: reflection.year,
    course: reflection.course,
    content: reflection.content,
    createdAt: reflection.createdAt 
      ? (reflection.createdAt instanceof Date 
          ? reflection.createdAt.toISOString() 
          : new Date(reflection.createdAt).toISOString())
      : null,
  }));

  return (
    <>
      <Navigation />
      <AdminContent reflectionsData={serializedData} />
    </>
  );
}
