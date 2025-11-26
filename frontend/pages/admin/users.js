'use client';
import Link from 'next/link';
import { UserGroupIcon, AcademicCapIcon } from '@heroicons/react/24/outline';
import { motion } from 'framer-motion';

const cardVariants = {
  hidden: { opacity: 0, y: 30 },
  visible: (i) => ({
    opacity: 1,
    y: 0,
    transition: { delay: i * 0.15, duration: 0.6, ease: 'easeOut' },
  }),
};


const UserManagementPage = () => {
  const cards = [
    {
      title: 'Assessor Management',
      description: 'Manage assessors, assign them to courses and modules.',
      icon: <UserGroupIcon className="h-10 w-10 text-primary group-hover:scale-110 transition-transform duration-300" />,
      href: '/admin/assessor-management',
    },
    {
      title: 'Student Management',
      description: 'Manage students and their enrollments.',
      icon: <AcademicCapIcon className="h-10 w-10 text-primary group-hover:scale-110 transition-transform duration-300" />,
      href: '/admin/student-management',
    },
  ];

  return (
    <>
      <motion.h1
        className="text-5xl font-extrabold mb-12 text-foreground tracking-tight bg-gradient-to-r from-primary via-purple-400 to-pink-400 bg-clip-text text-transparent"
        initial={{ opacity: 0, y: -20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.7 }}
      >
        User Management
      </motion.h1>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-10">
        {cards.map((card, i) => (
          <motion.div
            key={i}
            custom={i}
            variants={cardVariants}
            initial="hidden"
            animate="visible"
            className="flex"
          >
            <Link href={card.href} legacyBehavior>
              <a className="group block p-10 w-full rounded-2xl 
                bg-gradient-to-br from-indigo-500/10 via-purple-500/10 to-pink-500/10 
                border border-white/10 shadow-lg hover:shadow-2xl 
                hover:-translate-y-2 transition-all duration-500 
                backdrop-blur-lg flex flex-col justify-center hover:brightness-110">
                
                <div className="flex items-center space-x-6">
                  <div className="p-5 bg-primary/10 rounded-2xl shadow-inner">
                    {card.icon}
                  </div>
                  <div>
                    <h2 className="text-2xl font-semibold text-foreground group-hover:text-primary transition-colors duration-300">
                      {card.title}
                    </h2>
                    <p className="text-muted-foreground mt-2 leading-relaxed">
                      {card.description}
                    </p>
                  </div>
                </div>
              </a>
            </Link>
          </motion.div>
        ))}
      </div>
    </>
  );
};

export default UserManagementPage;