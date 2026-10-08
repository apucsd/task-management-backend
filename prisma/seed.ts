import 'dotenv/config';
import { PrismaClient } from '../generated/prisma/client';
import { PrismaPg } from '@prisma/adapter-pg';
import { TaskPriority, TaskStatus, UserStatus } from '../generated/prisma/enums';
import * as bcrypt from 'bcrypt';

const adapter = new PrismaPg({
    connectionString: process.env.DATABASE_URL,
});

const prisma = new PrismaClient({ adapter });

async function main() {
    // HASH DEFAULT PASSWORD FOR SEED USERS
    const passwordHash = await bcrypt.hash('Password123!', 10);

    // SEED USERS
    const user1 = await prisma.user.upsert({
        where: { email: 'john@example.com' },
        update: {},
        create: {
            name: 'John Doe',
            email: 'john@example.com',
            password: passwordHash,
            status: UserStatus.ACTIVE,
            isVerified: true,
        },
    });

    const user2 = await prisma.user.upsert({
        where: { email: 'jane@example.com' },
        update: {},
        create: {
            name: 'Jane Smith',
            email: 'jane@example.com',
            password: passwordHash,
            status: UserStatus.ACTIVE,
            isVerified: true,
        },
    });

    const user3 = await prisma.user.upsert({
        where: { email: 'bob@example.com' },
        update: {},
        create: {
            name: 'Bob Johnson',
            email: 'bob@example.com',
            password: passwordHash,
            status: UserStatus.ACTIVE,
            isVerified: true,
        },
    });

    // SEED PROJECT 1
    let project1 = await prisma.project.findFirst({
        where: { name: 'Website Redesign', ownerId: user1.id },
    });

    if (!project1) {
        project1 = await prisma.project.create({
            data: {
                name: 'Website Redesign',
                description: 'Full redesign of the client-facing marketing website and portal.',
                ownerId: user1.id,
                members: {
                    create: [
                        { userId: user1.id },
                        { userId: user2.id },
                        { userId: user3.id },
                    ],
                },
            },
        });

        // SEED TASKS FOR PROJECT 1
        const now = new Date();
        const twoDaysAgo = new Date(now.getTime() - 2 * 24 * 60 * 60 * 1000);
        const inThreeDays = new Date(now.getTime() + 3 * 24 * 60 * 60 * 1000);
        const inFiveDays = new Date(now.getTime() + 5 * 24 * 60 * 60 * 1000);
        const inSevenDays = new Date(now.getTime() + 7 * 24 * 60 * 60 * 1000);

        await prisma.task.createMany({
            data: [
                {
                    title: 'Design Landing Page Mockup',
                    description: 'Finalize Figma design tokens, layouts, and typography.',
                    status: TaskStatus.DONE,
                    priority: TaskPriority.HIGH,
                    projectId: project1.id,
                    assigneeId: user2.id,
                    dueDate: twoDaysAgo,
                },
                {
                    title: 'Implement Authentication Flow',
                    description: 'Build JWT and OTP login UI and hook up with NestJS backend.',
                    status: TaskStatus.IN_PROGRESS,
                    priority: TaskPriority.HIGH,
                    projectId: project1.id,
                    assigneeId: user3.id,
                    dueDate: inThreeDays,
                },
                {
                    title: 'Set up CI/CD Pipeline',
                    description: 'Configure GitHub Actions for automated lint, build, and test steps.',
                    status: TaskStatus.TODO,
                    priority: TaskPriority.MEDIUM,
                    projectId: project1.id,
                    assigneeId: user1.id,
                    dueDate: inFiveDays,
                },
                {
                    title: 'Write User Documentation',
                    description: 'Create user guides and onboarding documentation.',
                    status: TaskStatus.TODO,
                    priority: TaskPriority.LOW,
                    projectId: project1.id,
                    assigneeId: user2.id,
                    dueDate: inSevenDays,
                },
            ],
        });
    }

    // SEED PROJECT 2
    let project2 = await prisma.project.findFirst({
        where: { name: 'Mobile App API Integration', ownerId: user2.id },
    });

    if (!project2) {
        project2 = await prisma.project.create({
            data: {
                name: 'Mobile App API Integration',
                description: 'REST API endpoints and webhook integration for mobile applications.',
                ownerId: user2.id,
                members: {
                    create: [
                        { userId: user2.id },
                        { userId: user1.id },
                    ],
                },
            },
        });

        const inFourDays = new Date(Date.now() + 4 * 24 * 60 * 60 * 1000);
        const inTenDays = new Date(Date.now() + 10 * 24 * 60 * 60 * 1000);

        await prisma.task.createMany({
            data: [
                {
                    title: 'Database Schema Architecture',
                    description: 'Design PostgreSQL schema for mobile synchronization.',
                    status: TaskStatus.DONE,
                    priority: TaskPriority.HIGH,
                    projectId: project2.id,
                    assigneeId: user2.id,
                },
                {
                    title: 'Push Notification Service',
                    description: 'Integrate FCM and APNs for real-time mobile push notifications.',
                    status: TaskStatus.IN_PROGRESS,
                    priority: TaskPriority.MEDIUM,
                    projectId: project2.id,
                    assigneeId: user1.id,
                    dueDate: inFourDays,
                },
                {
                    title: 'App Store Submission Checklist',
                    description: 'Prepare privacy policy, assets, and metadata for store review.',
                    status: TaskStatus.TODO,
                    priority: TaskPriority.LOW,
                    projectId: project2.id,
                    assigneeId: null,
                    dueDate: inTenDays,
                },
            ],
        });
    }

    // SEED PROJECT 3
    let project3 = await prisma.project.findFirst({
        where: { name: 'Internal Analytics Dashboard', ownerId: user3.id },
    });

    if (!project3) {
        project3 = await prisma.project.create({
            data: {
                name: 'Internal Analytics Dashboard',
                description: 'Real-time metrics dashboard for internal operations.',
                ownerId: user3.id,
                members: {
                    create: [{ userId: user3.id }],
                },
            },
        });

        await prisma.task.create({
            data: {
                title: 'Integrate Event Tracking',
                description: 'Track customer funnel drop-offs and system telemetry.',
                status: TaskStatus.DONE,
                priority: TaskPriority.MEDIUM,
                projectId: project3.id,
                assigneeId: user3.id,
            },
        });
    }

    // LOG SUCCESS SUMMARY
    console.log('Seeding completed successfully!');
    console.log('Test Accounts (Password: Password123!):');
    console.log('  - john@example.com (Owner of Project 1, Member of Project 2)');
    console.log('  - jane@example.com (Owner of Project 2, Member of Project 1)');
    console.log('  - bob@example.com  (Owner of Project 3, Member of Project 1)');
}

main()
    .catch((e) => {
        console.error('Seeding failed:', e);
        process.exit(1);
    })
    .finally(async () => {
        await prisma.$disconnect();
    });
