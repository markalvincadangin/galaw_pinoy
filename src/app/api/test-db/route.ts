import { db } from '@/db';
import { users, reflections } from '@/db/schema';
import { eq } from 'drizzle-orm';
import { NextResponse } from 'next/server';

export async function GET() {
  const startTime = Date.now();
  
  try {
    // Test 1: Select users (read operation)
    const selectStartTime = Date.now();
    const userResult = await db.select().from(users).limit(1);
    const selectLatency = Date.now() - selectStartTime;

    // Test 2: Insert a dummy reflection (write operation)
    const insertStartTime = Date.now();
    const insertResult = await db
      .insert(reflections)
      .values({ content: `Test reflection - ${new Date().toISOString()}` })
      .returning();
    const insertLatency = Date.now() - insertStartTime;

    // Clean up: Delete the test reflection
    if (insertResult && insertResult[0]?.id) {
      await db.delete(reflections).where(eq(reflections.id, insertResult[0].id));
    }

    const totalLatency = Date.now() - startTime;

    return NextResponse.json(
      {
        status: 'healthy',
        message: 'Database connection successful! All operations completed.',
        db_latency: `${totalLatency}ms`,
        operations: {
          select_users: {
            latency: `${selectLatency}ms`,
            success: true,
            records_found: userResult.length,
          },
          insert_reflection: {
            latency: `${insertLatency}ms`,
            success: true,
            test_record_id: insertResult[0]?.id,
            cleaned_up: true,
          },
        },
        timestamp: new Date().toISOString(),
      },
      { status: 200 }
    );
  } catch (error) {
    const totalLatency = Date.now() - startTime;
    
    return NextResponse.json(
      {
        status: 'error',
        message: 'Database connection failed. Please check your DATABASE_URL in .env.local',
        db_latency: `${totalLatency}ms`,
        error: error instanceof Error ? error.message : 'Unknown error',
        error_type: error instanceof Error ? error.constructor.name : 'Unknown',
        timestamp: new Date().toISOString(),
      },
      { status: 500 }
    );
  }
}

