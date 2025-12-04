const prisma = require('./prisma');
const Bull = require('bull');
const { v4: uuidv4 } = require('uuid'); // Import uuidv4 for payload generation

const credentialIssuanceQueue = new Bull('credential-issuance', { redis: { host: process.env.REDIS_HOST, port: parseInt(process.env.REDIS_PORT, 10) } });

const stringify = require('json-stable-stringify');
const { ethers } = require('ethers');
const { buildCredentialPayload } = require('./credentialBuilder'); // Import buildCredentialPayload
const { createNotification } = require('./notifications'); // Import createNotification

const contractAbi = [
    {
      "inputs": [],
      "stateMutability": "nonpayable",
      "type": "constructor"
    },
    {
      "inputs": [
        {
          "internalType": "address",
          "name": "owner",
          "type": "address"
        }
      ],
      "name": "OwnableInvalidOwner",
      "type": "error"
    },
    {
      "inputs": [
        {
          "internalType": "address",
          "name": "account",
          "type": "address"
        }
      ],
      "name": "OwnableUnauthorizedAccount",
      "type": "error"
    },
    {
      "anonymous": false,
      "inputs": [
        {
          "indexed": true,
          "internalType": "bytes32",
          "name": "credentialHash",
          "type": "bytes32"
        },
        {
          "indexed": true,
          "internalType": "address",
          "name": "issuer",
          "type": "address"
        },
        {
          "indexed": false,
          "internalType": "string",
          "name": "metadataReference",
          "type": "string"
        }
      ],
      "name": "CredentialIssued",
      "type": "event"
    },
    {
      "anonymous": false,
      "inputs": [
        {
          "indexed": true,
          "internalType": "address",
          "name": "previousOwner",
          "type": "address"
        },
        {
          "indexed": true,
          "internalType": "address",
          "name": "newOwner",
          "type": "address"
        }
      ],
      "name": "OwnershipTransferred",
      "type": "event"
    },
    {
      "inputs": [
        {
          "internalType": "bytes32",
          "name": "credentialHash",
          "type": "bytes32"
        }
      ],
      "name": "getCredential",
      "outputs": [
        {
          "internalType": "address",
          "name": "",
          "type": "address"
        },
        {
          "internalType": "uint256",
          "name": "",
          "type": "uint256"
        },
        {
          "internalType": "string",
          "name": "",
          "type": "string"
        }
      ],
      "stateMutability": "view",
      "type": "function"
    },
    {
      "inputs": [
        {
          "internalType": "bytes32",
          "name": "credentialHash",
          "type": "bytes32"
        },
        {
          "internalType": "string",
          "name": "metadataReference",
          "type": "string"
        }
      ],
      "name": "issueCredential",
      "outputs": [],
      "stateMutability": "nonpayable",
      "type": "function"
    },
    {
      "inputs": [],
      "name": "owner",
      "outputs": [
        {
          "internalType": "address",
          "name": "",
          "type": "address"
        }
      ],
      "stateMutability": "view",
      "type": "function"
    },
    {
      "inputs": [],
      "name": "renounceOwnership",
      "outputs": [],
      "stateMutability": "nonpayable",
      "type": "function"
    },
    {
      "inputs": [
        {
          "internalType": "address",
          "name": "newOwner",
          "type": "address"
        }
      ],
      "name": "transferOwnership",
      "outputs": [],
      "stateMutability": "nonpayable",
      "type": "function"
    }
  ];

const DESCRIPTOR_RANK = {
  'EE': 3, // Exceeds Expectations
  'ME': 2, // Meets Expectations
  'AE': 1, // Approaches Expectations
  'BE': 0  // Below Expectations
};

const getDescriptor = (score) => {
  if (score >= 80) return 'EE';
  if (score >= 50) return 'ME';
  if (score >= 40) return 'AE';
  return 'BE';
};


async function checkAndIssueCourseCredential(student_id, course_id) { // This function is called from credentialHelpers
  console.log(`Checking course completion for student ${student_id} in course ${course_id}`);

  const course = await prisma.course.findUnique({
    where: { course_id },
    include: { modules: { where: { status: 'PUBLISHED' } } }
  });

  if (!course || course.modules.length === 0) {
    console.log('No active modules in course or course not found.');
    return;
  }

  const student = await prisma.student.findUnique({
    where: { id: student_id },
    include: { user: true, microCredentials: true, courseCredentials: { where: { course_id } } }
  });

  if (student.courseCredentials.length > 0) {
    console.log(`Student ${student_id} already has a credential for course ${course_id}.`);
    return;
  }

  const requiredModules = course.modules.map(m => m.module_id);
  const studentCredentials = await prisma.microCredential.findMany({ // Re-fetch to ensure payloadJson is available
      where: { student_id, module_id: { in: requiredModules } },
      include: { module: true },
  });


  const earnedModuleIds = new Set();
  const evidenceMicroCredentialIds = [];
  let totalScore = 0;

  for (const cred of studentCredentials) {
    if (requiredModules.includes(cred.module_id) && cred.status === 'ISSUED') {
      earnedModuleIds.add(cred.module_id);
      evidenceMicroCredentialIds.push(cred.id);
      totalScore += cred.score;
    }
  }

  const allModulesEarned = requiredModules.every(id => earnedModuleIds.has(id));

  if (allModulesEarned) {
    console.log(`All modules earned for student ${student_id} in course ${course_id}. Issuing course credential.`);

    const averageScore = totalScore / requiredModules.length;
    const courseDescriptor = getDescriptor(averageScore);

    // Aggregate demonstrated competencies from the micro-credentials that contributed to this course credential
    const allCourseDemonstratedCompetencies = studentCredentials.flatMap(mc =>
        mc.payloadJson?.credentialSubject?.demonstratedCompetencies || []
    );
    const uniqueCourseCompetencies = Array.from(new Map(allCourseDemonstratedCompetencies.map(c => [c.id, c])).values());

    const payload = buildCredentialPayload({
        student,
        course,
        type: 'COURSE_CREDENTIAL',
        score: averageScore, // Use averageScore for course
        descriptor: courseDescriptor, // Use courseDescriptor for course
        demonstratedCompetencies: uniqueCourseCompetencies,
        evidenceModuleIds: requiredModules,
    });

    const canonicalizedPayload = stringify(payload);
    const hash = ethers.keccak256(ethers.toUtf8Bytes(canonicalizedPayload));

    const provider = new ethers.JsonRpcProvider(process.env.SEPOLIA_RPC_URL);
    const wallet = new ethers.Wallet(process.env.ISSUER_PRIVATE_KEY, provider);
    const contract = new ethers.Contract(process.env.CONTRACT_ADDRESS, contractAbi, wallet);

    const tx = await contract.issueCredential(hash, payload.id);
    await tx.wait();

    await prisma.courseCredential.create({
      data: {
        student_id,
        course_id,
        descriptor: courseDescriptor,
        evidenceModuleIds: requiredModules,
        evidenceMicroCredentialIds,
        issuedAt: new Date(),
        payloadJson: payload,
        txHash: tx.hash,
        status: 'ISSUED',
      },
    });

    await prisma.notification.create({
        data: {
            userId: student.userId,
            message: `Congratulations! You've earned the course credential for "${course.name}".`,
        },
    });

    console.log(`Successfully issued course credential for student ${student_id} in course ${course_id}`);
  } else {
    console.log(`Student ${student_id} has not yet met requirements for course ${course_id}.`);
  }
}


credentialIssuanceQueue.process(async (job) => {
  const { student_id, module_id, course_id, type, score, descriptor, demonstratedCompetencies, evidenceModuleIds } = job.data;

  try {
    const student = await prisma.student.findUnique({
      where: { id: student_id },
      include: { user: true },
    });

    let payload;
    let newCredential;
    let notificationMessage;

    if (type === 'MICRO_CREDENTIAL') {
        const module = await prisma.module.findUnique({
            where: { module_id },
            include: { course: true },
        });
        if (!module) throw new Error('Module not found for MicroCredential issuance');

        payload = buildCredentialPayload({
            student,
            module,
            type: 'MICRO_CREDENTIAL',
            score,
            descriptor,
            demonstratedCompetencies,
        });

        const canonicalizedPayload = stringify(payload);
        const hash = ethers.keccak256(ethers.toUtf8Bytes(canonicalizedPayload));

        const provider = new ethers.JsonRpcProvider(process.env.SEPOLIA_RPC_URL);
        const wallet = new ethers.Wallet(process.env.ISSUER_PRIVATE_KEY, provider);
        const contract = new ethers.Contract(process.env.CONTRACT_ADDRESS, contractAbi, wallet);

        const tx = await contract.issueCredential(hash, payload.id);
        await tx.wait();

        newCredential = await prisma.microCredential.update({
            where: {
                student_id_module_id: {
                    student_id,
                    module_id,
                }
            },
            data: {
                type,
                score,
                descriptor,
                issuedAt: new Date(),
                payloadJson: payload,
                txHash: tx.hash,
                status: 'ISSUED',
            },
        });
        notificationMessage = `Congratulations! You've been issued a new credential for "${module.title}".`;

        // After issuing micro-credential, check if course credential can be issued
        if (newCredential) {
            await checkAndIssueCourseCredential(student_id, module.course_id);
        }

    } else if (type === 'COURSE_CREDENTIAL') {
        const course = await prisma.course.findUnique({
            where: { course_id },
            include: { modules: true },
        });
        if (!course) throw new Error('Course not found for CourseCredential issuance');

        payload = buildCredentialPayload({
            student,
            course,
            type: 'COURSE_CREDENTIAL',
            score, // Score here would be the average score calculated in checkAndIssueCourseCredential
            descriptor,
            demonstratedCompetencies, // Aggregated competencies
            evidenceModuleIds,
        });

        const canonicalizedPayload = stringify(payload);
        const hash = ethers.keccak256(ethers.toUtf8Bytes(canonicalizedPayload));

        const provider = new ethers.JsonRpcProvider(process.env.SEPOLIA_RPC_URL);
        const wallet = new ethers.Wallet(process.env.ISSUER_PRIVATE_KEY, provider);
        const contract = new ethers.Contract(process.env.CONTRACT_ADDRESS, contractAbi, wallet);

        const tx = await contract.issueCredential(hash, payload.id);
        await tx.wait();

        newCredential = await prisma.courseCredential.update({
            where: {
                student_id_course_id: {
                    student_id,
                    course_id,
                }
            },
            data: {
                descriptor,
                evidenceModuleIds,
                issuedAt: new Date(),
                payloadJson: payload,
                txHash: tx.hash,
                status: 'ISSUED',
            },
        });
        notificationMessage = `Congratulations! You've earned the course credential for "${course.name}".`;

    } else {
        throw new Error(`Unknown credential type: ${type}`);
    }

    await prisma.notification.create({
        data: {
            userId: student.userId,
            message: notificationMessage,
        },
    });

  } catch (error) {
    console.error('Error processing credential issuance job:', error);
    throw error;
  }
});

const issueCredential = async (student_id, module_id, type, score, descriptor, demonstratedCompetencies) => {
  await credentialIssuanceQueue.add({ student_id, module_id, type, score, descriptor, demonstratedCompetencies });
};

const issueCourseCredential = async (student_id, course_id, descriptor, demonstratedCompetencies, evidenceModuleIds) => {
    await credentialIssuanceQueue.add({ student_id, course_id, descriptor, demonstratedCompetencies, evidenceModuleIds, type: 'COURSE_CREDENTIAL' });
};

module.exports = {
  issueCredential,
  issueCourseCredential,
};