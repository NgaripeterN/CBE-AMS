const prisma = require('./prisma');
const Bull = require('bull');
const { v4: uuidv4 } = require('uuid'); 

const credentialIssuanceQueue = new Bull('credential-issuance', { redis: { host: process.env.REDIS_HOST, port: parseInt(process.env.REDIS_PORT, 10) } });

const stringify = require('json-stable-stringify');
const { ethers } = require('ethers');
const { buildCredentialPayload } = require('./credentialBuilder');
const { createNotification } = require('./notifications');

const contractAbi = [
    { "inputs": [], "stateMutability": "nonpayable", "type": "constructor" },
    { "inputs": [{ "internalType": "address", "name": "owner", "type": "address" }], "name": "OwnableInvalidOwner", "type": "error" },
    { "inputs": [{ "internalType": "address", "name": "account", "type": "address" }], "name": "OwnableUnauthorizedAccount", "type": "error" },
    { "anonymous": false, "inputs": [{ "indexed": true, "internalType": "bytes32", "name": "credentialHash", "type": "bytes32" }, { "indexed": true, "internalType": "address", "name": "issuer", "type": "address" }, { "indexed": false, "internalType": "string", "name": "metadataReference", "type": "string" }], "name": "CredentialIssued", "type": "event" },
    { "anonymous": false, "inputs": [{ "indexed": true, "internalType": "address", "name": "previousOwner", "type": "address" }, { "indexed": true, "internalType": "address", "name": "newOwner", "type": "address" }], "name": "OwnershipTransferred", "type": "event" },
    { "inputs": [{ "internalType": "bytes32", "name": "credentialHash", "type": "bytes32" }], "name": "getCredential", "outputs": [{ "internalType": "address", "name": "", "type": "address" }, { "internalType": "uint256", "name": "", "type": "uint256" }, { "internalType": "string", "name": "", "type": "string" }], "stateMutability": "view", "type": "function" },
    { "inputs": [{ "internalType": "bytes32", "name": "credentialHash", "type": "bytes32" }, { "internalType": "string", "name": "metadataReference", "type": "string" }], "name": "issueCredential", "outputs": [], "stateMutability": "nonpayable", "type": "function" },
    { "inputs": [], "name": "owner", "outputs": [{ "internalType": "address", "name": "", "type": "address" }], "stateMutability": "view", "type": "function" },
    { "inputs": [], "name": "renounceOwnership", "outputs": [], "stateMutability": "nonpayable", "type": "function" },
    { "inputs": [{ "internalType": "address", "name": "newOwner", "type": "address" }], "name": "transferOwnership", "outputs": [], "stateMutability": "nonpayable", "type": "function" }
];

credentialIssuanceQueue.process(async (job) => {
  const { student_id, module_id, course_id, type, score, descriptor, demonstratedCompetencies, evidenceModules, transcript } = job.data;

  try {
    const student = await prisma.student.findUnique({
      where: { id: student_id },
      include: { user: true },
    });

    if (!student) throw new Error('Student not found for issuance');

    let payload;
    let notificationMessage;

    const provider = new ethers.JsonRpcProvider(process.env.SEPOLIA_RPC_URL);
    const wallet = new ethers.Wallet(process.env.ISSUER_PRIVATE_KEY, provider);
    const contract = new ethers.Contract(process.env.CONTRACT_ADDRESS, contractAbi, wallet);

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

        const hash = ethers.keccak256(ethers.toUtf8Bytes(stringify(payload)));
        const tx = await contract.issueCredential(hash, payload.id);
        await tx.wait();

        await prisma.microCredential.update({
            where: { student_id_module_id: { student_id, module_id } },
            data: {
                issuedAt: new Date(),
                payloadJson: payload,
                txHash: tx.hash,
                status: 'ISSUED',
            },
        });
        notificationMessage = `Congratulations! You've been issued a new micro-credential for "${module.title}".`;

    } else if (type === 'COURSE_CREDENTIAL') {
        const course = await prisma.course.findUnique({
            where: { course_id },
        });
        if (!course) throw new Error('Course not found for CourseCredential issuance');

        payload = buildCredentialPayload({
            student,
            course,
            type: 'COURSE_CREDENTIAL',
            score: score || null,
            descriptor,
            demonstratedCompetencies,
            evidenceModules: (evidenceModules || []).filter(id => id !== undefined && id !== null),
            transcript: transcript || [],
        });

        const hash = ethers.keccak256(ethers.toUtf8Bytes(stringify(payload)));
        const tx = await contract.issueCredential(hash, payload.id);
        await tx.wait();

        await prisma.courseCredential.update({
            where: { student_id_course_id: { student_id, course_id } },
            data: {
                issuedAt: new Date(),
                payloadJson: payload,
                txHash: tx.hash,
                status: 'ISSUED',
            },
        });
        notificationMessage = `Congratulations! You've earned the course credential for "${course.name}".`;
    }

    await createNotification(student.user.user_id, notificationMessage);

  } catch (error) {
    console.error('Error processing credential issuance job:', error);
    throw error;
  }
});

const issueCredential = async (student_id, module_id, type, score, descriptor, demonstratedCompetencies) => {
  await credentialIssuanceQueue.add({ student_id, module_id, type, score, descriptor, demonstratedCompetencies });
};

const issueCourseCredential = async (student_id, course_id, descriptor, demonstratedCompetencies, evidenceModules, transcript) => {
    await credentialIssuanceQueue.add({ student_id, course_id, descriptor, demonstratedCompetencies, evidenceModules, transcript, type: 'COURSE_CREDENTIAL' });
};

module.exports = {
  issueCredential,
  issueCourseCredential,
};
