import mongoose from 'mongoose';
import { Course } from '../models/Course';
import { DailyTask } from '../models/DailyTask';
import { SyllabusRaw } from '../models/SyllabusRaw';
import { TopicsMaster } from '../models/TopicsMaster';
import { updateActivityScore } from '../services/ActivityTrackerService';
import { acquireLock, releaseLock } from '../config/redis';
import logger from '../config/logger';

/**
 * Core Logic Engine for Task Generation
 * Implements Step 6, 7, 8, 11, 12 of the requirements.
 */
export const generateDailyTasks = async (userId: string, courseId: string) => {
  const lockKey = `lock:task-gen:${userId}:${courseId}`;
  const isLocked = await acquireLock(lockKey, 30000); // 30s lock

  if (!isLocked) {
    logger.warn(`Task generation already in progress for user ${userId}, course ${courseId}`);
    return;
  }

  const session = await mongoose.startSession();
  session.startTransaction();

  try {
    logger.info(`Starting task generation for user ${userId}, course ${courseId}`);

    const course = await Course.findById(courseId).session(session).lean();
    if (!course) throw new Error('Course not found');

    const topicsMaster = await TopicsMaster.findOne({ courseId, userId }).session(session).lean();
    if (!topicsMaster) throw new Error('Topics not found');

    const todayStr = new Date().toISOString().split('T')[0];

    // 1. Fetch delayed topics from DB3 (DailyTasks)
    const delayedTasks = await DailyTask.aggregate([
      { $match: { userId, courseId, 'tasks.status': 'delayed' } },
      { $unwind: '$tasks' },
      { $match: { 'tasks.status': 'delayed' } },
      { $replaceRoot: { newRoot: '$tasks' } }
    ]).session(session);

    // 2. Dynamic Recalculation (Phase 3 & 7)
    const allTopics = topicsMaster.units.flatMap((u: any) => u.topics.map((t: any) => ({
      ...t,
      unitName: u.unitName
    })));

    const totalTopicsCount = allTopics.length;
    const D = course.durationDays || 30;
    const topicsPerDay = Math.ceil(totalTopicsCount / D) || 1;

    // Determine current logical day number
    const startDate = new Date(course.createdAt);
    const todayNow = new Date();
    const daysPassed = Math.floor((todayNow.getTime() - startDate.getTime()) / (1000 * 60 * 60 * 24));
    const dayNumber = Math.max(1, daysPassed + 1);

    // --- PHASE 1 & 2 MIGRATION for legacy courses ---
    if (!topicsMaster.preSchedule || topicsMaster.preSchedule.length === 0) {
      logger.info(`Running legacy preSchedule migration for user ${userId} and course ${courseId}`);
      const T_total = allTopics.length;
      const D_mig = course.durationDays || 30;
      const tpd_mig = Math.ceil(T_total / D_mig) || 1;

      // Patch missing globalOrderIndex for ancient courses
      let gIdx = 0;
      const orderedT = [...allTopics].map((t: any) => {
        if (t.globalOrderIndex === undefined || t.globalOrderIndex === null) {
          t.globalOrderIndex = gIdx++;
        }
        return t;
      }).sort((a: any, b: any) => a.globalOrderIndex - b.globalOrderIndex);

      const preSchedItems = [];
      let cDay = 1;
      let cDayTopics: number[] = [];

      for (const topic of orderedT) {
        if (cDayTopics.length >= tpd_mig) {
          preSchedItems.push({ dayNumber: cDay, topics: cDayTopics });
          cDay++;
          cDayTopics = [];
        }
        cDayTopics.push(topic.globalOrderIndex);
      }
      if (cDayTopics.length > 0) {
        preSchedItems.push({ dayNumber: cDay, topics: cDayTopics });
      }

      // Update DB2 units if we patched the indexes
      const patchedUnits = topicsMaster.units.map(u => ({
        ...u,
        topics: u.topics.map((t: any) => {
          const matched = orderedT.find(ot => ot.topicTitle === t.topicTitle);
          return { ...t, globalOrderIndex: matched?.globalOrderIndex ?? 0 };
        })
      }));

      await TopicsMaster.updateOne(
        { _id: topicsMaster._id },
        { $set: { preSchedule: preSchedItems, units: patchedUnits } },
        { session }
      );
      (topicsMaster as any).preSchedule = preSchedItems;
    }

    // Fetch pre-scheduled topics for today
    const preScheduledDay = topicsMaster.preSchedule?.find((p: any) => p.dayNumber === dayNumber);
    const scheduledTopicIndexes = preScheduledDay ? preScheduledDay.topics : [];

    // Filter all topics to just today's scheduled mapped ones
    const newTopicsFull = allTopics
      .filter((t: any) => scheduledTopicIndexes.includes(t.globalOrderIndex))
      .sort((a, b) => a.globalOrderIndex - b.globalOrderIndex);

    logger.info(`Calculated strict workload W=${topicsPerDay} for user ${userId} on Day ${dayNumber}`);

    let todayTasks: any[] = [];

    // STRICT MERGE LOGIC
    if (delayedTasks.length > 0) {
      const totalDelayed = delayedTasks.length;
      if (totalDelayed >= topicsPerDay) {
        todayTasks = delayedTasks.slice(0, topicsPerDay);
      } else {
        const neededFromNew = topicsPerDay - totalDelayed;
        todayTasks = [
          ...delayedTasks,
          ...newTopicsFull.slice(0, neededFromNew).map((t: any) => ({
            topicId: t.globalOrderIndex,
            topicTitle: t.topicTitle,
            globalOrderIndex: t.globalOrderIndex,
            assignedAt: new Date(),
            deadline: new Date(Date.now() + 24 * 60 * 60 * 1000),
            status: 'active',
            checkbox: false
          }))
        ];
      }
    } else {
      todayTasks = newTopicsFull.map((t: any) => ({
        topicId: t.globalOrderIndex,
        topicTitle: t.topicTitle,
        globalOrderIndex: t.globalOrderIndex,
        assignedAt: new Date(),
        deadline: new Date(Date.now() + 24 * 60 * 60 * 1000),
        status: 'active',
        checkbox: false
      }));
    }

    // Phase 8 Check: Upsert regardless to prevent infinite generator loops
    await DailyTask.findOneAndUpdate(
      { userId, courseId, date: todayStr },
      { $set: { tasks: todayTasks, section: course.section } },
      { upsert: true, session }
    );

    await updateActivityScore(userId, todayStr, course.section, session);

    await session.commitTransaction();
    logger.info(`Successfully generated ${todayTasks.length} tasks for user ${userId}`);
  } catch (error) {
    await session.abortTransaction();
    logger.error(`Error generating tasks for user ${userId}:`, error);
    throw error;
  } finally {
    session.endSession();
    await releaseLock(lockKey);
  }
};
