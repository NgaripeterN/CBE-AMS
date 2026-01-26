import React from 'react';
import { useRouter } from 'next/router';
import Link from 'next/link';
import { motion } from 'framer-motion';
import { CalendarDaysIcon, PencilSquareIcon, SparklesIcon, ChartBarIcon } from '@heroicons/react/24/outline';

const CourseManagementDashboard = () => {
    const router = useRouter();
    const { courseId } = router.query;

    const cardVariants = {
        hidden: { opacity: 0, y: 20 },
        visible: { opacity: 1, y: 0, transition: { duration: 0.5 } },
    };

    if (!router.isReady || !courseId) {
        return <div>Loading...</div>;
    }

    const managementCards = [
        {
            name: 'Academic Calendar',
            description: 'Manage academic years and semesters.',
            href: `/assessor/course-management/academic-calendar?courseId=${courseId}`,
            icon: CalendarDaysIcon,
        },
        {
            name: 'Curriculum Designer',
            description: 'Define the course structure by assigning modules to specific years and semesters.',
            href: `/assessor/course-management/curriculum?courseId=${courseId}`,
            icon: PencilSquareIcon,
        },
        {
            name: 'Class Scheduling & Enrollment',
            description: 'Assign assessors to modules for a semester and enroll students.',
            href: `/assessor/course-management/offerings?courseId=${courseId}`,
            icon: SparklesIcon,
        },
        {
            name: 'Offering Performance',
            description: 'Analyze student performance metrics and pass rates across all modules.',
            href: `/assessor/course-management/performance?courseId=${courseId}`,
            icon: ChartBarIcon,
        },
    ];

    return (
        <div className="container mx-auto px-4 py-8">
            <h1 className="text-3xl font-bold text-gray-800 dark:text-white mb-8">Course Management Dashboard</h1>
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
                {managementCards.map((card, index) => (
                    <motion.div
                        key={card.name}
                        variants={cardVariants}
                        initial="hidden"
                        animate="visible"
                        transition={{ delay: index * 0.1 }}
                        className="h-full"
                    >
                        <Link href={card.href} passHref legacyBehavior>
                            <a className="block transform hover:scale-105 transition-transform duration-300 h-full">
                                <div className="bg-card rounded-2xl shadow-lg dark:shadow-dark-lg overflow-hidden h-full flex flex-col border border-primary/20 hover:border-primary/50 transition-all">
                                    <div className="p-6 flex flex-col h-full">
                                        <div className="p-3 bg-primary/10 rounded-xl w-fit mb-4">
                                            <card.icon className="h-8 w-8 text-primary" />
                                        </div>
                                        <h2 className="text-xl font-bold text-foreground mb-2">{card.name}</h2>
                                        <p className="text-muted-foreground text-sm flex-grow">{card.description}</p>
                                        <div className="mt-4 flex items-center text-primary font-bold text-sm">
                                            Manage 
                                            <svg xmlns="http://www.w3.org/2000/svg" className="h-4 w-4 ml-1" viewBox="0 0 20 20" fill="currentColor">
                                                <path fillRule="evenodd" d="M10.293 3.293a1 1 0 011.414 0l6 6a1 1 0 010 1.414l-6 6a1 1 0 01-1.414-1.414L14.586 11H3a1 1 0 110-2h11.586l-4.293-4.293a1 1 0 010-1.414z" clipRule="evenodd" />
                                            </svg>
                                        </div>
                                    </div>
                                </div>
                            </a>
                        </Link>
                    </motion.div>
                ))}
            </div>
        </div>
    );
};

export default CourseManagementDashboard;