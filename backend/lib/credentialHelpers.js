const prisma = require('./prisma');
const { calculateFinalScore } = require('./scoring'); 
const { issueCredential: issueIssuerCredential, issueCourseCredential } = require('./issuer'); 
const { createNotification } = require('./notifications');
const { buildCredentialPayload } = require('./credentialBuilder'); 

// Helper for descriptor logic
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
            status: 'PENDING',
        },
        create: {
            student_id: studentId,
            module_id: moduleId,
            descriptor,
            score: finalScore,
            type,
            payloadJson: payload,
            status: 'PENDING',
            issuedAt: null,
            txHash: null,
        },
    });
    return microCredential;
};

const updateLocalCourseCredential = async (studentId, courseId, descriptor, uniqueCourseCompetencies, evidenceModules, score, transcript, evidenceMicroCredentialIds) => {
    const course = await prisma.course.findUnique({
        where: { course_id: courseId },
    });
    const student = await prisma.student.findUnique({ where: { id: studentId }, include: { user: true } });

    const evidenceModuleIds = (evidenceModules || []).map(m => typeof m === 'string' ? m : m.id);

    const payload = buildCredentialPayload({
        student,
        course,
        type: 'COURSE_CREDENTIAL',
        score: score, 
        descriptor,
        demonstratedCompetencies: uniqueCourseCompetencies,
        evidenceModuleIds: evidenceModuleIds,
        evidenceModules: evidenceModules,
        transcript: transcript, 
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
            evidenceMicroCredentialIds: evidenceMicroCredentialIds,
            status: 'PENDING', 
        },
        create: {
            student_id: studentId,
            course_id: courseId,
            descriptor,
            evidenceModuleIds: evidenceModuleIds,
            evidenceMicroCredentialIds: evidenceMicroCredentialIds,
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
        await issueIssuerCredential(studentId, moduleId, type, score, descriptor, demonstratedCompetencies);
        console.log(`MicroCredential for student ${studentId}, module ${moduleId} added to issuance queue.`);
    } catch (error) {
        console.error(`Error adding MicroCredential to issuance queue:`, error);
    }
};

const performOnChainCourseCredentialIssuance = async (studentId, courseId, score, descriptor, demonstratedCompetencies, evidenceModules, transcript) => {
    try {
        await issueCourseCredential(studentId, courseId, descriptor, demonstratedCompetencies, evidenceModules, transcript);
        console.log(`CourseCredential for student ${studentId}, course ${courseId} added to issuance queue.`);
    } catch (error) {
        console.error(`Error adding CourseCredential to issuance queue:`, error);
    }
};

const checkAndIssueCourseCredential = async (studentId, courseId, isFinalEvent = false) => {
    console.log(`--- checkAndIssueCourseCredential for student ${studentId}, course ${courseId} ---`);
    
    const course = await prisma.course.findUnique({
        where: { course_id: courseId },
    });

    if (!course || !course.credentialModuleIds || course.credentialModuleIds.length === 0) {
        console.log('No required module IDs for this course.');
        return;
    }

    const existingCC = await prisma.courseCredential.findUnique({
        where: { student_id_course_id: { student_id: studentId, course_id: courseId } }
    });
    if (existingCC && existingCC.status === 'ISSUED') {
        console.log('Course Credential already issued.');
        return;
    }

    const requiredModuleIds = course.credentialModuleIds;

    const earnedMicroCredentials = await prisma.microCredential.findMany({
        where: {
            student_id: studentId,
            module_id: { in: requiredModuleIds },
            type: 'MICRO_CREDENTIAL',
            status: { in: ['ISSUED', 'PENDING'] }
        },
        include: {
            module: {
                select: {
                    module_id: true,
                    title: true,
                    yearOfStudy: true
                }
            }
        }
    });

    const earnedModuleIds = new Set(earnedMicroCredentials.map(mc => mc.module_id));
    const allCourseRequirementsMet = requiredModuleIds.every(reqId => earnedModuleIds.has(reqId));

    if (allCourseRequirementsMet) {
        const yearGroups = {};
        const evidenceMicroCredentialIds = []; // Collect IDs
        earnedMicroCredentials.forEach(mc => {
            evidenceMicroCredentialIds.push(mc.id); // Add to the list
            const year = mc.module.yearOfStudy || 1;
            if (!yearGroups[year]) yearGroups[year] = [];
            yearGroups[year].push(mc.score || 0);
        });

        const years = Object.keys(yearGroups).sort();
        const courseWeights = course.weighting || {};
        const totalWeightDefined = Object.values(courseWeights).reduce((a, b) => a + b, 0);
        
        let finalWeightedScore = 0;
        const transcript = [];

        years.forEach(year => {
            const scores = yearGroups[year];
            const avgYearScore = scores.reduce((a, b) => a + b, 0) / scores.length;
            
            let weight = courseWeights[year];
            if (weight === undefined) {
                const remainingWeight = 1 - totalWeightDefined;
                const undefinedYearsCount = years.filter(y => courseWeights[y] === undefined).length;
                weight = remainingWeight > 0 ? remainingWeight / undefinedYearsCount : 1 / years.length;
            }

            finalWeightedScore += (avgYearScore * weight);
            
            transcript.push({
                year: parseInt(year),
                score: parseFloat(avgYearScore.toFixed(2)),
                weight: parseFloat((weight * 100).toFixed(2)) + '%'
            });
        });

        const courseDescriptor = getDescriptor(finalWeightedScore);
        const evidenceModules = earnedMicroCredentials.map(mc => ({
            id: mc.module.module_id,
            title: mc.module.title
        }));

        const allCourseDemonstratedCompetencies = earnedMicroCredentials.flatMap(mc =>
            mc.payloadJson?.credentialSubject?.demonstratedCompetencies || []
        );
        const uniqueCourseCompetencies = Array.from(new Map(allCourseDemonstratedCompetencies.map(c => [c.id, c])).values());

        const localCourseCredential = await updateLocalCourseCredential(
            studentId, 
            courseId, 
            courseDescriptor, 
            uniqueCourseCompetencies, 
            evidenceModules, 
            finalWeightedScore,
            transcript,
            evidenceMicroCredentialIds // Pass the collected IDs
        );

        if (isFinalEvent) {
            await performOnChainCourseCredentialIssuance(
                studentId,
                courseId,
                finalWeightedScore,
                courseDescriptor,
                uniqueCourseCompetencies,
                evidenceModules,
                transcript
            );
        }
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

    if (!module) return;

    const finalScore = await calculateFinalScore(studentId, moduleId);
    const descriptor = getDescriptor(finalScore);

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

    const overallPassing = isPassing(descriptor, module.course.minDescriptor || 'ME') && hasMetCompetencyRequirements;
    const credentialType = overallPassing ? 'MICRO_CREDENTIAL' : 'STATEMENT_OF_ATTAINMENT';

    const demonstratedEvidence = await prisma.studentCompetencyEvidence.findMany({
        where: { studentId, moduleId, status: 'SUCCESS' },
        include: { competency: true },
    });
    const demonstratedCompetencies = demonstratedEvidence.map(evidence => ({
        id: evidence.competency.id,
        name: evidence.competency.name,
        description: evidence.competency.description,
    }));

    await updateLocalMicroCredential(studentId, moduleId, credentialType, finalScore, descriptor, demonstratedCompetencies);

    if (isFinalEvent && overallPassing) {
        await performOnChainMicroCredentialIssuance(studentId, moduleId, credentialType, finalScore, descriptor, demonstratedCompetencies);
    }

    await checkAndIssueCourseCredential(studentId, module.course_id, isFinalEvent);
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
