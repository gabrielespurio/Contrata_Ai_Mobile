import app from './app';
import { prisma } from './lib/prisma';

const PORT = process.env.PORT || 3001;

async function main() {
    try {
        await prisma.$connect();
        console.log('✅ Database connected successfully');

        app.listen(PORT, () => {
            console.log(`🚀 Server running on http://localhost:${PORT}`);
            console.log(`📱 Contrata AI Backend - ${process.env.NODE_ENV} mode`);
        });
    } catch (error) {
        console.error('❌ Failed to start server:', error);
        process.exit(1);
    }
}

main();
