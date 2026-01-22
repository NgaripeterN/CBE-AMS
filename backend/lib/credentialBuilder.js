const { v4: uuidv4 } = require('uuid');

// Function to build a standardized credential payload (Blockcerts-like)
const buildCredentialPayload = ({
    student,
    module, // for micro-credential
    course, // for course-credential
    type, // 'MICRO_CREDENTIAL' or 'COURSE_CREDENTIAL'
    score,
    descriptor,
    demonstratedCompetencies,
    evidenceModuleIds, // for course-credential
    evidenceModules,
    transcript,
}) => {
    const uniqueDemonstratedCompetencies = Array.from(new Map(demonstratedCompetencies.map(comp => [comp.id, comp])).values());

    const issuer = {
        "type": "Profile",
        "id": process.env.ISSUER_ID || 'did:example:123', // Use actual issuer DID from environment variable
        "name": "CBE-AMS Issuer"
    };

    const credentialSubject = {
        "name": student.user.name,
        "type": "Person",
        "id": `urn:uuid:${student.user.user_id}`, // Use student's internal ID for now
        "registrationNumber": student.user.regNumber,
        "email": student.user.email, // Adding email here as well for easier access
        "descriptor": descriptor,
        "score": score,
        "demonstratedCompetencies": uniqueDemonstratedCompetencies,
    };

    const recipient = {
        "type": "email",
        "identity": student.user.email,
        "hashed": false,
    };

    const commonBadgeFields = {
        "type": "BadgeClass",
        "issuer": issuer,
        "result": {
            descriptor,
            score,
        },
    };

    let payload;

    if (type === 'MICRO_CREDENTIAL' && module) {
        payload = {
            "@context": ["https://www.w3.org/2018/credentials/v1", "https://w3id.org/blockcerts/v3"],
            "id": `urn:uuid:${uuidv4()}`,
            "type": ["VerifiableCredential", "BlockcertsCredential", "Assertion"],
            "issuanceDate": new Date().toISOString(),
            "credentialSubject": {
                ...credentialSubject,
                "module_id": module.module_id,
                "moduleCode": module.moduleCode,
                "moduleTitle": module.title,
                "moduleDescription": module.description, // Include module description
                "moduleVersion": module.version,
                "courseName": module.course?.name,
            },
            "recipient": recipient,
            "badge": {
                ...commonBadgeFields,
                "id": `urn:uuid:${module.module_id}`, // Use module ID for badge ID
                "name": module.title,
                "description": module.description,
                "criteria": {
                    "narrative": `Awarded for completing the module "${module.title}" with a descriptor of ${descriptor}.`,
                },
            },
            "issuer": issuer, // Top-level issuer is also needed in Blockcerts v3
            "proof": {}
        };
    } else if (type === 'COURSE_CREDENTIAL' && course) {
        payload = {
            "@context": ["https://www.w3.org/2018/credentials/v1", "https://w3id.org/blockcerts/v3"],
            "id": `urn:uuid:${uuidv4()}`,
            "type": ["VerifiableCredential", "BlockcertsCredential", "Assertion"],
            "issuanceDate": new Date().toISOString(),
            "credentialSubject": {
                ...credentialSubject,
                "course_id": course.course_id,
                "courseCode": course.code,
                "courseTitle": course.name,
                "courseDescription": course.description,
                "evidenceModules": evidenceModules,
                "transcript": transcript,
            },
            "recipient": recipient,
            "badge": {
                ...commonBadgeFields,
                "id": `urn:uuid:${course.course_id}`, // Use course ID for badge ID
                "name": course.name,
                "description": course.description,
                "criteria": {
                    "narrative": `Awarded for completing all required modules in the course "${course.name}".`,
                },
            },
            "issuer": issuer, // Top-level issuer is also needed in Blockcerts v3
            "proof": {}
        };
    } else {
        // Fallback for unexpected types, though should not be reached
        payload = {
            "@context": ["https://www.w3.org/2018/credentials/v1", "https://w3id.org/blockcerts/v3"],
            "id": `urn:uuid:${uuidv4()}`,
            "type": ["VerifiableCredential", "BlockcertsCredential", "Assertion"],
            "issuanceDate": new Date().toISOString(),
            "credentialSubject": credentialSubject,
            "recipient": recipient,
            "issuer": issuer,
            "proof": {}
        };
    }

    return payload;
};

module.exports = {
    buildCredentialPayload,
};