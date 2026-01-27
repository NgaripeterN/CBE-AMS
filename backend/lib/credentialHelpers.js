const prisma = require('./prisma');
const { calculateFinalScore } = require('./scoring'); // Assuming calculateFinalScore is in scoring.js
const { issueCredential: issueIssuerCredential, issueCourseCredential } = require('./issuer'); // Renamed to avoid conflict
const { createNotification } = require('./notifications');
const { buildCredentialPayload } = require('./credentialBuilder'); // Import buildCredentialPayload

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

    const payload = buildCredentialPayload({
        student,
        module,
        type: 'MICRO_CREDENTIAL',
        score: finalScore,
        descriptor,
        demonstratedCompetencies,
    });
    
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

    const payload = buildCredentialPayload({
        student,
        course,
        type: 'COURSE_CREDENTIAL',
        score: null, // Course credentials don't have a direct score in this context
        descriptor,
        demonstratedCompetencies: uniqueCourseCompetencies,
        evidenceModuleIds: course.credentialModuleIds,
    });
    
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

const performOnChainMicroCredentialIssuance = async (studentId, moduleId, type, score, descriptor, demonstratedCompetencies) => {
    try {
        await issueIssuerCredential(
            studentId,
            moduleId,
            type,
            score,
            descriptor,
            demonstratedCompetencies
        );
        console.log(`MicroCredential for student ${studentId}, module ${moduleId} added to issuance queue.`);
    } catch (error) {
        console.error(`Error adding MicroCredential to issuance queue for student ${studentId}, module ${moduleId}:`, error);
    }
};

const performOnChainCourseCredentialIssuance = async (studentId, courseId, descriptor, demonstratedCompetencies, evidenceModuleIds) => {
    try {
        await issueCourseCredential(
            studentId,
            courseId,
            descriptor,
            demonstratedCompetencies,
            evidenceModuleIds
        );
        console.log(`CourseCredential for student ${studentId}, course ${courseId} added to issuance queue.`);
    } catch (error) {
        console.error(`Error adding CourseCredential to issuance queue for student ${studentId}, course ${courseId}:`, error);
    }
};

const checkAndIssueCourseCredential = async (studentId, courseId, isFinalEvent = false) => {
    console.log(`--- checkAndIssueCourseCredential for student ${studentId}, course ${courseId} ---`);
    
    const course = await prisma.course.findUnique({
        where: { course_id: courseId },
    });

    if (!course || !course.credentialModuleIds || course.credentialModuleIds.length === 0) {
        console.log('No required module IDs for this course or course not found.');
        return;
    }

    // Check if Course Credential already ISSUED
    const existingCC = await prisma.courseCredential.findUnique({
        where: { student_id_course_id: { student_id: studentId, course_id: courseId } }
    });
    if (existingCC && existingCC.status === 'ISSUED') {
        console.log('Course Credential already issued.');
        return;
    }

    const requiredModuleIds = course.credentialModuleIds;

    // Fetch earned micro-credentials (can be PENDING or ISSUED)
    const earnedMicroCredentials = await prisma.microCredential.findMany({
        where: {
            student_id: studentId,
            module_id: { in: requiredModuleIds },
            type: 'MICRO_CREDENTIAL',
            status: { in: ['ISSUED', 'PENDING'] }
        },
    });

    const earnedModuleIds = new Set(earnedMicroCredentials.map(mc => mc.module_id));
    const allCourseRequirementsMet = requiredModuleIds.every(reqId => earnedModuleIds.has(reqId));

    console.log(`Course requirements met: ${allCourseRequirementsMet}`);

    if (allCourseRequirementsMet) {
        // Aggregate demonstrated competencies from required micro-credentials
        const allCourseDemonstratedCompetencies = earnedMicroCredentials.flatMap(mc =>
            mc.payloadJson.credentialSubject.demonstratedCompetencies || []
        );
        const uniqueCourseCompetencies = Array.from(new Map(allCourseDemonstratedCompetencies.map(c => [c.id, c])).values());

        // Update local record
        const localCourseCredential = await updateLocalCourseCredential(studentId, courseId, 'Completed', uniqueCourseCompetencies);
        console.log(`Local CourseCredential updated/created: ${localCourseCredential.id}, Status: ${localCourseCredential.status}`);

        // Trigger on-chain issuance
        if (isFinalEvent) {
            console.log('Attempting on-chain CourseCredential issuance...');
            await performOnChainCourseCredentialIssuance(
                studentId,
                courseId,
                'Completed',
                uniqueCourseCompetencies,
                requiredModuleIds
            );
        }
    }
};


const checkAndIssueCredentials = async (studentId, moduleId, isFinalEvent = false) => {
    console.log('--- checkAndIssueCredentials Debug Start ---');
    console.log(`studentId: ${studentId}, moduleId: ${moduleId}, isFinalEvent: ${isFinalEvent}`);

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

    console.log(`finalScore: ${finalScore}, descriptor: ${descriptor}, minDescriptor: ${minDescriptor}`);

    // Competency Check
    let hasMetCompetencyRequirements = true;
    if (module.competencies && module.competencies.length > 0) {
        for (const competency of module.competencies) {
            const successfulEvidenceCount = await prisma.studentCompetencyEvidence.count({
                where: { studentId, moduleId, competencyId: competency.id, status: 'SUCCESS' },
            });
            const totalEvidenceCount = await prisma.studentCompetencyEvidence.count({
                where: { studentId, moduleId, competencyId: competency.id },
            });

            if (totalEvidenceCount === 0 || (successfulEvidenceCount / totalEvidenceCount) < 0.5) {
                hasMetCompetencyRequirements = false;
                break;
            }
        }
    }
    console.log(`hasMetCompetencyRequirements: ${hasMetCompetencyRequirements}`);

    const overallPassing = isPassing(descriptor, minDescriptor) && hasMetCompetencyRequirements;
    const credentialType = overallPassing ? 'MICRO_CREDENTIAL' : 'STATEMENT_OF_ATTAINMENT';

    // Fetch demonstrated competencies for payload
    const demonstratedEvidence = await prisma.studentCompetencyEvidence.findMany({
        where: { studentId, moduleId, status: 'SUCCESS' },
        include: { competency: true },
    });
    const demonstratedCompetencies = demonstratedEvidence.map(evidence => ({
        id: evidence.competency.id,
        name: evidence.competency.name,
        description: evidence.competency.description,
    }));

    // Update local micro-credential
    await updateLocalMicroCredential(studentId, moduleId, credentialType, finalScore, descriptor, demonstratedCompetencies);

    // Final event on-chain issuance
    if (isFinalEvent && overallPassing) {
        await performOnChainMicroCredentialIssuance(studentId, moduleId, credentialType, finalScore, descriptor, demonstratedCompetencies);
    }

    // Check for CourseCredential
    await checkAndIssueCourseCredential(studentId, module.course_id, isFinalEvent);
    
    console.log('--- checkAndIssueCredentials Debug End ---');
};

module.exports = {
    checkAndIssueCredentials,
    checkAndIssueCourseCredential,
    updateLocalMicroCredential,
    performOnChainMicroCredentialIssuance,
    updateLocalCourseCredential,
    performOnChainCourseCredentialIssuance,
    getDescriptor,
    isPassing,
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