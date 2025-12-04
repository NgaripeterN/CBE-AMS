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
    // We already have the necessary data passed in as arguments
    // No need to fetch microCredential again with includes

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
        // Depending on error, you might want to log, alert, or retry
    }
};

const performOnChainCourseCredentialIssuance = async (studentId, courseId, descriptor, demonstratedCompetencies, evidenceModuleIds) => {
    // We already have the necessary data passed in as arguments
    // No need to fetch courseCredential again with includes

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
        // Depending on error, you might want to log, alert, or retry
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
        console.log('--- checkAndIssueCredentials Debug End (Module Not Found) ---');
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
                console.log(`Competency ${competency.name}: No evidence found.`);
                break;
            }

            // Check if the success rate is at least 50%
            const successRate = successfulEvidenceCount / totalEvidenceCount;
            if (successRate < 0.5) {
                hasMetCompetencyRequirements = false;
                console.log(`Competency ${competency.name}: Success rate ${successRate} < 0.5`);
                break;
            }
            console.log(`Competency ${competency.name}: Successful evidence count ${successfulEvidenceCount}, total evidence count ${totalEvidenceCount}, success rate ${successRate}`);
        }
    }
    console.log(`hasMetCompetencyRequirements: ${hasMetCompetencyRequirements}`);

    const overallPassing = isPassing(descriptor, minDescriptor) && hasMetCompetencyRequirements;
    const credentialType = overallPassing ? 'MICRO_CREDENTIAL' : 'STATEMENT_OF_ATTAINMENT';

    console.log(`overallPassing: ${overallPassing}, credentialType: ${credentialType}`);

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
    console.log(`Local MicroCredential updated/created: ${localMicroCredential.id}, Status: ${localMicroCredential.status}`);

    // If this is the final event and overall passing, trigger on-chain issuance for micro-credential
    if (isFinalEvent && overallPassing) {
        console.log('Attempting on-chain MicroCredential issuance...');
        await performOnChainMicroCredentialIssuance(
            studentId,
            moduleId,
            credentialType, // Pass credentialType
            finalScore, // Pass finalScore
            descriptor, // Pass descriptor
            demonstratedCompetencies // Pass demonstratedCompetencies
        );
    } else if (isFinalEvent && !overallPassing) {
        console.log('Final event but not overall passing. Not issuing on-chain MicroCredential.');
        // If it's a statement of attainment and final event, we might still want to issue it on-chain
        // For now, we only issue MICRO_CREDENTIAL on-chain based on previous discussions.
        // This could be a configurable option.
    } else {
        console.log(`Not a final event (isFinalEvent: ${isFinalEvent}) or not overall passing (overallPassing: ${overallPassing}). Not attempting on-chain MicroCredential issuance.`);
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

        console.log(`Course requirements met: ${allCourseRequirementsMet}`);

        // Aggregate all demonstrated competencies from the required micro-credentials
        const allCourseDemonstratedCompetencies = courseMicroCredentials.flatMap(mc =>
            mc.payloadJson.credentialSubject.demonstratedCompetencies || []
        );
        const uniqueCourseCompetencies = Array.from(new Map(allCourseDemonstratedCompetencies.map(c => [c.id, c])).values());

        if (allCourseRequirementsMet) {
            // Always update local provisional course credential
            const localCourseCredential = await updateLocalCourseCredential(studentId, module.course.course_id, 'Completed', uniqueCourseCompetencies);
            console.log(`Local CourseCredential updated/created: ${localCourseCredential.id}, Status: ${localCourseCredential.status}`);

            // If this is the final event for the module, and all course requirements are met, trigger on-chain issuance for course credential
            if (isFinalEvent) {
                console.log('Attempting on-chain CourseCredential issuance...');
                await performOnChainCourseCredentialIssuance(
                    studentId,
                    module.course.course_id,
                    localCourseCredential.descriptor, // Pass course descriptor
                    uniqueCourseCompetencies, // Pass unique aggregated competencies
                    requiredModuleIds // Pass required module IDs
                );
            } else {
                console.log(`Not a final event (isFinalEvent: ${isFinalEvent}). Not attempting on-chain CourseCredential issuance.`);
            }
        } else {
            console.log('Course requirements not met. Not attempting on-chain CourseCredential issuance.');
        }
    } else {
        console.log('No required module IDs for this course. Not checking/issuing CourseCredential.');
    }
    console.log('--- checkAndIssueCredentials Debug End ---');
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