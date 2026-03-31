import mongoose from 'mongoose';
import { generateDailyTasks } from './src/services/taskService';
import { Course } from './src/models/Course';
import dotenv from 'dotenv';
dotenv.config();

async function test() {
    await mongoose.connect(process.env.MONGODB_URI || 'mongodb://localhost:27017/chronos-ai');
    const course = await Course.findOne();
    if (!course) {
        console.log("No courses found!");
        process.exit(0);
    }
    console.log("Found course:", course.name, course._id);

    try {
        await generateDailyTasks(course.userId, course._id.toString());
        console.log("Successfully generated tasks!");
        const { DailyTask } = require('./src/models/DailyTask');
        const todayStr = new Date().toISOString().split('T')[0];
        const daily = await DailyTask.findOne({ courseId: course._id.toString(), date: todayStr });
        console.log("Tasks for today:", daily?.tasks?.length || 0);
        const { TopicsMaster } = require('./src/models/TopicsMaster');
        const tm = await TopicsMaster.findOne({ courseId: course._id.toString() });
        console.log("PreSchedule Days:", tm?.preSchedule?.length || 0);
    } catch (err: any) {
        console.error("FAILED to generate tasks:");
        console.error(err);
    }
    process.exit(0);
}
test();
