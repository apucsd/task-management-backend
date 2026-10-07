import { PrismaPg } from '@prisma/adapter-pg';
import { PrismaClient, UserStatus } from '../generated/prisma/client';
import * as bcrypt from 'bcrypt';
import 'dotenv/config';

const adapter = new PrismaPg({ connectionString: process.env.DATABASE_URL! });
const prisma = new PrismaClient({ adapter });

async function main() {
    const adminEmail = 'admin@gmail.com';

    const isExist = await prisma.user.findUnique({
        where: { email: adminEmail },
    });

    if (isExist) {
        console.log('Admin user already exists.');
        return;
    }

    const saltRounds = Number(process.env.BCRYPT_SALT_ROUNDS) || 10;
    const hashedPassword = await bcrypt.hash('123456', saltRounds);

    await prisma.user.create({
        data: {
            name: 'Demo Admin',
            email: adminEmail,
            password: hashedPassword,
            isVerified: true,
            status: UserStatus.ACTIVE,
        },
    });

    console.log('Admin user seeded successfully!');
}

main()
    .catch((e) => {
        console.error('Error during seeding:', e);
        process.exit(1);
    })
    .finally(async () => {
        await prisma.$disconnect();
    });
