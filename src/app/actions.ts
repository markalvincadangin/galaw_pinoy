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
    // Extract content from form data
    const content = formData.get('content')?.toString().trim();

    // Validate content
    if (!content || content === '') {
      return {
        success: false,
        message: 'Please write a reflection.',
      };
    }

    // Insert into database using Drizzle
    await db.insert(reflections).values({
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

