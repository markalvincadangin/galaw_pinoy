'use server';

import { db } from '@/db';
import { scores, users } from '@/db/schema';
import { createClient } from '@/lib/supabase/server';
import { eq } from 'drizzle-orm';
import { revalidatePath } from 'next/cache';

export interface GameResultAction {
  success: boolean;
  message: string;
  gamesPlayed?: number;
  badgeUnlocked?: string;
}

/**
 * Server Action to save game results
 * Saves score, updates user stats, and checks for badge unlocks
 */
export async function saveGameResult(
  gameType: string,
  score: number,
  calories: number
): Promise<GameResultAction> {
  try {
    // Get current authenticated user (more secure than getSession)
    const supabase = await createClient();
    const {
      data: { user },
      error: userError,
    } = await supabase.auth.getUser();

    if (userError || !user) {
      return {
        success: false,
        message: 'You must be logged in to save game results.',
      };
    }

    const userId = user.id;

    // Check if user exists in users table, create if not
    let [currentUser] = await db
      .select()
      .from(users)
      .where(eq(users.id, userId))
      .limit(1);

    if (!currentUser) {
      // User doesn't exist in users table, create entry
      // Note: This assumes username comes from auth metadata or email
      const username = user.email?.split('@')[0] || `user_${userId.slice(0, 8)}`;
      
      await db.insert(users).values({
        id: userId,
        username,
        totalCalories: 0,
        gamesPlayed: 0,
      });

      // Fetch the newly created user
      [currentUser] = await db
        .select()
        .from(users)
        .where(eq(users.id, userId))
        .limit(1);

      if (!currentUser) {
        return {
          success: false,
          message: 'Failed to create user entry.',
        };
      }
    }

    const currentGamesPlayed = currentUser.gamesPlayed || 0;
    const newGamesPlayed = currentGamesPlayed + 1;

    // Insert score into scores table
    await db.insert(scores).values({
      userId,
      gameType,
      score,
      playedAt: new Date(),
    });

    // Update users table: increment gamesPlayed and add calories
    const newTotalCalories = (currentUser.totalCalories || 0) + calories;
    await db
      .update(users)
      .set({
        gamesPlayed: newGamesPlayed,
        totalCalories: newTotalCalories,
      })
      .where(eq(users.id, userId));

    // Badge Logic: Check if gamesPlayed reaches 10
    let badgeUnlocked: string | undefined;
    if (newGamesPlayed === 10) {
      badgeUnlocked = 'Moving Master';
      // Log badge unlock (for now, as requested)
      console.log(`🎉 Badge Unlocked: ${badgeUnlocked} for user ${userId}`);
    }

    // Revalidate relevant paths
    revalidatePath('/profile');
    revalidatePath('/play');

    return {
      success: true,
      message: 'Game result saved successfully!',
      gamesPlayed: newGamesPlayed,
      badgeUnlocked,
    };
  } catch (error) {
    console.error('Error saving game result:', error);
    return {
      success: false,
      message: 'Failed to save game result. Please try again.',
    };
  }
}

