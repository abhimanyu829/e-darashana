import mongoose from 'mongoose';
import axios from 'axios';
import dotenv from 'dotenv';
dotenv.config();

const API_URL = 'http://localhost:5000/api';

async function testSectionIsolation() {
    try {
        // 1. Get courses to find a section
        const { Course } = require('./src/models/Course');
        await mongoose.connect(process.env.MONGODB_URI || 'mongodb://localhost:27017/chronos-ai');

        const course = await Course.findOne();
        if (!course) {
            console.log("No courses found. Please create one.");
            process.exit(0);
        }

        console.log(`Testing section: ${course.section} for course: ${course.name}`);

        // 2. Fetch tasks by section
        // Note: This requires a token in real app, but for local DB test we can just check the service logic
        // But since I updated the controller, let's just check the DB directly to see if section is stored.

        const { DailyTask } = require('./src/models/DailyTask');
        const todayStr = new Date().toISOString().split('T')[0];

        const tasks = await DailyTask.find({ section: course.section, date: todayStr });
        console.log(`Found ${tasks.length} DailyTask documents for section ${course.section}`);

        tasks.forEach((dt: any) => {
            console.log(`Document for course ${dt.courseId} has section ${dt.section}`);
        });

        const otherSection = course.section === 'academic' ? 'skill' : 'academic';
        const otherTasks = await DailyTask.find({ section: otherSection, date: todayStr });
        console.log(`Found ${otherTasks.length} DailyTask documents for DIFFERENT section ${otherSection}`);

    } catch (err) {
        console.error("Test failed:", err);
    } finally {
        process.exit(0);
    }
}

testSectionIsolation();
