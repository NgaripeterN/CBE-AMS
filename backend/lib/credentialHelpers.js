const prisma = require('./prisma');
const { calculateFinalScore } = require('./scoring'); // Assuming calculateFinalScore is in scoring.js
const { issueCredential: issueIssuerCredential } = require('./issuer'); // Renamed to avoid conflict
const { createNotification } = require('./notifications');

// Helper for descriptor logic (needed in credentialHelpers)
const getDescriptor = (score) => {
    if (score >= 80) return 'EE';
    if (score >= 50) return 'ME';
    if (score >= 40) return 'AE';
    return 'BE';
};

const isPassing = (descriptor, minDescriptor) => {
    const descriptorRanks = { BE: 0, AE: 1, ME: 2, EE: 3 };
    return descriptorRanks[descriptor] >= descriptorRanks[minDescriptor];
};

const updateLocalMicroCredential = async (studentId, moduleId, type, finalScore, descriptor, demonstratedCompetencies) => {
    const student = await prisma.student.findUnique({ where: { id: studentId }, include: { user: true } });
    const module = await prisma.module.findUnique({ where: { module_id: moduleId }, include: { course: true } });

    const payload = {
        issuer: {
            name: 'CBE-AMS',
            id: 'did:example:123',
        },
        recipient: {
            saltedHashedStudentId: student.user.regNumber,
        },
        credentialSubject: {
            module_id: module.module_id,
            moduleCode: module.moduleCode,
            moduleTitle: module.title,
            course_id: module.course_id,
            moduleVersion: module.version,
            demonstratedCompetencies,
        },
        result: {
            descriptor,
            score: finalScore,
        },
        issuedOn: new Date().toISOString(),
        metadata: {
            schemaVersion: '1.1.0',
            canonicalizationVersion: '1.0.0',
            chainId: 'Sepolia',
            contractAddress: '0xabc', // Placeholder
        },
    };

    const microCredential = await prisma.microCredential.upsert({
        where: {
            student_id_module_id: {
                student_id: studentId,
                module_id: moduleId,
            },
        },
        update: {
            descriptor,
            score: finalScore,
            type,
            payloadJson: payload,
            status: 'PENDING', // Always PENDING initially, until on-chain issuance
        },
        create: {
            student_id: studentId,
            module_id: moduleId,
            descriptor,
            score: finalScore,
            type,
            payloadJson: payload,
            status: 'PENDING',
            issuedAt: null, // Not issued on-chain yet
            txHash: null,
        },
    });
    return microCredential;
};

const updateLocalCourseCredential = async (studentId, courseId, descriptor, uniqueCourseCompetencies) => {
    const course = await prisma.course.findUnique({
        where: { course_id: courseId },
    });
    const student = await prisma.student.findUnique({ where: { id: studentId }, include: { user: true } });

    const payload = {
        issuer: {
            name: 'CBE-AMS',
            id: 'did:example:123',
        },
        recipient: {
            saltedHashedStudentId: student.user.regNumber,
        },
        credentialSubject: {
            course_id: course.course_id,
            courseCode: course.code,
            courseTitle: course.name,
            evidenceModuleIds: course.credentialModuleIds,
            demonstratedCompetencies: uniqueCourseCompetencies,
        },
        issuedOn: new Date().toISOString(),
        metadata: {
            schemaVersion: '1.1.0',
            canonicalizationVersion: '1.0.0',
            chainId: 'Sepolia',
            contractAddress: '0xabc', // Placeholder
        },
    };

    const courseCredential = await prisma.courseCredential.upsert({
        where: {
            student_id_course_id: {
                student_id: studentId,
                course_id: courseId,
            }
        },
        update: {
            descriptor,
            payloadJson: payload,
            status: 'PENDING', // Always PENDING initially
        },
        create: {
            student_id: studentId,
            course_id: courseId,
            descriptor,
            evidenceModuleIds: course.credentialModuleIds,
            payloadJson: payload,
            status: 'PENDING',
            issuedAt: null,
            txHash: null,
        },
    });
    return courseCredential;
};

const performOnChainMicroCredentialIssuance = async (studentId, moduleId) => {
    const microCredential = await prisma.microCredential.findUnique({
        where: {
            student_id_module_id: {
                student_id: studentId,
                module_id: moduleId,
            },
        },
        include: {
            module: true, // Include module to get its title
        },
    });

    if (!microCredential || microCredential.status === 'ISSUED') {
        console.log(`MicroCredential for student ${studentId} and module ${moduleId} not found or already issued.`);
        return;
    }

    try {
        // Here would be the actual call to the blockchain issuance function
        // For now, we'll simulate it and update the local record.
        const txHash = `0x${Math.random().toString(36).substring(2, 15) + Math.random().toString(36).substring(2, 15)}`; // Simulated txHash

        await prisma.microCredential.update({
            where: { id: microCredential.id },
            data: {
                status: 'ISSUED',
                txHash: txHash,
                issuedAt: new Date(),
            },
        });
        console.log(`Successfully issued MicroCredential for student ${studentId}, module ${moduleId} on-chain. TxHash: ${txHash}`);

        const studentUser = await prisma.student.findUnique({
            where: { id: studentId },
            select: { userId: true },
        });
        if (studentUser) {
            await createNotification(
                studentUser.userId,
                `A micro-credential for module "${microCredential.module.title}" has been issued.`
            );
        }

    } catch (error) {
        console.error(`Error issuing MicroCredential for student ${studentId}, module ${moduleId} on-chain:`, error);
        // Depending on error, you might want to log, alert, or retry
    }
};

const performOnChainCourseCredentialIssuance = async (studentId, courseId) => {
    const courseCredential = await prisma.courseCredential.findUnique({
        where: {
            student_id_course_id: {
                student_id: studentId,
                course_id: courseId,
            },
        },
        include: {
            course: true, // Include course to get its name
        },
    });

    if (!courseCredential || courseCredential.status === 'ISSUED') {
        console.log(`CourseCredential for student ${studentId} and course ${courseId} not found or already issued.`);
        return;
    }

    try {
        // Here would be the actual call to the blockchain issuance function
        // For now, we'll simulate it and update the local record.
        const txHash = `0x${Math.random().toString(36).substring(2, 15) + Math.random().toString(36).substring(2, 15)}`; // Simulated txHash

        await prisma.courseCredential.update({
            where: { id: courseCredential.id },
            data: {
                status: 'ISSUED',
                txHash: txHash,
                issuedAt: new Date(),
            },
        });
        console.log(`Successfully issued CourseCredential for student ${studentId}, course ${courseId} on-chain. TxHash: ${txHash}`);

        const studentUser = await prisma.student.findUnique({
            where: { id: studentId },
            select: { userId: true },
        });
        if (studentUser) {
            await createNotification(
                studentUser.userId,
                `A course credential for course "${courseCredential.course.name}" has been issued.`
            );
        }

    } catch (error) {
        console.error(`Error issuing CourseCredential for student ${studentId}, course ${courseId} on-chain:`, error);
    }
};


const checkAndIssueCredentials = async (studentId, moduleId, isFinalEvent = false) => {
    const module = await prisma.module.findUnique({
        where: { module_id: moduleId },
        include: {
            course: true,
            competencies: { select: { id: true } }
        }
    });

    if (!module) {
        console.error(`Module with ID ${moduleId} not found.`);
        return;
    }

    const course = module.course;
    const minDescriptor = course.minDescriptor || 'ME';

    const finalScore = await calculateFinalScore(studentId, moduleId);
    const descriptor = getDescriptor(finalScore);

    // Competency Check
    let hasMetCompetencyRequirements = true;
    if (module.competencies && module.competencies.length > 0) {
        for (const competency of module.competencies) {
            // Get the count of successful evidence
            const successfulEvidenceCount = await prisma.studentCompetencyEvidence.count({
                where: {
                    studentId: studentId,
                    moduleId: moduleId,
                    competencyId: competency.id,
                    status: 'SUCCESS',
                },
            });

            // Get the total count of evidence submissions for this competency
            const totalEvidenceCount = await prisma.studentCompetencyEvidence.count({
                where: {
                    studentId: studentId,
                    moduleId: moduleId,
                    competencyId: competency.id,
                },
            });

            // If there's no evidence, they haven't met the requirement
            if (totalEvidenceCount === 0) {
                hasMetCompetencyRequirements = false;
                break;
            }

            // Check if the success rate is at least 50%
            const successRate = successfulEvidenceCount / totalEvidenceCount;
            if (successRate < 0.5) {
                hasMetCompetencyRequirements = false;
                break;
            }
        }
    }

    const overallPassing = isPassing(descriptor, minDescriptor) && hasMetCompetencyRequirements;
    const credentialType = overallPassing ? 'MICRO_CREDENTIAL' : 'STATEMENT_OF_ATTAINMENT';

    // Fetch demonstrated competencies for payload (common for both types)
    const demonstratedEvidence = await prisma.studentCompetencyEvidence.findMany({
        where: {
            studentId: studentId,
            moduleId: moduleId,
            status: 'SUCCESS',
        },
        include: {
            competency: true,
        },
    });
    const demonstratedCompetencies = demonstratedEvidence.map(evidence => ({
        id: evidence.competency.id,
        name: evidence.competency.name,
        description: evidence.competency.description,
    }));

    // Always update the local provisional micro-credential
    const localMicroCredential = await updateLocalMicroCredential(
        studentId,
        moduleId,
        credentialType,
        finalScore,
        descriptor,
        demonstratedCompetencies
    );

    // If this is the final event and overall passing, trigger on-chain issuance for micro-credential
    if (isFinalEvent && overallPassing) {
        await performOnChainMicroCredentialIssuance(studentId, moduleId);
    } else if (isFinalEvent && !overallPassing) {
        // If it's a statement of attainment and final event, we might still want to issue it on-chain
        // For now, we only issue MICRO_CREDENTIAL on-chain based on previous discussions.
        // This could be a configurable option.
    }

    // After potentially updating the micro-credential, check for CourseCredential
    const courseMicroCredentials = await prisma.microCredential.findMany({
        where: {
            student_id: studentId,
            module: { course_id: module.course.course_id },
            type: 'MICRO_CREDENTIAL', // Only count full micro-credentials for course credential
            status: 'ISSUED', // Only count already issued on-chain credentials
        },
    });

    const requiredModuleIds = module.course.credentialModuleIds;
    if (requiredModuleIds && requiredModuleIds.length > 0) {
        const earnedRequiredMicroCredentialIds = new Set(courseMicroCredentials.map(mc => mc.module_id));
        const allCourseRequirementsMet = requiredModuleIds.every(reqId => earnedRequiredMicroCredentialIds.has(reqId));

        // Aggregate all demonstrated competencies from the required micro-credentials
        const allCourseDemonstratedCompetencies = courseMicroCredentials.flatMap(mc =>
            mc.payloadJson.credentialSubject.demonstratedCompetencies || []
        );
        const uniqueCourseCompetencies = Array.from(new Map(allCourseDemonstratedCompetencies.map(c => [c.id, c])).values());

        if (allCourseRequirementsMet) {
            // Always update local provisional course credential
            await updateLocalCourseCredential(studentId, module.course.course_id, 'Completed', uniqueCourseCompetencies);

            // If this is the final event for the module, and all course requirements are met, trigger on-chain issuance for course credential
            if (isFinalEvent) {
                await performOnChainCourseCredentialIssuance(studentId, module.course.course_id);
            }
        }
    }
};

module.exports = {
    checkAndIssueCredentials,
    updateLocalMicroCredential,
    performOnChainMicroCredentialIssuance,
    updateLocalCourseCredential,
    performOnChainCourseCredentialIssuance,
    getDescriptor,
    isPassing,
};