'use server';

import { db } from '@/db';
import { reflections } from '@/db/schema';
import { revalidatePath } from 'next/cache';

export interface ActionResult {
  success: boolean;
  message: string;
}

/**
 * Server Action to submit a reflection
 * Replaces the old Firebase submission logic from js/submitProof.js
 */
export async function submitReflection(formData: FormData): Promise<ActionResult> {
  try {
    // Extract and normalize inputs from form data
    const name = formData.get('name')?.toString().trim() || '';
    const school = formData.get('school')?.toString().trim() || '';
    const year = formData.get('year')?.toString().trim() || '';
    const course = formData.get('section')?.toString().trim() || '';
    const content = formData.get('content')?.toString().trim() || '';

    // Basic server-side validation
    if (!name) {
      return { success: false, message: 'Please provide your name.' };
    }
    if (!school) {
      return { success: false, message: 'Please provide your school.' };
    }
    if (!year) {
      return { success: false, message: 'Please provide your year.' };
    }
    if (!course) {
      return { success: false, message: 'Please provide your section.' };
    }
    if (!content) {
      return { success: false, message: 'Please write a reflection.' };
    }

    // Enforce reasonable max lengths to avoid oversized inserts
    const MAX_NAME = 100;
    const MAX_SCHOOL = 150;
    const MAX_YEAR = 50;
    const MAX_COURSE = 100;
    const MAX_CONTENT = 5000;

    if (name.length > MAX_NAME) {
      return { success: false, message: `Name must be ${MAX_NAME} characters or fewer.` };
    }
    if (school.length > MAX_SCHOOL) {
      return { success: false, message: `School must be ${MAX_SCHOOL} characters or fewer.` };
    }
    if (year.length > MAX_YEAR) {
      return { success: false, message: `Year must be ${MAX_YEAR} characters or fewer.` };
    }
    if (course.length > MAX_COURSE) {
      return { success: false, message: `Course must be ${MAX_COURSE} characters or fewer.` };
    }
    if (content.length > MAX_CONTENT) {
      return { success: false, message: `Reflection is too long.` };
    }

    // Insert into database using Drizzle
    await db.insert(reflections).values({
      name,
      school,
      year,
      course,
      content,
    });

    // Revalidate the admin page so new entries show up immediately
    revalidatePath('/admin');

    return {
      success: true,
      message: 'Reflection submitted successfully!',
    };
  } catch (error) {
    console.error('Error submitting reflection:', error);
    return {
      success: false,
      message: 'Failed to submit. Please try again.',
    };
  }
}
